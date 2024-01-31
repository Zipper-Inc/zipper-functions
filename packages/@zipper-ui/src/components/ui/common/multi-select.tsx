'use client';

import { forwardRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../templates/command';
import { Popover, PopoverContent, PopoverTrigger } from '../templates/popover';
import { Badge } from './badge';
import { Check, X } from 'lucide-react';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { flushSync } from 'react-dom';
import { uuid } from '@zipper/utils';

export type Option = {
  id: string;
  value: string;
  label: string;
  extra?: any;
};

type MultiSelectProps = {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
  placeholder?: string;
  inputPlaceholder?: string;
  className?: string;
  allowAddSameItem?: boolean;
};

const includeOption = (arr: Option[], item: Option) =>
  arr.some((i) => i.id === item.id);

const findOption = (arr: Option[], item: Option) =>
  arr.find((i) => i.id === item.id);

const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      selected,
      onChange,
      placeholder,
      inputPlaceholder,
      allowAddSameItem,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const [open, setOpen] = useState(false);

    const handleUnselect = (item: Option) => {
      onChange(selected.filter((i) => i.id !== item.id));
    };

    return (
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            ref={forwardedRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              selected.length > 1 ? 'h-full p-2' : 'h-9 p-4',
              'bg-background',
            )}
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="flex gap-1 flex-wrap">
              {selected.length > 0
                ? selected.map((item) => (
                    <Badge key={item.id} onClick={() => handleUnselect(item)}>
                      {findOption(selected, item)?.value}
                      <a
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUnselect(item);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }}
                      >
                        <X className="h-3 w-3 text-primary/60 hover:text-primary/30 transition-colors" />
                      </a>
                    </Badge>
                  ))
                : placeholder}
            </div>
            <div className="flex gap-1">
              {selected.length > 0 && (
                <button
                  type="button"
                  className="ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    flushSync(() => {
                      onChange([]);
                      setOpen(false);
                    });
                  }}
                >
                  <X className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              )}
              <CaretSortIcon className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
          <Command className={className}>
            <CommandInput placeholder={inputPlaceholder || 'Search ...'} />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.label}
                  onSelect={() => {
                    flushSync(() => {
                      if (allowAddSameItem) {
                        onChange([...selected, { ...option, id: uuid() }]);
                      } else {
                        onChange(
                          includeOption(selected, option)
                            ? selected.filter(
                                (item) => item.value !== option.value,
                              )
                            : [...selected, { ...option, id: uuid() }],
                        );
                      }
                      setOpen(true);
                    });
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      includeOption(selected, option)
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {option.value}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = 'TailwindMultiSelect';

export { MultiSelect as TailwindMultiSelect };
