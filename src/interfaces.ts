import { IBackendRuntime } from '@gamaops/backend-framework';
import * as storage from '@gamaops/definitions/storage/types/v1';
import Logger from 'bunyan';
import { Consumer, Job } from 'hfxbus';
import { IActiveScriptPool } from 'hfxworker';
import { SignOptions } from 'jsonwebtoken';
import { Mongoose } from 'mongoose';
import { Root } from 'protobufjs';

export interface IProcessorPools {
	cryptography: IActiveScriptPool;
}

export interface IProcessorConsumers {
	storage: Consumer;
}

export interface IProcessorParameters {
	mongoose: Mongoose;
	consumers: IProcessorConsumers;
	logger: Logger;
	protos: Root;
	pools: IProcessorPools;
}

export interface IProcessorFunctions {
	signJwt(
		payload: any,
		key: string,
		options: SignOptions,
	): Promise<string>;
	pushJobUploadToken(
		job: Job,
		response: storage.ICreateUploadUrlResponse,
	): Promise<void>;
	pushJobCreateBucket(
		job: Job,
		bucket: storage.IBucket,
	): Promise<void>;
	createUploadUrl(
		job: Job,
	): Promise<void>;
	createBucket(
		job: Job,
	): Promise<void>;
}

export type ServiceRuntime = IBackendRuntime<IProcessorParameters, IProcessorFunctions>;
