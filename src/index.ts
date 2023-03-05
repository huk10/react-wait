/**
 * 用于跟踪异步的加载状态，状态全局管理。
 *  1. 页面中的状态值不用时，会尽量自动删除。
 */
import {isPromise} from './utils';
import {useEffect, useState} from 'react';

class Store<T> {
  private data: Map<string, T> = new Map();
  private listeners: Map<string, ((val: T) => void)[]> = new Map();

  delValue(key: string) {
    this.data.delete(key);
  }
  setValue(key: string, value: T) {
    this.data.set(key, value);
    this.notify(key, value);
  }
  getValue(key: string, defaultValue: T) {
    return this.data.get(key) ?? defaultValue;
  }

  notify(key: string, value: T) {
    const cbs = (this.listeners.get(key) || []).slice();
    cbs.forEach(cb => cb(value));
  }
  subscribe(key: string, callback: (val: T) => void) {
    if (!key || typeof callback !== 'function') throw new Error('params error');
    const cbs = (this.listeners.get(key) || []).slice();
    // 允许同一个key使用相同的callback重复监听
    cbs.push(callback);
    this.listeners.set(key, cbs);
    return () => this.unsubscribe(key, callback);
  }
  unsubscribe(key: string, callback: (val: T) => void) {
    if (!key || typeof callback !== 'function') throw new Error('params error');
    const cbs = (this.listeners.get(key) || []).slice();
    const lis = cbs.filter(val => val !== callback);
    this.listeners.set(key, lis);
  }
}

const globalStore = new Store<number>();

// 订阅 keys 的变更
export function useWaiting<T extends string>(keys: T[]): Record<T, boolean> {
  const [value, setValue] = useState(() => {
    const result = {} as Record<T, boolean>;
    for (const key of keys) {
      result[key] = globalStore.getValue(key, 0) > 0;
    }
    return result;
  });

  useEffect(() => {
    const unsubscribes = keys.map(key =>
      globalStore.subscribe(key, val => {
        setValue(oldValue => ({...oldValue, [key]: val > 0}));
      })
    );
    return () => {
      unsubscribes.map(unsubscribe => {
        for (const key of keys) {
          if (globalStore.getValue(key, 0) === 0) {
            globalStore.delValue(key);
          }
        }
        unsubscribe();
      });
    };
  }, []);

  return value;
}

// 同一个key存在多条进度，那么最慢的那条结束后，才会结束
export function waitFor<T>(key: string, func: () => Promise<T>): Promise<T> {
  const result = func();
  if (isPromise(result)) {
    // 该方法对同一个key进行处理时，会不断加一，每个进程结束后会减一，如果最终值为0时表示所有进程都结束了。
    globalStore.setValue(key, globalStore.getValue(key, 0) + 1);
    result.finally(() => globalStore.setValue(key, globalStore.getValue(key, 0) - 1));
  }
  return result;
}
