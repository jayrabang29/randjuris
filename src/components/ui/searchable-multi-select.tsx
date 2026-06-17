"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

type SearchableMultiSelectProps = {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function SearchableMultiSelect({
  values,
  onValuesChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
  id,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listId = React.useId();

  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function toggleValue(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((item) => item !== value));
      return;
    }
    onValuesChange([...values, value]);
  }

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            selectedLabels.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="border-b p-2">
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9"
            autoFocus
          />
        </div>
        <div id={listId} className="max-h-60 overflow-y-auto p-1" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            filtered.map((option) => {
              const selected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => toggleValue(option.value)}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
