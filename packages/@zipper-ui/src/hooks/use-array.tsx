import { useState } from 'react';

export function useArray<T = unknown>(initialValue: T[] = []) {
  const [value, setValue] = useState(initialValue);

  const push = (element: T) => {
    setValue((oldValue: T[]) => [...oldValue, element]);
  };

  const remove = (index: number) => {
    setValue((oldValue: T[]) => oldValue.filter((_, i) => i !== index));
  };

  const isEmpty = () => value.length === 0;

  return { value, setValue, push, remove, isEmpty };
}
