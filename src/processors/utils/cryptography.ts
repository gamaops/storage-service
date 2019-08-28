import { ITask } from 'hfxworker';
import * as jsonwebtoken from 'jsonwebtoken';
import {
	Counter,
} from 'prom-client';
import { ServiceRuntime } from '../../interfaces';
import * as metrics from '../metrics';

export interface ISignJwtContext extends ServiceRuntime {
	callsCounter: Counter;
	signJwt(task: ITask): Promise<ITask>;
}

export async function signJwt(
	this: ISignJwtContext,
	payload: any,
	key: string,
	options: jsonwebtoken.SignOptions,
): Promise<string> {

	this.callsCounter.inc({ function: 'signJwt' });

	const result = await this.signJwt({
		releaseBefore: true,
		data: {
			payload,
			key,
			options,
		},
	});

	return result.data!.token;

}

export default (runtime: ServiceRuntime) => {

	const {
		pools,
	} = runtime.params();

	const callsCounter = metrics.cryptographyCallsCount;

	runtime.contextify(
		signJwt,
		{
			signJwt: pools.cryptography.getMethod('signJwt'),
			callsCounter,
		},
	);

};
