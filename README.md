# React-wait

用于简化 React 应用中的 loading 状态控制。

## Features

- 状态全局存储
- 自动清除 key value

## Installation

```bash

```

## Usage/Examples

```typescript jsx
import {useEffect} from 'react';
import {useWaiting, waitFor} from '@huk/react-wait';

function Component() {
  const {loading, loading2} = useWaiting(['loading', 'loading2']);

  useEffect(() => {
    waitFor('loading', async () => {
      // fetch data ...
      return [];
    });
  }, []);
  return <div>loading: {loading}</div>;
}
```

## Demo

## Documentation

## Known issues

- 卸载组件时如果存在进行中的 loading，那么便不能删除这个 key

## FAQ

#### Question 1

## License

[MIT](https://choosealicense.com/licenses/mit/)
