import {run} from 'node:test';
import {spec} from 'node:test/reporters';
import {TestApplication} from './test-application.js';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {finished} from 'node:stream/promises';

const testApplication = TestApplication.start();
const currentDirectory = dirname(fileURLToPath(import.meta.url));

const testOutput = run({
  globPatterns: [
    `${currentDirectory}/**/*.test.ts`
  ],
  execArgv: ['--import', 'tsx'],
  argv: ['--test-application-uri', testApplication.uri]
})
  .on('test:fail', () => process.exitCode = 1)
  .compose(spec);

testOutput
  .pipe(process.stdout);

await finished(testOutput);
testApplication.close();
