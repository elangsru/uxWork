"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «Response delay» for valgene i filterpanelet. Filter.Root sender hele
 * filtertilstanden ved hver endring; denne finner valget som ble krysset av
 * eller fjernet, og venter med å bruke tilstanden til tiden er ute. Imens er
 * valget «pending», så DelayedSelection kan vise spinner bak det.
 *
 * Bare endringer i filtrene i `delayedKeys` venter: valgfiltre lagret som
 * `filterKey/value`, og filtre med én nøkkel der verdien endres (beløp, der
 * hvert tastetrykk starter ventetiden på nytt). Andre endringer (mottaker)
 * brukes med en gang — sammen med et ventende valg, siden tilstanden alltid
 * er hel.
 */
export function useDelayedFilters(delayMs: number, delayedKeys: string[]) {
  const [pending, setPending] = useState<string | null>(null);
  const prevFilters = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setPending(null);
  };

  /** Kall fra Filter.Root sin onChange; `apply` setter sidens state. */
  const onFilters = (filters: Record<string, unknown>, apply: () => void) => {
    const prev = prevFilters.current;
    prevFilters.current = filters;
    // Nøkkelen som er lagt til, fjernet eller har fått ny verdi.
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(filters)]);
    const changed =
      [...allKeys].find((k) => JSON.stringify(prev[k]) !== JSON.stringify(filters[k])) ?? null;
    const isDelayed =
      changed !== null && delayedKeys.some((p) => changed === p || changed.startsWith(`${p}/`));

    cancel();
    if (delayMs <= 0 || !isDelayed) {
      apply();
      return;
    }
    setPending(changed);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPending(null);
      apply();
    }, delayMs);
  };

  /** Verdien som venter i et gitt filter, f.eks. "overforing" for "/type". */
  const pendingIn = (filterKey: string) =>
    pending?.startsWith(`${filterKey}/`) ? pending.slice(filterKey.length + 1) : null;

  /** Om et filter med én nøkkel (f.eks. beløp) venter. */
  const isPending = (filterKey: string) => pending === filterKey;

  return { onFilters, pendingIn, isPending, cancel };
}
