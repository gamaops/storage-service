import { ServiceRuntime } from '../../interfaces';

import addCreateBucket from './create-bucket';
import addCreateUploadUrl from './create-upload-url';

export default (runtime: ServiceRuntime) => {
	addCreateBucket(runtime);
	addCreateUploadUrl(runtime);
};
