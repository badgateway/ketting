import type { TestProject } from 'vitest/node';
import {TestApplication} from '#ketting-test/test-application.js';

export default function setup(project: TestProject) {

  const testApplication = TestApplication.start();

  project.provide('testApplicationUri', testApplication.uri);

  return function teardown() {
    testApplication.close();
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    testApplicationUri: string
  }
}
