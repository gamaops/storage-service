import { IFile } from '@gamaops/definitions/storage/types/v1';
import mongoose, { Document, Schema } from 'mongoose';

export interface IFileModel extends IFile, Document {
	_id: string;
}

const FileSchema = new Schema({
	_id: {
		type: String,
	},
	name: {
		type: String,
		required: true,
		trim: true,
	},
	path: {
		type: String,
		required: true,
		trim: true,
	},
	mimeType: {
		type: String,
		required: true,
		trim: true,
	},
	bucketId: {
		type: String,
		required: true,
		trim: true,
	},
	uploadUrl: {
		type: String,
		required: true,
		trim: true,
	},
	tags: {
		type: [String],
		trim: true,
	},
	size: {
		type: Number,
		required: true,
	},
	processor: {
		type: Number,
		required: true,
	},
	status: {
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

export const FileModel = mongoose.model<IFileModel>('File', FileSchema);
