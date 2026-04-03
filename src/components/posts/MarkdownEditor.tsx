import { marked } from 'marked';
import { useState } from 'react';
import { cn } from '#/lib/helpers';

type Props = {
  value: string;
  onChange: (val: string) => void;
  minHeight?: number;
};

export function MarkdownEditor({ value, onChange, minHeight = 320 }: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const html = marked(value) as string;

  return (
    <div className='space-y-2'>
      {/* Mobile tab bar */}
      <div className='flex gap-1 md:hidden'>
        {(['write', 'preview'] as const).map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1 text-xs font-mono rounded-md border transition-colors',
              tab === t
                ? 'bg-card border-border text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className='md:grid md:grid-cols-2 md:gap-3'>
        {/* Textarea */}
        <div className={cn(tab === 'preview' ? 'hidden md:block' : 'block')}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring'
            placeholder='Write your repair notes here… Markdown supported.'
          />
        </div>

        {/* Preview */}
        <div
          className={cn(
            'rounded-md border border-border bg-card px-4 py-3 overflow-auto',
            tab === 'write' ? 'hidden md:block' : 'block',
          )}
          style={{ minHeight }}
        >
          {value.trim() ? (
            <div
              className='prose prose-invert max-w-none text-sm'
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className='text-xs font-mono text-muted-foreground italic'>
              Preview will appear here.
            </p>
          )}
        </div>
      </div>

      <p className='text-[10px] font-mono text-muted-foreground'>
        Markdown supported · embed images with{' '}
        <code className='text-[10px]'>![alt](url)</code>
      </p>
    </div>
  );
}
