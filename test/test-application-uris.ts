export class TestApplicationUris {

  constructor(private readonly testApplicationUri: string) {
  }

  createTenantUri() {
    return `${this.testApplicationUri}/${(Math.random() + 1).toString(36).substring(7)}`;
  }
}
