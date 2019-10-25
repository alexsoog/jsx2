type StyleTypes = import('./style').StyleTypes;
type ListenerElement = import('./event').ListenerElement;
type ListenerTypes = import('./event').ListenerTypes;
type VNode<R> = import('../create-element').VNode<R>;

import { diffEvent } from './event';
import { diffStyle } from './style';

export function diffProp(
  el: HTMLElement,
  name: string,
  oldValue: unknown,
  newValue: unknown
): void {
  if (name === 'children' || name === 'key' || name === 'ref') return;
  if (newValue === oldValue) return;

  if (name === 'class' || name === 'className') {
    el.className = newValue as string;
  } else if (name === 'style') {
    diffStyle(el, oldValue as StyleTypes, newValue as StyleTypes);
  } else if (name === 'dangerouslySetInnerHTML') {
    throw new Error('dangerouslySetInnerHTML is not supported yet');
  } else if (name.startsWith('on')) {
    diffEvent(el as ListenerElement, name, oldValue as ListenerTypes, newValue as ListenerTypes);
  } else if (name in el) {
    (el as any)[name] = newValue == null ? '' : newValue;
  } else if (typeof newValue !== 'function') {
    if (newValue == null || newValue === false) {
      el.removeAttribute(name);
    } else {
      el.setAttribute(name, newValue as any);
    }
  }
}

export function diffProps<R>(
  el: HTMLElement,
  oldProps: VNode<R>['props'],
  props: VNode<R>['props']
): void {
  for (const name in oldProps) {
    if (!(name in props)) diffProp(el, name, oldProps[name], null);
  }
  for (const name in props) {
    diffProp(el, name, oldProps[name], props[name]);
  }
}

export function addProps<R>(el: HTMLElement, props: VNode<R>['props']): void {
  for (const name in props) {
    diffProp(el, name, null, props[name]);
  }
}
