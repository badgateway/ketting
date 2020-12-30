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
 * The base type for things that are range-like.
 *
 * This includes numbers, dates and time fields.
 */
export interface RangeField<TType extends string, TValue> extends BaseField<TType, TValue>  {
  max?: number;
  min?: number;
  step?: number;
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
export type Date = RangeField<'date', string>

/**
 * @deprecated
 */
export type DateTime = RangeField<'datetime', Date>

export type DateTimeLocal = RangeField<'datetime-local', Date>

export type Email = BaseField<'email', string>

export type File = BaseField<'file', never>

export type Hidden = BaseField<'hidden', string | number | null | boolean>

export type Number = RangeField<'number', number>;

export type Month = RangeField<'month', string>

export type Password = BaseField<'password', string>

export interface Radio extends BaseField<'radio', string> {
  options?: Map<string, string>;
}

export type Range = RangeField<'range', number>;

export type Search = BaseField<'search', string>

export type Tel = BaseField<'tel', string>

export interface Text extends BaseField<'text', string> {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp,
  options?: Map<string, string>;
}

export interface TextArea extends BaseField<'textarea', string> {
  minLength?: number;
  maxLength?: number;
  cols?: number;
  rows?: number;
}

export type Time = RangeField<'time', string>

export type Url = BaseField<'url', string>

export type Week = RangeField<'week', string>

// eslint will want to fix the number type here
export type Field = Checkbox | Color | Date | DateTime | DateTimeLocal | Email
  // eslint-disable-next-line
  | File | Hidden | Number | Month | Password | Radio | Range | Search | Tel
  | Text | TextArea | Time | Url | Week;
