export interface BaseField<TType extends string, TValue> {
  name: string;
  type: TType,
  value?: TValue;
  placeholder?: TValue;
  required: boolean;
  readOnly: boolean;
  label?: string;
}

export type Checkbox = BaseField<'checkbox', boolean>

export type Color = BaseField<'color', string>

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
  options?: Map<string, string>;
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
