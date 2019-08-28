import fs from 'fs';
import { exposeWorker, ITask } from 'hfxworker';
import jsonwebtoken from 'jsonwebtoken';
import path from 'path';

export const ensureAbsoluteDirectory = (directory: string): string => {
	if (path.isAbsolute(directory)) {
		return directory;
	}
	return path.join(process.cwd(), directory);
};

export const readPrivateKey = (filePath: string): string => {
	return fs.readFileSync(
		ensureAbsoluteDirectory(filePath),
	).toString('utf8');
};

const PRIVATE_KEYS: any = {
	UPLOAD_URL: {
		key: readPrivateKey(process.env.UPLOAD_URL_PRIVATE_KEY!),
		passphrase: process.env.UPLOAD_URL_PRIVATE_KEY_PASSWORD || null,
	},
};

exposeWorker({
	signJwt: (task): Promise<ITask> => {
		return new Promise((resolve, reject) => {
			jsonwebtoken.sign(
				task.data!.payload,
				PRIVATE_KEYS[task.data!.key],
				{
					algorithm: 'RS256',
					...task.data!.options,
				},
				(error, token) => {
					if (error) {
						reject(error);
						return;
					}
					resolve({ data: {token} });
				},
			);
		});
	},
});
