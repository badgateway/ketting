import { test as baseTest } from 'vitest';
import {TestApplicationUris} from '#ketting-test/test-application-uris.js';

export const test = baseTest.extend<{
    testApplicationUri: string,
    testApplicationUris: TestApplicationUris
}>({
  testApplicationUri: [async (_, use) => { await use('https://default.example.org'); }, {injected: true, auto: true }],
  testApplicationUris: [async ({testApplicationUri}, use) => { await use(new TestApplicationUris(testApplicationUri)); }, { auto: true }],
});

export const it = test;

export const describe = test.describe;

export const beforeAll = test.beforeAll;
export const afterAll = test.afterAll;

export {expect} from 'vitest';
