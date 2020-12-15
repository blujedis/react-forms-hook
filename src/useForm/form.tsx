import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isForm, isInvalidRadioList, isPromise, isRadioList, onDomRemoveField } from './utils';
import { Field, FieldHandlers, FieldRefs, FieldValue, IFieldConfig, IUseField, IUseFormOptions, SubmitHandler, FieldErrors, ValidateHandlerPromise, ResetHandler } from './types';
import { handleCheckbox, handleFile, handleInput, handleRadio, handleSelectMultiple, handleSelectOne } from './handlers';
import { dequal } from 'dequal';
import { FormEvent } from 'react';


// Default elements that should fire on "input" instead of "change".
const INPUT_CHANGE_TYPES = [
  'select-one', 'select-multiple', 'radio',
  'checkbox', 'file', 'submit', 'reset'
];

const defaultHandlers = {
  'text': handleInput,
  'radio': handleRadio,
  'file': handleFile,
  'select-one': handleSelectOne,
  'select-multiple': handleSelectMultiple,
  'checkbox': handleCheckbox
};

function useForm<E = any, T = Record<string, any>>(props: IUseFormOptions<T>) {

  props = {
    form: 'form',
    initialData: {} as T,
    fields: [] as Extract<keyof T, string>[],
    preventInputEnter: true,
    ...props
  };

  const { form, fields, initialData, preventInputEnter, onRegisterHandlers, onValidateForm } = props;

  // Resettable refs.
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRefs = useRef<FieldRefs<T>>({} as any);
  const touchedRefs = useRef<Extract<keyof T, string>[]>([]);
  const dirtyRefs = useRef<Extract<keyof T, string>[]>([]);
  const errorRefs = useRef<FieldErrors<T, E>>(null);
  const submitCountRef = useRef(0);
  const submittingRef = useRef(false);
  const submittedRef = useRef(false);

  // We do not reset these refs.
  // they are bound to outside data
  // or need to persist.
  const initialDataRef = useRef(initialData);
  const defaultsRef = useRef(initialData);
  const handlerRefs = useRef<FieldHandlers>(registerHandlers());

  // Watches to see if defaults should be reinit.
  const shouldReinitDefaults = dequal(initialData, initialDataRef.current);

  const [, renderer] = useState(null);

  useEffect(() => {
    if (typeof form !== 'undefined' && form !== null) {
      if (typeof form === 'string')
        formRef.current = document.querySelector(form);
      else if (typeof form === 'object' && form.current)
        formRef.current = form.current;
      else if (isForm(form))
        formRef.current = form as HTMLFormElement;
      else
        throw new Error(`Form element type of ${typeof form} is NOT supported.`);
    }
    return () => {
      formRef.current = null;
    }
  }, [form]);

  useEffect(() => {

    if (isForm(formRef.current)) {

      formRef.current.setAttribute('novalidate', '');

      resetRefs();

      initialDataRef.current = initialData;
      defaultsRef.current = initialData;

      const elements = formRef.current.elements;
      const configs = normalizeConfigs(fields);
      const hasConfigs = !!fields.length;

      for (const k in elements) {

        const config = hasConfig(k, configs);

        if (/^\d+$/.test(k) || typeof elements[k] === 'function' || k === 'length' || (hasConfigs && !config)) continue;

        if (isInvalidRadioList(elements[k] as any)) {
          console.warn(`Skipping invalid NodeList for ${k}, ensure type is "radio" or remove duplicate names.`);
          continue;
        }

        const field = elements[k] as Field<T>;
        field.config = config;
        fieldRefs.current[k] = field;

        initField(field);

      }

      // Register Mutation observer.
      onDomRemoveField(fieldRefs);

    }

    return () => {
      const fields = Object.values(fieldRefs.current) as Field<T>[] || [];
      fields.forEach(field => field.unregister());
      resetRefs(true);
    }

  }, [formRef.current]);

  useEffect(() => {
    if (typeof defaultsRef.current !== 'undefined') {
      const fields = Object.values(fieldRefs.current) as Field<T>[];
      for (const field of fields) {
        if (field.handler) {
          const defaultValue = field.handler.getDefaultValue();
          defaultsRef.current[field.name as any] = defaultValue;
          if (typeof defaultValue !== 'undefined' && defaultValue !== '')
            field.handler.setValue(defaultValue);
        }
      }
    }
  }, [shouldReinitDefaults]);


  //////////////////////////////////////
  // Private Methods
  //////////////////////////////////////

  function registerHandlers() {
    let handlers = { ...defaultHandlers };
    if (onRegisterHandlers)
      handlers = { ...handlers, ...onRegisterHandlers() };
    return handlers as FieldHandlers;
  }

  function resetRefs(resetFields = false) {
    // only done in cleanup.
    if (resetFields)
      fieldRefs.current = {} as any;
    touchedRefs.current = [];
    dirtyRefs.current = [];
    errorRefs.current = null;
    submitCountRef.current = 0;
    submittingRef.current = false;
    submittedRef.current = false;
  }

  function fieldToName(fieldOrName: Extract<keyof T, string> | Field<T>) {
    let name = fieldOrName as Extract<keyof T, string>;
    if (typeof fieldOrName !== 'string')
      name = fieldOrName.name as Extract<keyof T, string>;
    return name;
  }

  function isTouched(fieldOrName: Extract<keyof T, string> | Field<T>) {
    return touchedRefs.current.includes(fieldToName(fieldOrName));
  }

  function isDirty(fieldOrName: Extract<keyof T, string> | Field<T>) {
    return dirtyRefs.current.includes(fieldToName(fieldOrName));
  }

  function isDirtyCompared(fieldOrName: Extract<keyof T, string> | Field<T>, value: any) {
    const defs = defaultsRef.current || {} as any;
    const name = fieldToName(fieldOrName);
    return !dequal(defs[name], value);
  }

  function setTouched(fieldOrName: Extract<keyof T, string> | Field<T>) {
    const name = fieldToName(fieldOrName);
    const clone = [...touchedRefs.current];
    if (!touchedRefs.current.includes(name))
      touchedRefs.current = [...clone, name];
  }

  function setDirty(fieldOrName: Extract<keyof T, string> | Field<T>) {
    const name = fieldToName(fieldOrName);
    const clone = [...dirtyRefs.current];
    if (!dirtyRefs.current.includes(name))
      dirtyRefs.current = [...clone, name];
  }

  function removeDirty(fieldOrName: Extract<keyof T, string> | Field<T>) {
    const name = fieldToName(fieldOrName);
    dirtyRefs.current = dirtyRefs.current.filter(v => v !== name);
  }

  function removeFieldRef(key: keyof T) {
    delete fieldRefs.current[key];
  }

  function normalizeConfigs(ctrls: (Extract<keyof T, string> | IFieldConfig<T>)[] = []) {
    return (ctrls || []).map(v => {
      if (typeof v !== 'object')
        return { name: v };
      return v;
    }) as IFieldConfig<T>[];
  }

  function hasConfig(key: string, configs: IFieldConfig<T>[]) {
    return configs.find(v => v.name === key);
  }

  async function validateForm(): Promise<FieldErrors<T>> {

    if (!onValidateForm)
      return Promise.resolve(null);

    const values = getValue();
    const fields = fieldRefs.current;

    let validator = onValidateForm as ValidateHandlerPromise<T>;

    if (!isPromise(onValidateForm))
      validator = ((v, f) => Promise.resolve(onValidateForm(v, f) as any));

    // Don't really care about errors here other than to log
    // let user know. If a value is returned there are errors
    // which should be in form of { key: array[] } where the array
    // can be whatever the user wants for displaying each error for
    // each property key in the form.
    try {
      const result = await validator(values, fields);
      if (typeof result == 'object' && !Array.isArray(result) && result !== null)
        errorRefs.current = result;
      return result;
    }
    catch (ex) {
      console.error(ex);
      return null;
    }

  }

  function updateTouchDirtyState(field: Field<T>, shouldRender = false) {

    const name = field.name;

    const prevTouched = isTouched(name);
    const prevDirty = isDirty(name);
    const dirtyCompared = isDirtyCompared(name, field.handler.getValue());

    if (dirtyCompared) {
      setDirty(name);
    }

    if (!dirtyCompared && !prevTouched) {
      setTouched(name);
    }

    if (!!dirtyCompared || prevTouched) {
      setTouched(name);
    }

    if (!dirtyCompared && prevDirty)
      removeDirty(name);

    if (shouldRender)
      render();

  }

  function bindEvents(field: Field<T>) {

    const events = [];

    // if (typeof clone.validateOnBlur === 'undefined' && typeof clone.validateOnChange === 'undefined')
    // clone.validateOnBlur = true;

    let isValidateBlur;
    let isValidateChange;

    if (['checkbox', 'radio'].includes(field.type)) {
      isValidateBlur = false;
      isValidateChange = true;
    }
    else {
      isValidateChange = false;
      isValidateBlur = true;
    }

    const handleEnter = (e: Event) => {
      // @ts-ignore
      if (e.key === 'Enter' || e.keyCode === 13) {
        if (field.type === 'textarea')
          return e.stopPropagation();
        e.preventDefault();
      }
    };

    const handleBlur = async (e) => {
      if (field.hasAttribute('disabled') && field.hasAttribute('readonly'))
        return;
      await validateForm();
      updateTouchDirtyState(field, true);
    }

    const handleChange = async (e) => {
      if (field.hasAttribute('disabled') && field.hasAttribute('readonly'))
        return;
      await validateForm();
      updateTouchDirtyState(field, true);
    }

    // Prevents triggering submit etc one enter key.
    // May need to limit this for some elements.
    if (preventInputEnter) {
      field.addEventListener('keypress', handleEnter);
      events.push(['keypress', handleEnter]);
    }

    // Attach blur
    if (isValidateBlur) {
      field.addEventListener('blur', handleBlur);
      events.push(['blur', handleBlur]);
    }

    // Attach change.
    if (isValidateChange) {
      const event = INPUT_CHANGE_TYPES.includes(field.type) ? 'input' : 'change';
      field.addEventListener(event, handleChange);
      events.push([event, handleChange]);
    }

    // Unbind attached events.
    field.unbind = () => {
      events.forEach(tuple => {
        const [names, listener] = tuple;
        let _names = names as string[];
        if (!Array.isArray(names) && typeof names !== 'undefined')
          _names = [names];
        field.removeEventListener(_names.join(' '), listener);
      });
    };

    return events;

  }

  function unregister(field: Field<T>) {
    field.unbind();
    removeFieldRef(field.name);
  }

  function normalizeField(field: Field<T>) {

    // Everything is JS is any object so event though this is an 
    // array we can attach props as we primarily need them
    // internally.
    if (isRadioList(field)) {

      const list = field as unknown as RadioNodeList;
      const item = list[0] as Field<T>;

      field.name = item.name;
      (field as any).tagName = item.tagName;
      field.type = item.type;
      const initHandler = handlerRefs.current[field.type];

      if (!initHandler) {
        console.warn(`Failed to load form element handler for ${field.name}`);
        return field;
      }

      field.handler = initHandler(field, initialDataRef.current);

      return field;

    }
    else {

      const initHandler = handlerRefs.current[field.type] || handlerRefs.current['text'];

      if (!initHandler) {
        console.warn(`Failed to load form element handler for ${field.name}`);
        return field;
      }

      field.handler = initHandler(field, initialDataRef.current);


      return field;

    }

  }

  function initField(field: Field<T>) {

    // Configure the element.
    field = normalizeField(field);

    // Bind events by type.
    // If radio we need to iterate the list.
    if (field.type === 'radio') {
      const radios = [];
      [...(field as any).values()].forEach(elem => {
        bindEvents(elem);
        radios.push(elem);
      });
      // This allows us to call as we normally would
      // in "unregister" as we do with other fields.
      field.unbind = () => {
        radios.forEach(r => r.unbind());
      };
    }
    else {
      bindEvents(field);
    }

    field.unregister = () => unregister(field);

  }

  function getValueOrValues(key?: keyof T) {

    const getValueByHandler = (k: keyof T) => {
      const field = fieldRefs.current[k];
      if (!field.handler)
        return '';
      return field.handler.getValue();
    };

    if (typeof key !== 'undefined')
      return getValueByHandler(key);

    return Object.keys(fieldRefs.current).reduce((a, c) => {
      a[c] = getValueByHandler(c as keyof T);
      return a;
    }, {} as T);

  }

  function setValueOrValues(keyOrModel: T | keyof T, value?: any) {

    const setValueByHandler = (k: keyof T, v: any) => {
      const field = fieldRefs.current[k];
      if (!field.handler)
        return;
      return field.handler.setValue(v);
    };

    // Key value passed.
    if (typeof value !== 'undefined')
      return setValueByHandler(keyOrModel as keyof T, value);

    // Iterate model and set values.
    return Object.keys(keyOrModel as T).forEach(k => setValueByHandler(k as keyof T, keyOrModel[k]));

  }

  function getErrorOrErrors(key?: keyof T) {
    if (!key)
      return errorRefs.current;
    return errorRefs.current[key];
  }

  //////////////////////////////////////
  // Public Methods
  //////////////////////////////////////

  function render() {
    renderer({});
  }

  function getValue(key: keyof T): FieldValue;
  function getValue(): T;
  function getValue(key?: keyof T) {
    return getValueOrValues(key);
  }

  function setValue(key: keyof T, value: any)
  function setValue(values: T)
  function setValue(key: keyof T | T, value?: any) {
    setValueOrValues(key, value);
  }

  function getError(key?: keyof T): any[];
  function getError(): FieldErrors<T, E>;
  function getError(key?: keyof T) {
    return getErrorOrErrors(key);
  }

  function setError(errors?: FieldErrors<T, E>) {
    errorRefs.current = errors || null;
  }

  function reset(values?: T) {
    resetRefs();
    formRef.current.reset();
    let newValues = values;
    if (values)
      setValue(values);
    newValues = getValue();
    render();
    return newValues;
  }


  function handleReset(fn: ResetHandler<T>)
  function handleReset(event: FormEvent)
  function handleReset(fnOrEvent?: FormEvent | ResetHandler<T>) {

    const handleCallback = async (e) => {

      if (e) {
        e.preventDefault();
        e.persist();
      }

      const defaultValues = reset();

      (fnOrEvent as ResetHandler<T>)(defaultValues, e);

    };

    // User wrapped function.
    if (typeof fnOrEvent === 'function') {
      return (e) => {
        return handleCallback(e);
      };
    }

    // Form directly calling callback.
    return handleCallback(fnOrEvent);


  }

  function handleSubmit(fn: SubmitHandler<T>) {

    const handleCallback = async (e) => {

      const model = getValue();
      const errors = await validateForm();

      submittingRef.current = false;
      submittedRef.current = true;

      render();

      fn(model, errors, e);

    };

    return async (e) => {

      if (e) {
        e.preventDefault();
        e.persist();
      }

      submitCountRef.current += 1;
      submittingRef.current = true;

      handleCallback(e);

    };

  }

  function useField<K extends keyof T>(name: Extract<K, string>) {

    const getElement = () => {
      return fieldRefs.current[name as keyof T] || null;
    };

    const safeGetElement = () => {
      return getElement() || { value: null };
    }

    const getValue = () => {
      return safeGetElement().value;
    }

    const setValue = (value = '') => {
      getElement().value = value;
    };

    const resetValue = () => {
      setValue(defaultsRef.current[name as any]);
    }

    return {
      get element() {
        return getElement();
      },
      get value() {
        return getValue();
      },
      get isTouched() {
        return isTouched(name);
      },
      get isDirty() {
        return isDirty(name);
      },
      get errors() {
        return getError(name);
      },
      get isValid() {
        const errors = getError(name) || [];
        return !errors.length;
      },
      blur() {
        const elem = getElement();
        if (elem)
          elem.blur();
      },
      focus() {
        const elem = getElement();
        if (elem)
          elem.focus();
      },
      setValue,
      resetValue
    };

  }

  function useFields<K extends keyof T>(...names: K[]) {
    return names.reduce((a, c) => {
      a[c] = useField(c);
      return a;
    }, {} as any) as Record<K, IUseField<T>>;
  }

  const state = useMemo(() => {
    return {
      get touched() { return touchedRefs.current },
      get dirty() { return dirtyRefs.current },
      get values() { return getValue(); },
      get submitCount() { return submitCountRef.current; },
      get submitting() { return submittingRef.current; },
      get submitted() { return submittedRef.current; },
      get isDirty() { return dirtyRefs.current.length; },
      get isTouched() { return touchedRefs.current.length; }
    };
  }, [formRef.current, defaultsRef.current]);

  return {
    state,
    form: formRef.current,
    fields: fieldRefs.current,
    handleReset: useCallback(handleReset, []),
    handleSubmit: useCallback(handleSubmit, []),
    useField: useCallback(useField, []),
    useFields: useCallback(useFields, []),
    getValue: useCallback(getValue, []),
    setValue: useCallback(setValue, []),
  };

}

export default useForm;
