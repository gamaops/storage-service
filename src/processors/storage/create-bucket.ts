import {
	getJobOperationDate,
	JobOperation,
	parseObjectToProtobuf,
	parseProtobufToObject,
	removeEmptyKeys,
} from '@gamaops/backend-framework';
import { IBucket, ICreateBucketRequest } from '@gamaops/definitions/storage/types/v1';
import Logger from 'bunyan';
import { Job } from 'hfxbus';
import {
	Counter,
} from 'prom-client';
import { Type } from 'protobufjs';
import uuidv4 from 'uuid/v4';
import { ServiceRuntime } from '../../interfaces';
import { BucketModel } from '../../models';
import * as metrics from '../metrics';

export interface IPushJobCreateBucketContext extends ServiceRuntime {
	bucketType: Type;
}

export async function pushJobCreateBucket(
	this: IPushJobCreateBucketContext,
	job: Job,
	bucket: IBucket,
) {
	const bucketBuffer = parseObjectToProtobuf(
		bucket,
		this.bucketType,
	);

	await job
		.set('bucket', bucketBuffer)
		.push();
}

export interface ISignUpLeadContext extends ServiceRuntime {
	createBucketRequestType: Type;
	logger: Logger;
	callsCounter: Counter;
}

export async function createBucket(
	this: ISignUpLeadContext,
	job: Job,
) {

	this.callsCounter.inc({function: 'createBucket'});

	const {
		pushJobCreateBucket,
	} = this.fncs();

	const jobId = job.id;
	this.logger.info({jobId}, 'Received new job');

	const {
		request,
	} = await job.get('request', true).del('request').pull();

	const createBucketRequest = parseProtobufToObject<ICreateBucketRequest>(
		request,
		this.createBucketRequestType,
	);

	this.logger.debug({createBucketRequest}, 'Create bucket request');

	let { bucket } = createBucketRequest;

	removeEmptyKeys(bucket);

	bucket = {
		...bucket,
		...getJobOperationDate(job, JobOperation.CREATE),
	};

	const bucketModel = new BucketModel(bucket);
	const bucketId = uuidv4();

	bucket.bucketId = bucketId;
	bucketModel._id = bucket.bucketId;

	await bucketModel.save();

	this.logger.info({jobId, bucketId}, 'Bucket saved');

	bucket.createdAt = (bucket.createdAt as Date).toISOString();

	await pushJobCreateBucket(job, bucket);

}

export default (runtime: ServiceRuntime) => {

	const {
		logger,
		protos,
		consumers,
	} = runtime.params();

	const callsCounter = metrics.storageCallsCounter;
	const createBucketRequestType = protos.lookupType('storage.v1.CreateBucketRequest');
	const bucketType = protos.lookupType('storage.v1.Bucket');

	runtime.contextify(
		pushJobCreateBucket,
		{
			logger: logger.child({function: 'pushJobCreateBucket' }),
			bucketType,
		},
		{
			logErrors: 'async',
		},
	);

	runtime.contextify(
		createBucket,
		{
			logger: logger.child({function: 'createBucket' }),
			createBucketRequestType,
			callsCounter,
		},
		{
			logErrors: 'async',
		},
	);

	consumers.storage.process({
		stream: 'CreateBucket',
		processor: runtime.fncs().createBucket,
	});

};
