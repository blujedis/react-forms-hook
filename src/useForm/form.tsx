import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isDetached, isForm, isInvalidRadioList, isPromise, isRadioList, onDomRemoveField } from './utils';
import { Field, FieldHandlers, FieldRefs, FieldValue, IFieldConfig, IUseField, IOptions, SubmitHandler, FieldErrors, ValidateHandlerPromise, ResetHandler } from './types';
import { handleCheckbox, handleFile, handleInput, handleRadio, handleSelectMultiple, handleSelectOne, handleVirtual } from './handlers';
import { dequal } from 'dequal';
import { FormEvent } from 'react';

// Default elements that should fire on "input" instead of "change".
const INPUT_CHANGE_TYPES = [
  'select-one', 'select-multiple', 'radio',
  'checkbox', 'file', 'submit', 'reset'
];

const defaultHandlers = {
  text: handleInput,
  radio: handleRadio,
  file: handleFile,
  'select-one': handleSelectOne,
  'select-multiple': handleSelectMultiple,
  checkbox: handleCheckbox,
  virtual: handleVirtual
};

function useForm<T = Record<string, any>, E = Record<keyof T, string[]>>(props: IOptions<T>) {

  props = {
    form: 'form',
    initialData: {} as T,
    fieldStrategy: 'extend',
    fields: [] as Extract<keyof T, string>[],
    preventInputEnter: true,
    ...props
  };

  const {
    form, fields, initialData, preventInputEnter, onRegisterHandlers,
    onValidateForm, renderPersist, fieldStrategy, onTransformValue,
    onInitValidate
  } = props;

  // Resettable refs.
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRefs = useRef<FieldRefs<T>>({} as any);
  const touchedRefs = useRef<Extract<keyof T, string>[]>([]);
  const dirtyRefs = useRef<Extract<keyof T, string>[]>([]);
  const errorRefs = useRef<FieldErrors<T, E>>({} as any);
  const submitCountRef = useRef(0);
  const submittingRef = useRef(false);
  const submittedRef = useRef(false);
  const isValidRef = useRef(true);

  // We do not reset these refs.
  // they are bound to outside data
  // or need to persist.
  const initialDataRef = useRef(initialData);
  const defaultsRef = useRef(initialData);
  const handlerRefs = useRef<FieldHandlers>(registerHandlers());

  // Watches to see if defaults should be reinit.
  const shouldReinitDefaults = dequal(initialData, initialDataRef.current);
  const canInitForm = formRef.current instanceof HTMLFormElement;

  const [, renderer] = useState(null);

  //////////////////////////////////////
  // Private Methods
  //////////////////////////////////////

  const render = useCallback(function render(persistValues = renderPersist) {
    const values = getValue();
    renderer({});
    if (persistValues) {
      const fields = Object.values(fieldRefs.current) as Field<T>[];
      fields.forEach(field => {
        const currentValue = values[field.name];
        if (typeof currentValue !== 'undefined') {
          field.handler.setValue(currentValue as any);
        }
      });
    }
  }, [getValue, renderPersist]);


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
    errorRefs.current = {} as any;
    submitCountRef.current = 0;
    submittingRef.current = false;
    submittedRef.current = false;
    isValidRef.current = true;
  }

  const extendField = useCallback((field: Field<T>, config = {} as any) => {
    config.name = field.name;
    for (const k in config) {
      if (!Object.hasOwnProperty.call(config, k) || k === 'type') continue;
      field[k] = config[k];
    }
    return field;
  }, []);

  const fieldToName = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    let name = fieldOrName as Extract<keyof T, string>;
    if (typeof fieldOrName !== 'string')
      name = fieldOrName.name as Extract<keyof T, string>;
    return name;
  }, []);

  const isTouched = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    return touchedRefs.current.includes(fieldToName(fieldOrName));
  }, [fieldToName]);

  const isDirty = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    return dirtyRefs.current.includes(fieldToName(fieldOrName));
  }, [fieldToName]);

  const isDirtyCompared = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>, value: any) => {
    const defs = defaultsRef.current || {} as any;
    const name = fieldToName(fieldOrName);
    return !dequal(defs[name], value);
  }, [fieldToName]);

  const setTouched = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    const name = fieldToName(fieldOrName);
    const clone = [...touchedRefs.current];
    if (!touchedRefs.current.includes(name))
      touchedRefs.current = [...clone, name];
  }, [fieldToName]);

  const setDirty = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    const name = fieldToName(fieldOrName);
    const clone = [...dirtyRefs.current];
    if (!dirtyRefs.current.includes(name))
      dirtyRefs.current = [...clone, name];
  }, [fieldToName]);

  const removeDirty = useCallback((fieldOrName: Extract<keyof T, string> | Field<T>) => {
    const name = fieldToName(fieldOrName);
    dirtyRefs.current = dirtyRefs.current.filter(v => v !== name);
  }, [fieldToName]);

  const removeFieldRef = useCallback((key: keyof T) => {
    delete fieldRefs.current[key];
  }, []);

  const normalizeConfigs = useCallback((fields: (Extract<keyof T, string> | IFieldConfig<T>)[] = []) => {
    return (fields || []).map(v => {
      if (typeof v !== 'object')
        return { name: v };
      return v;
    }) as IFieldConfig<T>[];
  }, []);

  const getVirtuals = useCallback((fieldConfigs: IFieldConfig<T>[], boundFields: FieldRefs<T>) => {

    const boundFieldKeys = Object.keys(boundFields || {});

    const fieldConfigKeys = fieldConfigs.map(c => {
      if (typeof c === 'object')
        return c.name as string;
      return c as string;
    });

    const keys = fieldConfigKeys.filter(k => !boundFieldKeys.includes(k));

    const configs = keys.reduce((a, c) => {
      const found = fieldConfigs.find(n => n.name === c as any);
      if (found)
        a[c] = found;
      return a;
    }, {} as FieldRefs<T>);

    return {
      keys,
      configs
    };

  }, []);

  const hasConfig = useCallback((key: string, configs: IFieldConfig<T>[]) => {
    return configs.find(v => v.name === key);
  }, []);

  const validateForm = useCallback(async (shouldRender = false): Promise<FieldErrors<T>> => {

    if (!onValidateForm)
      return Promise.resolve(null);

    const values = getValueWithTransform();
    const fields = fieldRefs.current;

    let validator = onValidateForm as ValidateHandlerPromise<T>;

    if (!isPromise(onValidateForm))
      validator = ((v, f, m) => Promise.resolve(onValidateForm(v, f, m) as any));

    // Don't really care about errors here other than to log
    // let user know. If a value is returned there are errors
    // which should be in form of { key: array[] } where the array
    // can be whatever the user wants for displaying each error for
    // each property key in the form.
    try {
      const result = await validator(values, fields, formRef.current);
      if (typeof result == 'object' && !Array.isArray(result) && result !== null) {
        errorRefs.current = result;
        isValidRef.current = false;
      }
      else {
        isValidRef.current = true;
      }
      if (shouldRender)
        render();

      return result;
    }
    catch (ex) {
      console.error(ex);
      return null;
    }

  }, [getValueWithTransform, onValidateForm, render]);

  const updateTouchDirtyState = useCallback((field: Field<T>, shouldRender = false) => {

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

  }, [isDirty, isTouched, removeDirty, render, setDirty, setTouched, isDirtyCompared]);

  const bindEvents = useCallback((field: Field<T>) => {

    const events = [];

    let validateOnBlur;
    let validateOnChange;

    // Shouldn't bind events to virtuals.
    if (field.type === 'virtual')
      return events;

    if (['checkbox', 'radio'].includes(field.type)) {
      validateOnBlur = typeof field.validateOnBlur === 'undefined' ? false : field.validateOnBlur;
      validateOnChange = typeof field.validateOnChange === 'undefined' ? true : field.validateOnChange;
    }
    else {
      validateOnBlur = typeof field.validateOnBlur === 'undefined' ? true : field.validateOnBlur;
      validateOnChange = typeof field.validateOnChange === 'undefined' ? false : field.validateOnChange;
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
    if (validateOnBlur) {
      field.addEventListener('blur', handleBlur);
      events.push(['blur', handleBlur]);
    }

    // Attach change.
    if (validateOnChange) {
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

  }, [preventInputEnter, updateTouchDirtyState, validateForm]);

  const unregister = useCallback((field: Field<T>) => {
    if (field.unbind)
      field.unbind();
    removeFieldRef(field.name);
  }, [removeFieldRef]);

  const normalizeField = useCallback((field: Field<T>) => {

    // Everything is JS is any object so event though this is an 
    // array we can attach props as we primarily need them
    // internally.
    if (isRadioList(field)) {

      const list = field as unknown as RadioNodeList;
      const item = list[0] as Field<T>;

      field.name = item.name;
      (field as any).tagName = item.tagName;
      (field as any).type = item.type;
      const initHandler = handlerRefs.current[field.type];

      if (!initHandler) {
        console.warn(`Failed to load form element handler for ${field.name}`);
        return field;
      }

      field.handler = initHandler(field, initialDataRef.current, updateTouchDirtyState);

      return field;

    }
    else {

      const initHandler = handlerRefs.current[field.type] || handlerRefs.current['text'];

      if (!initHandler) {
        console.warn(`Failed to load form element handler for ${field.name}`);
        return field;
      }

      field.handler = initHandler(field, initialDataRef.current, updateTouchDirtyState);

      return field;

    }

  }, [updateTouchDirtyState]);

  const initField = useCallback((field: Field<T>) => {

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

  }, [bindEvents, normalizeField, unregister]);

  function getValueOrValues(key?: keyof T | boolean, transform = false) {

    if (typeof key === 'boolean') {
      transform = key;
      key = undefined;
    }

    const getValueByHandler = (k: keyof T) => {
      const field = fieldRefs.current[k];
      if (!field.handler)
        return '';
      const currentValue = field.handler.getValue();
      if (!transform || !onTransformValue)
        return currentValue;
      return onTransformValue(currentValue, field);
    };

    if (typeof key !== 'undefined')
      return getValueByHandler(key as keyof T);

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


  function getValue(key: keyof T): FieldValue;
  function getValue(): T;
  function getValue(key?: keyof T) {
    return getValueOrValues(key);
  }

  function getValueWithTransform(key: keyof T): FieldValue;
  function getValueWithTransform(): T;
  function getValueWithTransform(key?: keyof T) {
    return getValueOrValues(key, true);
  }

  function setValue(key: keyof T, value: any)
  function setValue(values: T)
  function setValue(key: keyof T | T, value?: any) {
    setValueOrValues(key, value);
  }

  function getError(key: keyof T): any[];
  function getError(): FieldErrors<T, E>;
  function getError(key?: keyof T) {
    return getErrorOrErrors(key);
  }

  function setError(errors?: FieldErrors<T, E>) {
    errorRefs.current = errors || {} as any;
  }

  function reset(values: T, shouldRender?: boolean): T;
  function reset(shouldRender?: boolean): T;
  function reset(values?: T | boolean, shouldRender = true) {
    if (typeof values === 'boolean') {
      shouldRender = values;
      values = undefined;
    }
    resetRefs();
    formRef.current.reset();
    values = values || { ...defaultsRef.current };
    setValue(values as T);
    if (shouldRender)
      render();
    return values;
  }

  function handleReset(fn: ResetHandler<T>)
  function handleReset(event: FormEvent)
  function handleReset(fnOrEvent?: FormEvent | ResetHandler<T>) {

    const handleCallback = async (e) => {

      if (e) {
        e.preventDefault();
        e.persist();
      }

      // No need to render twice so if we're going to render with
      // validation we can skip it on reset.

      const skipRender = !onInitValidate;
      const resetValues = reset(skipRender);

      // In order to ensure same state as when loaded
      // and if user requested validate on init
      // we need to revalidate the form.
      // render here as we skipped above.
      if (onInitValidate)
        await validateForm(true);

      (fnOrEvent as ResetHandler<T>)(resetValues, e);

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

      const values = getValueWithTransform();
      const errors = await validateForm();

      submittingRef.current = false;
      submittedRef.current = true;

      render();

      fn(values, errors, e);

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

  const initUseField = useCallback(<K extends keyof T>(name: Extract<K, string>) => {

    const getElement = () => {
      return fieldRefs.current[name as keyof T] || null;
    }

    const getValue = () => {
      const elem = getElement();
      if (elem)
        return elem.value;
      return null;
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
      get validity() {
        const elem = getElement();
        if (!elem)
          return null;
        return elem.validity;
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

  }, [getError, isTouched, isDirty]);

  const initUseFields = useCallback(<K extends keyof T>(...names: Extract<K, string>[]) => {
    return names.reduce((a, c) => {
      a[c] = initUseField(c);
      return a;
    }, {} as any) as Record<K, IUseField<T>>;
  }, [initUseField]);

  /////////////////////////////////////////////
  // Define Side Effects
  /////////////////////////////////////////////

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
      const fieldConfigs = normalizeConfigs(fields);
      const hasConfigs = !!fields.length;

      for (const k in elements) {

        const config = hasConfig(k, fieldConfigs);

        if (/^\d+$/.test(k) || typeof elements[k] === 'function' || k === 'length' || (hasConfigs && fieldStrategy === 'strict' && !config)) continue;

        if (isInvalidRadioList(elements[k] as any)) {
          console.warn(`Skipping invalid NodeList for ${k}, ensure type is "radio" or remove duplicate names.`);
          continue;
        }

        const field = extendField(elements[k] as Field<T>, config);

        fieldRefs.current[k] = field;

        initField(field);

      }

      // Check for virtuals that aren't yet bound.
      if (fieldConfigs.length) {
        const { keys, configs } = getVirtuals(fieldConfigs, fieldRefs.current);
        keys.forEach(k => {
          const config = configs[k];
          if (!config) // basically this shouldn't ever happen.
            throw new Error(`Failed to bind virtual ${k} using config of undefined.`);
          const field = {
            ...config,
            type: 'virtual'
          };
          fieldRefs.current[k] = field;
          initField(field as any);
        });
      }

      // Register Mutation observer.
      onDomRemoveField(fieldRefs);

      if (!formRef.current.onreset)
        formRef.current.onReset = handleReset;

    }

    return () => {
      const fields = Object.values(fieldRefs.current) as Field<T>[] || [];
      fields.forEach(field => {
        field.unregister();
      });
      resetRefs(true);
    }

  }, [canInitForm, extendField, fieldStrategy, fields, handleReset,
    getVirtuals, hasConfig, initField, initialData, normalizeConfigs]);

  useEffect(() => {
    if (typeof defaultsRef.current !== 'undefined') {
      const fields = Object.values(fieldRefs.current) as Field<T>[];
      for (const field of fields) {
        if (field.handler) {
          const defaultValue = field.handler.getDefaultValue();
          defaultsRef.current[field.name as any] = defaultValue;
          if (typeof defaultValue !== 'undefined' && defaultValue !== '')
            field.handler.setValue(defaultValue, true);
        }
      }
    }
    if (onInitValidate)
      validateForm(true); // after render here to update if validate on init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReinitDefaults, onInitValidate]);

  /////////////////////////////////////////////
  // Return State & Api
  /////////////////////////////////////////////

  const state = useMemo(() => {
    return {
      get touched() { return touchedRefs.current },
      get dirty() { return dirtyRefs.current },
      get values() { return getValueWithTransform(); },
      get submitCount() { return submitCountRef.current; },
      get submitting() { return submittingRef.current; },
      get submitted() { return submittedRef.current; },
      get isDirty() { return dirtyRefs.current.length; },
      get isTouched() { return touchedRefs.current.length; },
      get isValid() { return isValidRef.current; },
      get errors() { return errorRefs.current; }
    };
  }, [getValueWithTransform]);

  return {
    state,
    form: formRef.current,
    fields: fieldRefs.current,
    handleReset: useCallback(handleReset, [handleReset]),
    handleSubmit: useCallback(handleSubmit, [getValueWithTransform, render, validateForm]),
    getValue: useCallback(getValueWithTransform, [getValueWithTransform]),
    setValue: useCallback(setValue, [setValue]),
    useField: initUseField,
    useFields: initUseFields,
    validate: validateForm
  };

}

export default useForm;
