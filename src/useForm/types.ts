import { FormEvent } from 'react';
import { MutableRefObject } from 'react';

export type HTMLNode = Node & ParentNode;

export type FieldValue = string | number | boolean;

export interface IFieldHandler {
  hasElementDefault: boolean;
  getDefaultValue: () => FieldValue | FieldValue[];
  getValue: () => FieldValue | FieldValue[] | FileList;
  setValue: (value: FieldValue | FieldValue[], isInit?: boolean) => void;
}

export type FieldHandler = <T>(field: Field<T>, initialData: T, updateTouchDirtyState?: (field: Field<T>, shouldRender?: boolean) => void) => IFieldHandler;

export type FieldHandlers = Record<string, FieldHandler>;

export type ValidateHandlerResponse<T> = null | undefined | FieldErrors<T>;

export type ValidateHandler<T> = (values: T, fields?: FieldRefs<T>, form?: HTMLFormElement) => ValidateHandlerResponse<T> | Promise<ValidateHandlerResponse<T>>;

export type ValidateHandlerPromise<T> = (values: T, fields?: FieldRefs<T>, form?: HTMLFormElement) => Promise<FieldErrors<T>>;

export interface IOptions<T = any> {
  form?: string | HTMLFormElement | MutableRefObject<HTMLFormElement>;
  initialData?: T;
  fieldStrategy?: 'extend' | 'strict'; // default extend any found strict limits to only those fields.
  fields?: (Extract<keyof T, string> | IFieldConfig<T>)[];
  preventInputEnter?: boolean;
  renderPersist?: boolean; // some ui libs require this such as antd or you lose value.
  onInitValidate?: boolean; // validate on initialization.
  onValidateForm?: ValidateHandler<T>;
  onRegisterHandlers?: () => Record<string, FieldHandler>;
  /**
   * Allows model values to be transformed before output to 
   * form validation, onSubmit or when getting values from API. 
   * Forms utilize strings as such this allows for shaping model as needed.
   */
  onTransformValue?: (value: FieldValue | FieldValue[] | FileList, field: Field<T>) => any;
}

export interface IFieldConfig<T> {
  name: Extract<keyof T, string>;
  type?: string; // only for virtuals or custom handlers.
  defaultValue?: FieldValue | FieldValue[] | FileList;
  defaultChecked?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export type FieldConfig<T> = Record<keyof T, IFieldConfig<T>>;

export type FieldRefs<T> = Record<keyof T, Field<T>>;

export interface IField<T> extends IFieldConfig<T> {

  /////////////////////////////////////////////////////
  // Common
  /////////////////////////////////////////////////////

  name: Extract<keyof T, string>;
  readonly type: string;
  readonly tagName: string;
  handler?: IFieldHandler;
  unregister?: () => void;
  unbind?: () => void;

  //////////////////////////////////////////////////////
  // Value & Defaults
  //////////////////////////////////////////////////////

  value: FieldValue | FieldValue[],
  files?: FileList;
  options?: HTMLOptionsCollection;
  nodes?: RadioNodeList;
  values?: IterableIterator<any>;
  checked?: boolean;
  defaultValue?: FieldValue | FieldValue[];
  defaultChecked?: boolean;


  ///////////////////////////////////////////
  // Validation
  ///////////////////////////////////////////

  // ValidityState Props, Not all elements
  // support these in some cases, here more for 
  // convenience. If doesn't exist doesn't really hurt.
  validity?: ValidityState;
  required?: boolean;
  min?: string;
  max?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  step?: number; // not technically validation here for convenience.

}

// This is a bit convoluted as not each element
// supports these props but this is largely used
// internally. May change in future.
export type Field<T> = HTMLElement & IField<T>;

export interface IUseField<T> {
  element: FieldRefs<T>;
  readonly value: any;
  setValue: (value: any) => void;
  resetValue: () => void;
}

export type SubmitHandler<T> = (values: T, errors: any, e: FormEvent) => void;

export type ResetHandler<T> = (defaultValues: T, e: FormEvent) => void;

export type FieldErrors<T, E = any> = Record<keyof T, E[]>;
