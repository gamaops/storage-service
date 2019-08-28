import { SignOptions } from 'jsonwebtoken';

export const uploadUrlTokenOptions: SignOptions = {
	issuer: process.env.UPLOAD_TOKEN_ISSUER,
};
