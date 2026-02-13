// src/hooks/useDebounce.js
import { useRef, useCallback, useEffect } from "react";

export default function useDebounce(fn, delay = 300) {
  const timer = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
