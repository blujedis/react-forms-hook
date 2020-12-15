/**
 * Default handler by field/element type.
 * These are predefined defaults that may be
 * overriden by the user.
 */

import get from 'lodash.get';
import { FieldHandler, FieldValue } from './types';

export const handleInput: FieldHandler = (field, initialData) => {

  const hasElementDefault = typeof field.defaultValue !== 'undefined' && field.defaultValue !== '';

  const getDefaultValue = () => {
    const modelValue = get(initialData, field.name);
    if (typeof modelValue !== 'undefined')
      return modelValue;
    return field.defaultValue;
  };

  const getValue = () => field.value;
  const setValue = (value: FieldValue) => {
    field.value = value;
  };

  return {
    hasElementDefault,
    getDefaultValue,
    getValue,
    setValue
  };

};

export const handleRadio: FieldHandler = (field, initialData) => {

  const getValue = () => {
    return [...(field as any).values()].find(opt => {
      return (opt as any).checked;
    }).value as FieldValue;
  };

  const val = getValue();
  const hasElementDefault = typeof val !== 'undefined' && val !== '';

  const getDefaultValue = () => {
    const modelValue = get(initialData, field.name);
    if (typeof modelValue !== 'undefined')
      return modelValue;
    return getValue();
  };

  const setValue = (value: FieldValue) => {
    [...(field as any).values()].forEach(opt => {
      (opt as any).checked = false;
      if (opt.value === value)
        (opt as any).checked = true;
    });
  };

  return {
    hasElementDefault,
    getDefaultValue,
    getValue,
    setValue
  };

};

export const handleCheckbox: FieldHandler = (field, initialData) => {

  const hasElementDefault = field.defaultChecked === true;

  const getDefaultValue = () => {
    const modelValue = get(initialData, field.name);
    if (typeof modelValue !== 'undefined')
      return modelValue;
    return field.defaultChecked;
  };

  const getValue = () => field.checked;

  const setValue = (value: FieldValue) => {
    field.checked = value as boolean;
  };

  return {
    hasElementDefault,
    getDefaultValue,
    getValue,
    setValue
  };

};

export const handleFile: FieldHandler = (field, initialData) => {

  const hasElementDefault = typeof field.defaultValue !== 'undefined' && field.defaultValue !== '';

  const getDefaultValue = () => {
    const modelValue = get(initialData, field.name);
    if (typeof modelValue !== 'undefined')
      return modelValue;
    return field.defaultValue;
  };

  const getValue = () => field.files;

  const setValue = (value: FieldValue) => {
    field.value = value;
  };

  return {
    hasElementDefault,
    getDefaultValue,
    getValue,
    setValue
  };

};

export const handleSelectMultiple: FieldHandler = (field, initialData) => {

  const getValue = () => {
    return [...field.options].reduce((a, c) => {
      if (c.selected)
        a = [...a, c.value];
      return a;
    }, []);
  };

  const getDefaultValue = () => {
    let modelValue = get(initialData, field.name);
    if (typeof modelValue !== 'undefined' && !Array.isArray(modelValue))
      modelValue = [modelValue] as any;
    if (typeof modelValue !== 'undefined')
      return modelValue;
    return getValue();
  };

  const val = getValue();
  const hasElementDefault = typeof val !== 'undefined' && !!val.length;

  const setValue = (value: FieldValue | FieldValue[]) => {
    if (typeof value !== 'undefined' && !Array.isArray(value))
      value = [value];

    const values = value as FieldValue[];

    [...field.options].forEach(opt => {
      opt.removeAttribute('selected');
      opt.selected = false;
      if (values.includes(opt.value) || (!opt.value && values.includes(opt.text))) {
        opt.selected = true;
        opt.setAttribute('selected', 'true');
      }
    });

  };

  return {
    hasElementDefault,
    getDefaultValue,
    getValue,
    setValue
  };

};

export const handleSelectOne: FieldHandler = (field, initialData) => {

  const handler = handleSelectMultiple(field, initialData);
  const val = handler.getValue()[0]
  const hasElementDefault = typeof val !== 'undefined' && val !== '';

  return {
    hasElementDefault,
    getDefaultValue: () => handler.getDefaultValue()[0],
    getValue: () => handler.getValue()[0],
    setValue: handler.setValue
  };

};