import { useEffect, EffectCallback } from 'react';

export function useEffectOnce(callback: EffectCallback) {
  useEffect(callback, []);
}
