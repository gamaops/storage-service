import {
	Counter,
} from 'prom-client';

export const storageCallsCounter = new Counter({
	name: 'storage_calls_total',
	help: 'Total calls to storage processor functions',
	labelNames: ['function'],
});

export const cryptographyCallsCount = new Counter({
	name: 'cryptography_calls_total',
	help: 'Total calls to cryptography functions',
	labelNames: ['function'],
});
