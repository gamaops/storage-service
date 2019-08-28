import { IBucket } from '@gamaops/definitions/storage/types/v1';
import mongoose, { Document, Schema } from 'mongoose';

export interface IBucketModel extends IBucket, Document {
	_id: string;
}

const UploadSchema = new Schema({
	url: {
		type: String,
		index: true,
		sparse: true,
		unique: true,
	},
	fieldName: {
		type: String,
	},
	tokenExpirationSeconds: {
		type: Number,
	},
	maxCount: {
		type: Number,
	},
}, {
	_id: false,
});

const BucketSchema = new Schema({
	_id: {
		type: String,
	},
	name: {
		type: String,
		required: true,
		trim: true,
	},
	upload: {
		type: UploadSchema,
		required: true,
	},
	acceptedMimeTypes: {
		type: [String],
		lowercase: true,
		trim: true,
	},
	tags: {
		type: [String],
		trim: true,
	},
	maxSize: {
		type: Number,
		required: true,
	},
	processor: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
	},
	createdJobId: {
		type: String,
	},
	updatedAt: {
		type: Date,
	},
	updatedJobId: {
		type: String,
	},
});

export const BucketModel = mongoose.model<IBucketModel>('Bucket', BucketSchema);
