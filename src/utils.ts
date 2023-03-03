// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction ( target: unknown): target is Function  {
    return typeof target === 'function';
}

export function isPromise <T = never>(val: unknown): val is Promise<T> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return (typeof val === 'object' && val !== null) && isFunction(val['then']) && isFunction(val['catch']);
}
