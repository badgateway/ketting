import * as url from 'url';

interface Resource {

  uri: string;

  follow(rel: string): FollowPromise<Resource>
  followAll(rel: string): FollowPromise<Resource[]>
  go(relativeUri: string): Resource;

  get(): Promise<State<any>>;
  head(): Promise<HeadState>;
  put(state: State<any>): Promise<void>;
  delete(): Promise<void>
  post(request: PostRequest): Promise<null|Resource>;
  patch(request: PatchRequest): Promise<void>;

  // When we have a new state, due to a PUT request, or a new
  // GET request.
  on(event: 'state', handler: (res: Resource, state: State<any>) => void): void;

  // When the cache times out, or when a non-safe method is executed.
  on(event: 'expire', handler: (res: Resource) => void): void;

  // Basically the full fetch feature but the url is optional
  fetch(): any;

}

interface State<T> {

  body: T;
  links: Links;

  // Open question. Which headers are important?
  // Many aren't. Think: Connection
  // Some are critical, such as Content-Type.
  // Which get sent back, which don't? Manybe just the `Content-*` headers?
  headers: Headers;
  timeStamp: number;

}

// Example of an extended State
interface SirenState<T> extends State<T> {

  // example of an extended state object.
  action(name: string): SirenAction;
  actions(): SirenAction[];

}

// Example of an action
interface SirenAction {
  name: string;
  href: string;
  method: string;
  fields: any[]; // too lazy to write out
  submit(params: any[]): Promise<Resource>;
}

interface HeadState {

  links: Links;
  headers: Headers;
  timeStamp: number;

}

interface Client {
  // This is the old 'main' object. I think this should become a
  // global/singleton. This has tradeoffs but also causes a LOT less objects
  // to be passed around everywhere.

  // All the auth config
  auth: any;

  // Baseurl can be inferred from document.location in browsers, but this is
  // the old 'bookmark'
  baseUrl: string;

  follow(rel: string): FollowPromise<Resource>
  followAll(rel: string): FollowPromise<Resource[]>
  go(relativeUri: string): Resource;

  // Having a global resource cache is still good
  resourceCache: Map<string, Resource>;

  // HTTP cache. Too big to write out now
  httpCache: any;

}


// This will be a 'PromiseLike'
interface FollowPromise<T> {

  follow(rel: string): FollowPromise<Resource>;
  followAll(rel: string): FollowPromise<Resource>;

  prefetch(): this;
  preferTransclude(): this;
  preferPush(): this;

  // Trigger HEAD request
  useHead(): this;

  // These signatures are not complete:
  then(): Promise<T>;
  catch(): Promise<T>;
  finally(): Promise<T>;
}

interface Links {

  get(rel: string): Link | null;
  getMany(rel: string): Link[];
  has(rel: string): boolean;
  set(link: Link): void;

}

interface Headers {

  get(name: string): string|null;
  getMany(rel: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;

}

interface Link {
  rel: string;
  href: string;
  'type'?: string;
  title?: string;
  anchor?: string;
  hreflang?: string;
  [attr: string]: string|undefined;
}

interface PostRequest {
  body: any;
  headers: Headers;
}

type PatchRequest = PostRequest;
