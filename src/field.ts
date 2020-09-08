export interface BaseField<TType extends string, TValue> {
  name: string;
  type: TType,
  value?: TValue;
  placeholder?: TValue;
  required: boolean;
  readOnly: boolean;
  label?: string;
};

export interface Checkbox extends BaseField<'checkbox', boolean> {
}

export interface Color extends BaseField<'color', string> {
}

export interface Date extends BaseField<'date', string> {
}

/**
 * @deprecated
 */
export interface DateTime extends BaseField<'datetime', Date> {
}

export interface DateTimeLocal extends BaseField<'datetime-local', Date> {
}

export interface Email extends BaseField<'email', string> {
}

export interface File extends BaseField<'file', never> {
}

export interface Hidden extends BaseField<'hidden', string> {
}

export interface Number extends BaseField<'number', number> {
  max?: number;
  min?: number;
  step?: number;
}

export interface Month extends BaseField<'month', string> {
}

export interface Password extends BaseField<'password', string> {
}

export interface Radio extends BaseField<'radio', string> {
  options?: Map<string, string>;
}

export interface Range extends BaseField<'range', number> {
  max?: number;
  min?: number;
  step?: number;
}

export interface Search extends BaseField<'search', string> {
}

export interface Tel extends BaseField<'tel', string> {
}

export interface Text extends BaseField<'text', string> {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp,
  options?: Map<string, string>;
}

export interface Time extends BaseField<'time', string> {
}

export interface Url extends BaseField<'url', string> {
}

export interface Week extends BaseField<'week', string> {
}

export type Field = Checkbox | Color | Date | DateTime | DateTimeLocal | Email
  | File | Hidden | Number | Month | Password | Radio | Range | Search | Tel
  | Text | Time | Url | Week; 
