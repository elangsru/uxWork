"use client";

import { Checkbox, Filter, Flex, ProgressIndicator } from "@dnb/eufemia/components";

/**
 * Samme som Eufemias Filter.Selection (Filter.Item med en avkrysningsboks per
 * valg, lagret som `filterKey/value`), men valget som venter på «Response
 * delay» fra Tools-menyen får en spinner bak navnet. Filter.Selection tar
 * bare tekst som label, så den kan ikke vise spinneren selv.
 *
 * Selve forsinkelsen ligger i siden (useDelayedFilters): boksen krysses av
 * med en gang, listen oppdateres når tiden er ute.
 */
export default function DelayedSelection({
  label,
  filterKey,
  data,
  pendingValue,
  defaultOpen,
}: {
  label: string;
  filterKey: string;
  data: { value: string; label: string }[];
  /** Valget som venter; null når ingenting venter. */
  pendingValue: string | null;
  defaultOpen?: boolean;
}) {
  const { filters, setFilter, removeFilter } = Filter.useFilterContext();
  const prefix = `${filterKey}/`;

  return (
    <Filter.Item label={label} filterKey={filterKey} defaultOpen={defaultOpen}>
      <Flex.Vertical layoutEngine="css" gap="small">
        {data.map((option) => (
          <Flex.Item key={option.value}>
            <Checkbox
              label={
                pendingValue === option.value ? (
                  <span className="po-pending-label">
                    {option.label}
                    <ProgressIndicator size="small" title="Laster" />
                  </span>
                ) : (
                  option.label
                )
              }
              checked={prefix + option.value in filters}
              onChange={({ checked }) => {
                const key = prefix + option.value;
                if (checked) {
                  setFilter(key, { value: option.value, label: option.label, categoryLabel: label });
                } else {
                  removeFilter(key);
                }
              }}
            />
          </Flex.Item>
        ))}
      </Flex.Vertical>
    </Filter.Item>
  );
}
