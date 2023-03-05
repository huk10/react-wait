import {it, expect, describe} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useWaiting, waitFor} from './index';

async function sleep(num: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, num));
}

describe('wait.ts', () => {
  it('测试是否正常修改状态', async () => {
    const {result} = renderHook(() => useWaiting(['list-loading', 'table-loading']));
    expect(result.current).toEqual({
      'list-loading': false,
      'table-loading': false,
    });

    await act(() => {
      waitFor('list-loading', () => sleep(400));
    });
    expect(result.current).toEqual({
      'list-loading': true,
      'table-loading': false,
    });

    await act(() => sleep(600));
    expect(result.current).toEqual({
      'list-loading': false,
      'table-loading': false,
    });
  });

  it('测试单独的key并发修改状态', async () => {
    const {result} = renderHook(() => useWaiting(['loading', 'loading2']));
    expect(result.current).toEqual({loading: false, loading2: false});

    await act(() => {
      waitFor('loading', () => sleep(200));
      waitFor('loading', () => sleep(400));
      waitFor('loading', () => sleep(600));
      waitFor('loading', () => sleep(800));
    });
    expect(result.current).toEqual({loading: true, loading2: false});

    await act(() => sleep(600));
    expect(result.current).toEqual({loading: true, loading2: false});

    await act(() => sleep(1200));
    expect(result.current).toEqual({loading: false, loading2: false});
  });
});
