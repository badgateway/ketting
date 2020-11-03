/**
 * A Field describes a single field in an action or form.
 *
 * Fields can be used to automatically render forms or other UIs based on
 * hypermedia actions.
 */
export interface BaseField<TType extends string, TValue> {
  /**
   * Name of the field.
   *
   * Typically this is the property that will get sent to a server.
   */
  name: string;

  /**
   * Type describes the type of the property.
   *
   * This is similar to the HTML5 "type" attribute on forms.
   */
  type: TType,

  /**
   * The current (pre-filed) value on the form.
   */
  value?: TValue;

  /**
   * This could be used to describe a sample value.
   */
  placeholder?: TValue;

  /**
   * Whether this field is required for submitting the form.
   */
  required: boolean;

  /**
   * Render the field as read-only.
   */
  readOnly: boolean;

  /**
   * A human-readable label for the field.
   */
  label?: string;
}


/**
 * A checkbox basically behaves like a boolean.
 */
export type Checkbox = BaseField<'checkbox', boolean>

/**
 * A color picker.
 */
export type Color = BaseField<'color', string>

/**
 * A 'date' field.
 */
export type Date = BaseField<'date', string>

/**
 * @deprecated
 */
export type DateTime = BaseField<'datetime', Date>

export type DateTimeLocal = BaseField<'datetime-local', Date>

export type Email = BaseField<'email', string>

export type File = BaseField<'file', never>

export type Hidden = BaseField<'hidden', string>

export interface Number extends BaseField<'number', number> {
  max?: number;
  min?: number;
  step?: number;
}

export type Month = BaseField<'month', string>

export type Password = BaseField<'password', string>

export interface Radio extends BaseField<'radio', string> {
  options: Map<string, string>;
}

export interface Range extends BaseField<'range', number> {
  max?: number;
  min?: number;
  step?: number;
}

export type Search = BaseField<'search', string>

export type Tel = BaseField<'tel', string>

export interface Text extends BaseField<'text', string> {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp,
  options?: Map<string, string>;
}

export type Time = BaseField<'time', string>

export type Url = BaseField<'url', string>

export type Week = BaseField<'week', string>

// eslint will want to fix the number type here
export type Field = Checkbox | Color | Date | DateTime | DateTimeLocal | Email
// eslint-disable-next-line
  | File | Hidden | Number | Month | Password | Radio | Range | Search | Tel
  | Text | Time | Url | Week;
