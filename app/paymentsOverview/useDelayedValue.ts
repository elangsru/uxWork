"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «Response delay» for ett enkelt valg utenfor Filter.Root, f.eks.
 * kontovelgeren. `set` venter med å bruke verdien til tiden er ute; imens er
 * `pending` true, så feltet kan vise spinner. Et nytt valg mens et venter
 * starter tiden på nytt. Med 0 ms brukes verdien med en gang. `setNow`
 * bruker verdien med en gang og avbryter et ventende valg.
 */
export function useDelayedValue<T>(delayMs: number, apply: (value: T) => void) {
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const set = (value: T) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (delayMs <= 0) {
      setPending(false);
      applyRef.current(value);
      return;
    }
    setPending(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPending(false);
      applyRef.current(value);
    }, delayMs);
  };

  const setNow = (value: T) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setPending(false);
    applyRef.current(value);
  };

  return { set, setNow, pending };
}
