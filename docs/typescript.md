TypeScript features
===================

Ketting is written in TypeScript and ships its type declarations. They work
with `skipLibCheck: false`, and do not require `@types/node`.

Typed resources
---------------

`Resource` and `State` take a generic type argument that describes the
resource's data. It defaults to `any`:

```typescript
// Resource<any>
const authorResource = await articleResource.follow('author');
```

When you know the shape of the data, pass it to the method that returns the
resource:

```typescript
type Author = {
  firstName: string;
  lastName: string;
};

// Resource<Author>
const authorResource = await articleResource.follow<Author>('author');

// State<Author>
const authorState = await authorResource.get();

// string
const firstName = authorState.data.firstName;
```

The same generic is available on every method that returns resources:

```typescript
client.go<Author>('/authors/1');
resource.go<Author>('../authors/1');
client.follow<Author>('author');
await client.mayFollow<Author>('author');   // Resource<Author> | undefined
resource.followAll<Author>('item');          // resolves to Resource<Author>[]
state.follow<Author>('author');
state.mayFollow<Author>('author');           // Resource<Author> | undefined
state.followAll<Author>('item');             // Resources<Author>
```

A typed resource types `get()`, `refresh()` and `getCache()` with the data
type, and the `data` passed to `put()`:

```typescript
class Resource<T = any> {
  get(options?: GetRequestOptions): Promise<State<T>>;
  refresh(options?: GetRequestOptions): Promise<State<T>>;
  getCache(): State<T> | null;
  put(options: PutRequestOptions<T> | State): Promise<void>;
  patch(options: PatchRequestOptions): Promise<State<T> | undefined>;
  post(options: PostRequestOptions): Promise<State>;
  postFollow(options: PostRequestOptions): Promise<Resource>;
}
```

The request bodies of `post()` and `patch()`, and the resource returned by
`postFollow()`, are not typed.

Typed actions
-------------

`action()` and `findAction()` take the type of the form data:

```typescript
type Message = { body: string };

await state.action<Message>('send-message').submit({ body: 'Hi!' });
```

Fields
------

`Field` is a union discriminated on `type` (and on `multiple` for `select`),
so you can narrow it:

```typescript
for (const field of action.fields) {
  if (field.type === 'number') {
    console.log(field.min, field.max);
  }
}
```

The individual field types, such as `TextField` and `SelectFieldMulti`, are
exported. See [Actions and forms](actions.md#fields).
