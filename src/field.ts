export type Field =
  BooleanField |
  BasicStringField |
  DateTimeField |
  FileField |
  HiddenField |
  NumberField |
  SelectFieldSingle |
  SelectFieldMulti |
  RangeStringField |
  TextAreaField |
  TextField;

/**
 * A Field describes a single field in an action or form.
 *
 * Fields can be used to automatically render forms or other UIs based on
 * hypermedia actions.
 */
export interface BaseField<T> {
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
  type: string;

  /**
   * The current (pre-filed) value on the form.
   */
  value?: T;

  /**
   * This could be used to describe a sample value.
   */
  placeholder?: T;

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
export interface RangeField<T> extends BaseField<T>  {
  max?: number;
  min?: number;
  step?: number;
}

/**
 * Toggles/checkboxes
 */
export interface BooleanField extends BaseField<boolean> {
  type: 'checkbox' | 'radio';
}

/**
 * Any field that encodes itself as a string but with no
 * special features.
 */
export interface BasicStringField extends BaseField<string> {
  type: 'color' | 'email' | 'password' | 'search' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
}

export interface RangeStringField extends RangeField<string> {
  type: 'date' | 'month' | 'time' | 'week';
}

export interface DateTimeField extends RangeField<Date> {
  type: 'datetime' | 'datetime-local';
}

export interface HiddenField extends BaseField<string | number | null | boolean> {
  type: 'hidden';
}

export interface FileField extends BaseField<never> {
  type: 'file';
}

export interface NumberField extends RangeField<number> {
  type: 'number' | 'range';
}

/**
 * OptionsDataSource is a helper type that specifiess the different data
 * sources for lists of options.
 */

export type OptionsDataSource = {
  /**
   * Keys and values are labels and values.
   *
   * If specified as a plain array, use array values as labels and values.
   */
  options: Record<string, string> | string[];
} | {
  /**
   * If dataSource is specified, we'll grab the list of options from a
   * simple csv or json resource.
   */
  dataSource: {
    /**
     * URI where the list of options can be acquired.
     */
    href: string;

    /**
     * Could be text/csv or any json content-type.
     */
    type?: string;

    /**
     * If datasource returns an array of objects, use this
     * property for the label. Defaults to 'label'
     *
     * This is ignored if it doesn't apply for the media type.
     */
    labelField?: string;

    /**
     * If datasource returns an array of objects, use this
     * property for the value. Defaults to 'value'
     *
     * This is ignored if it doesn't apply for the media type.
     */
    valueField?: string;
  };
} | {
  /**
   * If 'linkSource' is specified, we assume that the value will be a URI.
   *
   * We will grab the list of options by fetching a resource, and getting
   * a list of links specified by a rel.
   */
  linkSource: {
    href: string;
    rel: string;
  };
}

/**
 * Encodes a field that has a list of options a user can choose from.
 */
export type SelectFieldSingle = BaseField<string> & {
  type: 'select';
  renderAs?: 'radio' | 'dropdown';
  multiple?: false;
} & OptionsDataSource;

/**
 * An options field where users can select more than 1 item
 */
export type SelectFieldMulti = BaseField<string> & {
  type: 'select';
  renderAs?: 'checkbox' | 'dropdown';
  multiple: true;
} & OptionsDataSource;


export interface TextField extends BaseField<string> {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface TextAreaField extends BaseField<string> {
  type: 'textarea';
  minLength?: number;
  maxLength?: number;
  cols?: number;
  rows?: number;
}
