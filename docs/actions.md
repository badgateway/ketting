Actions and forms
=================

*This page builds on the concepts from [Hypermedia](hypermedia.md).*

Some hypermedia formats describe the operations a client can perform, not
just the links it can follow. Ketting exposes these as *actions*, and supports:

* [HAL Forms][hal-forms] `_templates`, in `application/prs.hal-forms+json`,
  `application/hal+json` and plain JSON responses.
* [Siren][siren] `actions`.
* HTML `<form>` elements. Their fields are not parsed yet.

An action has a target `uri`, a `method`, a `contentType`, an optional `name`
and `title`, and a list of `fields`.

Given this HAL Forms document:

```json
{
  "_links": {
    "self": { "href": "/articles/1/messages" }
  },
  "_templates": {
    "send-message": {
      "method": "POST",
      "contentType": "application/json",
      "properties": [
        { "name": "body", "type": "textarea", "required": true },
        { "name": "priority", "type": "number", "value": 1 }
      ]
    }
  }
}
```

Finding an action
-----------------

Actions are on the `State` object:

```typescript
const state = await resource.get();

state.hasAction('send-message'); // true
state.hasAction();               // true if there is any action

const action = state.action('send-message');

// Same as action(), but returns undefined instead of throwing.
const maybeAction = state.findAction('send-message');

// All actions.
const allActions = state.actions();
```

`action()` throws an `ActionNotFound` error if the action does not exist.
Without a name, `action()` and `findAction()` return the first action, which is
handy for formats that only have one.

Submitting an action
--------------------

`submit()` sends the form and returns the response as a `State`:

```typescript
const responseState = await state
  .action('send-message')
  .submit({ body: 'Hi!' });
```

When the action is a `POST` that creates a resource, `submitFollow()`
returns the new `Resource` instead. It follows the same rules as
[`postFollow()`](getting-started.md#creating-resources-with-post):

```typescript
const messageResource = await state
  .action('send-message')
  .submitFollow({ body: 'Hi!' });
```

Before sending, Ketting:

* adds the pre-filled `value` of every field you did not provide, such as
  `priority` above;
* throws an error if a `required` field is missing and has no value.

The form data is encoded according to the action's `contentType`:

| Content type | Encoding |
| --- | --- |
| `application/json` | JSON |
| `application/x-www-form-urlencoded` | URL-encoded form |
| `multipart/form-data` | `FormData`; `Blob` and `File` values are sent as file parts |
| anything else | not supported, `submit()` throws |

When the action's method is `GET`, the form data is put in the query string
of the target URI and the result is fetched like any other resource.

Uploading files
---------------

With a `multipart/form-data` action, pass `Blob` or `File` values for file
fields. A `Uint8Array` (such as a Node.js `Buffer`) is sent as a binary part
too. Arrays are sent as repeated parts.

```typescript
const attachment = new Blob(['Hello'], { type: 'text/plain' });

await state
  .action('upload')
  .submit({ title: 'My file', attachment });
```

Fields
------

`action.fields` describes the form's fields, so a UI can render it.
`action.field(name)` returns a single field.

Every field has a `name`, a `type`, `required`, `readOnly`, and optionally a
`label`, a `placeholder` and a pre-filled `value`. Depending on the type, it
has extra properties:

| Type | Field type | Extra properties |
| --- | --- | --- |
| `text` | `TextField` | `minLength`, `maxLength`, `pattern` |
| `textarea` | `TextAreaField` | `minLength`, `maxLength`, `cols`, `rows` |
| `color`, `email`, `password`, `search`, `tel`, `url` | `BasicStringField` | `minLength`, `maxLength` |
| `number`, `range` | `NumberField` | `min`, `max`, `step` |
| `date`, `month`, `time`, `week` | `RangeStringField` | `min`, `max`, `step` |
| `datetime`, `datetime-local` | `DateTimeField` | `min`, `max`, `step` |
| `checkbox`, `radio` | `BooleanField` | |
| `hidden` | `HiddenField` | |
| `file` | `FileField` | |
| `select` | `SelectFieldSingle` or `SelectFieldMulti` | see below |

A HAL Forms property with `options` becomes a `select` field. `multiple`
tells whether one or several values can be selected, and `renderAs` hints at
how to render it (`dropdown`, `radio` or `checkbox`). The pre-filled
selection is in `selectedValue` (single) or `selectedValues` (multi); `value`
is deprecated.

A select field has exactly one of these option sources:

* `options` - The HAL Forms `inline` options, as a record mapping each value
  to its label.
* `dataSource` - The HAL Forms `link` options: a URI to fetch the options
  from, with its `type`, `labelField` and `valueField`.
* `linkSource` - A URI and a link relation: the options are the links with
  that relation on that resource. No built-in format produces it yet.

Ketting does not fetch `dataSource` or `linkSource` options itself.

[hal-forms]: https://rwcbook.github.io/hal-forms/
[siren]: https://github.com/kevinswiber/siren
