import {
	parseObjectToProtobuf,
	parseProtobufToObject,
} from '@gamaops/backend-framework';
import { ICreateUploadUrlRequest, ICreateUploadUrlResponse } from '@gamaops/definitions/storage/types/v1';
import Logger from 'bunyan';
import { Job } from 'hfxbus';
import path from 'path';
import {
	Counter,
} from 'prom-client';
import { Type } from 'protobufjs';
import { URL } from 'url';
import uuidv4 from 'uuid/v4';
import { ServiceRuntime } from '../../interfaces';
import { BucketModel } from '../../models';
import * as metrics from '../metrics';
import { uploadUrlTokenOptions } from '../utils/credentials';

export interface IPushUploadTokenContext extends ServiceRuntime {
	createUploadUrlResponseType: Type;
}

export async function pushJobUploadToken(
	this: IPushUploadTokenContext,
	job: Job,
	response: ICreateUploadUrlResponse,
) {
	const responseBuffer = parseObjectToProtobuf(
		response,
		this.createUploadUrlResponseType,
	);

	await job
		.set('createUploadUrlResponse', responseBuffer)
		.push();
}

export interface ICreateUploadUrlContext extends ServiceRuntime {
	createUploadUrlRequestType: Type;
	logger: Logger;
	callsCounter: Counter;
}

export async function createUploadUrl(
	this: ICreateUploadUrlContext,
	job: Job,
) {

	this.callsCounter.inc({function: 'createUploadUrl'});

	const {
		signJwt,
		pushJobUploadToken,
	} = this.fncs();

	const jobId = job.id;
	this.logger.info({jobId}, 'Received new job');

	const {
		request,
	} = await job
		.get('request', true)
		.del('request')
		.pull();

	const createUploadUrlRequest = parseProtobufToObject<ICreateUploadUrlRequest>(
		request,
		this.createUploadUrlRequestType,
	);

	this.logger.debug({createUploadUrlRequest}, 'Create upload url request');

	const { bucketId } = createUploadUrlRequest;

	const query = BucketModel.findById(bucketId, {
		upload: 1,
		maxSize: 1,
		tags: 1,
		acceptedMimeTypes: 1,
		processor: 1,
	});

	const bucket = await query.exec();

	if (!bucket || !bucket.upload!.url || !bucket.upload!.maxCount) {
		this.logger.debug({bucket}, 'Upload rejected due: missing url, or falsy maxCount or invalid bucket');
		await pushJobUploadToken(job, {
			success: false,
		});
		return;
	}

	const uploadUrl = new URL(bucket.upload!.url);
	const uploadId = uuidv4();

	uploadUrl.pathname = path.join(
		uploadUrl.pathname,
		uploadId,
	);

	const uploadTokenPayload: any = {
		bucketId,
		processor: bucket.processor,
		tags: bucket.tags,
		field: bucket.upload!.fieldName,
		maxCount: bucket.upload!.maxCount,
	};

	if (bucket.maxSize) {
		uploadTokenPayload.maxSize = bucket.maxSize;
	}

	if (bucket.acceptedMimeTypes) {
		uploadTokenPayload.mimeTypes = bucket.acceptedMimeTypes;
	}

	this.logger.debug({uploadTokenPayload}, 'Upload token generated');

	const uploadToken = await signJwt(
		uploadTokenPayload,
		'UPLOAD_URL',
		{
			...uploadUrlTokenOptions,
			subject: createUploadUrlRequest.subject,
			audience: uploadUrl.toString(),
			jwtid: uploadId,
			expiresIn: bucket.upload!.tokenExpirationSeconds + 's',
		},
	);

	await pushJobUploadToken(job, {
		success: true,
		uploadToken,
	});

}

export default (runtime: ServiceRuntime) => {

	const {
		logger,
		protos,
		consumers,
	} = runtime.params();

	const callsCounter = metrics.storageCallsCounter;
	const createUploadUrlRequestType = protos.lookupType('storage.v1.CreateUploadUrlRequest');
	const createUploadUrlResponseType = protos.lookupType('storage.v1.CreateUploadUrlResponse');

	runtime.contextify(
		pushJobUploadToken,
		{
			logger: logger.child({function: 'pushJobUploadToken' }),
			createUploadUrlResponseType,
		},
		{
			logErrors: 'async',
		},
	);

	runtime.contextify(
		createUploadUrl,
		{
			logger: logger.child({function: 'createUploadUrl' }),
			createUploadUrlRequestType,
			callsCounter,
		},
		{
			logErrors: 'async',
		},
	);

	consumers.storage.process({
		stream: 'CreateUploadUrl',
		processor: runtime.fncs().createUploadUrl,
	});

};
