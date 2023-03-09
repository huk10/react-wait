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

// 同一个key存在多条进度，那么最慢的那条结束后，才会结束
function useWaiting<T extends string>(store: Store<number>, keys: T[] | T): Record<T, boolean> {
  const [value, setValue] = useState(() => {
    const result = {} as Record<T, boolean>;
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      result[key] = store.getValue(key, 0) > 0;
    }
    return result;
  });
  useEffect(() => {
    // react 自带批处理，这里不需要做。
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const unsubscribes = keyArray.map(key =>
      store.subscribe(key, val => {
        setValue(oldValue => ({...oldValue, [key]: val > 0}));
      })
    );
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      for (const key of keyArray) {
        if (store.getValue(key, 0) === 0) {
          store.delValue(key);
        }
      }
    };
  }, []);
  return value;
}

// 订阅 keys 的变更
function waitFor<K extends string, T>(store: Store<number>, key: K, func: () => Promise<T>): Promise<T> {
  const result = func();
  if (isPromise(result)) {
    // 该方法对同一个key进行处理时，会不断加一，每个进程结束后会减一，如果最终值为0时表示所有进程都结束了。
    store.setValue(key, store.getValue(key, 0) + 1);
    result.finally(() => store.setValue(key, store.getValue(key, 0) - 1));
  }
  return result;
}

// 支持泛型让字符串得到类型提示
// type keys = "A"|"B"|"C"
//
// const {waitFor: w} = createStore<keys>()
//
// w('A', async () => {
//
// })
export function createStore<K extends string>() {
  const store = new Store<number>();
  return {
    useWaiting(keys: K | K[]) {
      return useWaiting(store, keys);
    },
    waitFor<T>(key: K, func: () => Promise<T>): Promise<T> {
      return waitFor<K, T>(store, key, func);
    },
  };
}
