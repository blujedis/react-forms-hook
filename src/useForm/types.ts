import { FormEvent } from 'react';
import { MutableRefObject } from 'react';

export type HTMLNode = Node & ParentNode;

export type FieldValue = string | number | boolean;

export interface IFieldHandler {
  hasElementDefault: boolean;
  getDefaultValue: () => FieldValue | FieldValue[];
  getValue: () => FieldValue | FieldValue[] | FileList[];
  setValue: (value: FieldValue | FieldValue[]) => void;
}

export type FieldHandler = <T>(field: Field<T>, initialData: T) => IFieldHandler;

export type FieldHandlers = Record<string, FieldHandler>;

export type ValidateHandlerResponse<T> = null | undefined | false | FieldErrors<T>;

export type ValidateHandler<T> = (values: T, fields: FieldRefs<T>) => ValidateHandlerResponse<T> | Promise<ValidateHandlerResponse<T>>;

export type ValidateHandlerPromise<T> = (values: T, fields: FieldRefs<T>) => Promise<FieldErrors<T>>;

export interface IUseFormOptions<T> {
  form?: string | HTMLFormElement | MutableRefObject<HTMLFormElement>;
  initialData?: T;
  fields?: (Extract<keyof T, string> | IFieldConfig<T>)[];
  preventInputEnter?: boolean;
  onValidateForm?: ValidateHandler<T>;
  onRegisterHandlers?: () => Record<string, FieldHandler>;
}

export interface IFieldConfig<T> {
  name: keyof T;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export type FieldConfig<T> = Record<keyof T, IFieldConfig<T>>;

export type FieldRefs<T> = Record<keyof T, Field<T>>;

export interface IField<T> {
  name: Extract<keyof T, string>;
  type: string;
  tagName: string;
  value: FieldValue | FieldValue[],
  files?: FileList[];
  options?: HTMLOptionsCollection;
  nodes?: RadioNodeList;
  values?: IterableIterator<any>;
  checked?: boolean;
  defaultValue?: FieldValue | FieldValue[];
  defaultChecked?: boolean;
  handler?: IFieldHandler;
  config?: IFieldConfig<T>;
  unregister?: () => void;
  unbind?: () => void;
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
