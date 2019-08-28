import { ServiceRuntime } from '../interfaces';

import addStorage from './storage';
import addCryptography from './utils/cryptography';

export default (runtime: ServiceRuntime) => {
	addCryptography(runtime);
	addStorage(runtime);
};
