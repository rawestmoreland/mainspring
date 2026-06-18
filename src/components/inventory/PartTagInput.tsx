import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover } from 'radix-ui';
import { XIcon } from 'lucide-react';
import { cn } from '#/lib/helpers';

type PartTagInputProps = {
  value: string[];
  onChange: (parts: string[]) => void;
  vocabulary: string[];
  onCreatePart: (name: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
};

export function PartTagInput({
  value,
  onChange,
  vocabulary,
  onCreatePart,
  disabled,
  placeholder = 'Search or add a part…',
}: PartTagInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  const filtered = vocabulary.filter(
    (p) =>
      p.toLowerCase().includes(trimmed.toLowerCase()) &&
      !value.includes(p),
  );

  const exactMatch = vocabulary.some(
    (p) => p.toLowerCase() === trimmed.toLowerCase(),
  );

  const showCreate = trimmed.length > 0 && !exactMatch;

  function add(name: string) {
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(name: string) {
    onChange(value.filter((p) => p !== name));
  }

  async function create() {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await onCreatePart(trimmed);
      add(trimmed);
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        add(filtered[0]);
      } else if (showCreate) {
        create();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div
          className={cn(
            'min-h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
            disabled && 'opacity-50 pointer-events-none',
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((part) => (
            <span
              key={part}
              className='inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono text-[11px] line-through'
            >
              {part}
              <button
                type='button'
                onClick={(e) => { e.stopPropagation(); remove(part); }}
                className='text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                aria-label={`Remove ${part}`}
              >
                <XIcon className='size-2.5' />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(e.target.value.length > 0 || filtered.length > 0);
            }}
            onFocus={() => setOpen(filtered.length > 0 || trimmed.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className='flex-1 min-w-24 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground font-mono text-xs'
          />
        </div>
      </Popover.Anchor>

      <Popover.Content
        side='bottom'
        align='start'
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className='w-[var(--radix-popper-anchor-width)] max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-md z-50 p-1'
      >
        {filtered.map((part) => (
          <button
            key={part}
            type='button'
            onMouseDown={(e) => { e.preventDefault(); add(part); }}
            className='w-full text-left px-2.5 py-1.5 rounded font-mono text-xs text-foreground hover:bg-muted transition-colors cursor-pointer'
          >
            {part}
          </button>
        ))}

        {showCreate && (
          <button
            type='button'
            onMouseDown={(e) => { e.preventDefault(); create(); }}
            disabled={creating}
            className='w-full text-left px-2.5 py-1.5 rounded font-mono text-xs text-brass hover:bg-muted transition-colors cursor-pointer disabled:opacity-50'
          >
            {creating ? t('partTagAdding') : t('partTagAddToVocab', { name: trimmed })}
          </button>
        )}

        {filtered.length === 0 && !showCreate && (
          <p className='px-2.5 py-1.5 font-mono text-xs text-muted-foreground'>
            {t('partTagNoResults')}
          </p>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
