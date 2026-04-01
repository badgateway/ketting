import minimist from 'minimist';

const testApplicationUri: string = minimist(process.argv.slice(2))['test-application-uri'];

const createRandomString = () => (Math.random() + 1).toString(36).substring(7);

export const createTenantUri = (): string => `${testApplicationUri}/${createRandomString()}`;
