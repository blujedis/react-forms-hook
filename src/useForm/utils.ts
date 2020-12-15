
import { MutableRefObject } from 'react';
import { Field, FieldRefs, HTMLNode } from './types';

/**
 * Checks if value is a form.
 * 
 * @param form the element to inspect as Form element.
 */
export function isForm(form: unknown) {
  return !!(form && form instanceof HTMLFormElement);
}

/**
 * Checks if value is matching tag type.
 * 
 * @param element the element containing type.
 * @param match the value to match. 
 * @param loose when true uses starts with for match.
 */
export function isElementType<T>(element: Field<T>, match: string, loose = false) {
  element = element || { type: '' } as any;
  const type = element.type.toLowerCase();
  if (loose)
    return type.startsWith(match);
  return type === match;
}

/**
 * Checks if is Radio Node List.
 * 
 * @param element the element to inspect.
 */
export function isRadioList<T>(element: Field<T> | RadioNodeList) {
  return !!(element instanceof RadioNodeList);
}

/**
 * Checks if element collection is invalid.
 * 
 * @param element the element to inspect as invalid Radio collection.
 */
export function isInvalidRadioList<T>(element: Field<T> | RadioNodeList) {
  if (!isRadioList(element))
    return false;
  const invalidTypes = [...(element as any).values()].some(v => v.type !== 'radio');
  return invalidTypes;
}

/**
 * Gets duplicates in an array.
 * 
 * @param arr the array to inspect for duplicates.
 */
export function getDuplicates(arr: any[]) {
  return arr.filter((e, i, a) => a.indexOf(e) !== i);
}

/**
 * Gets unique values in an array.
 * 
 * @param arr the array to inspect for unique values.
 */
export function getUnique(arr: any[]) {
  return arr.filter((e, i, a) => a.indexOf(e) === i);
}

/**
 * Checks if array has duplicates.
 * 
 * @param arr the array to inspect for duplicates.
 */
export function hasDuplicateValues(arr: any[]) {
  return !!getDuplicates(arr).length;
}

/**
 * Checks if array has duplicates.
 * 
 * @param arr the array to inspect for duplicates.
 */
export function hasUniqueValues(arr: any[]) {
  return !hasDuplicateValues(arr);
}

/**
 * Checks if window and document are defined.
 * Otherwise likely SSR such as Next.js.
 */
export function isDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Checks loosely if value is a promise.
 * 
 * @param value the value to inspect.
 */
export function isPromise(value: any) {
  return Promise.resolve(value) === value;
}

/**
 * Checks if element is detached from document.
 * 
 * @param element the element to inspect.
 */
export function isDetached(element: HTMLNode): boolean {
  if (!element)
    return true;
  if (!(element instanceof HTMLElement) || element.nodeType === Node.DOCUMENT_NODE)
    return false;
  return isDetached(element.parentNode);
}

/**
 * Calls Field unregister event when Dom element is detached removed.
 * 
 * @param refs field refs that should be removed on DOM remove.
 */
export function onDomRemoveField<T>(refs: MutableRefObject<FieldRefs<T>>) {
  const observer = new MutationObserver(() => {
    if (!refs || !refs.current)
      return;
    const values = Object.values(refs.current) as unknown as Field<T>[];
    for (const field of values) {
      if (field && isDetached(field))
        field.unregister();
    }
  });

  observer.observe(window.document, {
    childList: true,
    subtree: true,
  });

  return observer;

}
