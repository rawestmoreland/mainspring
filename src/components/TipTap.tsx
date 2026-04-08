import { cn } from '@/lib/utils';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import {
  Editor,
  EditorContent,
  useEditor,
  useEditorState,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareCodeIcon,
  StrikethroughIcon,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle } from 'react';

export interface TiptapEditorRef {
  getContent: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

export interface ToolbarConfig {
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  code?: boolean;
  clearMarks?: boolean;
  clearNodes?: boolean;
  paragraph?: boolean;
  headings?: boolean[];
  bulletList?: boolean;
  orderedList?: boolean;
  codeBlock?: boolean;
  blockquote?: boolean;
  horizontalRule?: boolean;
  hardBreak?: boolean;
  undo?: boolean;
  redo?: boolean;
}

export interface TiptapEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  toolbarClassName?: string;
  showToolbar?: boolean;
  toolbarConfig?: ToolbarConfig;
  disabled?: boolean;
  autofocus?: boolean;
  minHeight?: string;
  maxHeight?: string;
  blog?: boolean;
  blogImages?: { secure_url: string; public_id: string }[];
}

const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  bold: true,
  italic: true,
  strike: true,
  code: true,
  clearMarks: true,
  clearNodes: true,
  paragraph: true,
  headings: [true, true, true, false, false, false],
  bulletList: true,
  orderedList: true,
  codeBlock: true,
  blockquote: true,
  horizontalRule: true,
  hardBreak: true,
  undo: true,
  redo: true,
};

function MenuBar({
  editor,
  toolbarClassName,
  toolbarConfig = DEFAULT_TOOLBAR_CONFIG,
}: {
  editor: Editor;
  toolbarClassName?: string;
  toolbarConfig?: ToolbarConfig;
}) {
  // Read the current editor's state, and re-render the component when it changes
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
        isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
        isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      };
    },
  });

  return (
    <div
      className={cn(
        'flex gap-2 border-b border-gray-200 px-2 pb-4',
        toolbarClassName,
      )}
    >
      <div className='flex flex-wrap gap-2'>
        {toolbarConfig.bold && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editorState.canBold}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
              editorState.isBold && 'bg-gray-100',
            )}
          >
            <BoldIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.italic && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editorState.canItalic}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
              editorState.isItalic && 'bg-gray-100',
            )}
          >
            <ItalicIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.strike && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editorState.canStrike}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
              editorState.isStrike && 'bg-gray-100',
            )}
          >
            <StrikethroughIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.code && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editorState.canCode}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
              editorState.isCode && 'bg-gray-100',
            )}
          >
            <CodeIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.paragraph && (
          <button
            type='button'
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isParagraph && 'bg-gray-100',
            )}
          >
            <PilcrowIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[0] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading1 && 'bg-gray-100',
            )}
          >
            <Heading1Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[1] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading2 && 'bg-gray-100',
            )}
          >
            <Heading2Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[2] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading3 && 'bg-gray-100',
            )}
          >
            <Heading3Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[3] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading4 && 'bg-gray-100',
            )}
          >
            <Heading4Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[4] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 5 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading5 && 'bg-gray-100',
            )}
          >
            <Heading5Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.headings?.[5] && (
          <button
            type='button'
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 6 }).run()
            }
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isHeading6 && 'bg-gray-100',
            )}
          >
            <Heading6Icon className='size-4' />
          </button>
        )}
        {toolbarConfig.bulletList && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isBulletList && 'bg-gray-100',
            )}
          >
            <ListIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.orderedList && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isOrderedList && 'bg-gray-100',
            )}
          >
            <ListOrderedIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.codeBlock && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isCodeBlock && 'bg-gray-100',
            )}
          >
            <SquareCodeIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.blockquote && (
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
              editorState.isBlockquote && 'bg-gray-100',
            )}
          >
            <QuoteIcon className='size-4' />
          </button>
        )}
        {toolbarConfig.horizontalRule && (
          <button
            type='button'
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={cn(
              'rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50',
            )}
          >
            <MinusIcon className='size-4' />
          </button>
        )}
      </div>
    </div>
  );
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Start typing...',
      className,
      editorClassName,
      toolbarClassName,
      showToolbar = true,
      toolbarConfig = DEFAULT_TOOLBAR_CONFIG,
      disabled = false,
      autofocus = false,
      minHeight = '120px',
      maxHeight,
    },
    ref,
  ) => {
    const editor = useEditor({
      extensions: [StarterKit, TextStyleKit, Image],
      content: value || '',
      editable: !disabled,
      autofocus,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const content = editor.getHTML();
        onChange?.(content);
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm w-full focus:outline-none',
            'min-h-[120px]',
            editorClassName,
          ),
          style: `min-height: ${minHeight}; ${
            maxHeight ? `max-height: ${maxHeight};` : ''
          }`,
          'data-placeholder': placeholder,
        },
      },
    });

    useEffect(() => {
      if (editor && value !== undefined && editor.getHTML() !== value) {
        editor.commands.setContent(value);
      }
    }, [editor, value]);

    useImperativeHandle(
      ref,
      () => ({
        getContent: () => editor?.getHTML() || '',
        getText: () => editor?.getText() || '',
        setContent: (content: string) => editor?.commands.setContent(content),
        focus: () => editor?.commands.focus(),
        blur: () => editor?.commands.blur(),
        clear: () => editor?.commands.clearContent(),
      }),
      [editor],
    );

    if (!editor) {
      return null;
    }

    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-gray-200 p-2',
          className,
        )}
      >
        {showToolbar && (
          <MenuBar
            editor={editor}
            toolbarClassName={toolbarClassName}
            toolbarConfig={toolbarConfig}
          />
        )}
        <div
          className={cn(
            'relative',
            maxHeight && 'overflow-y-auto px-3 py-2',
            !maxHeight && 'px-2 py-2',
          )}
        >
          <EditorContent
            editor={editor}
            className={cn(disabled && 'cursor-not-allowed opacity-50')}
          />
        </div>
      </div>
    );
  },
);

TiptapEditor.displayName = 'TiptapEditor';

// Utility function to wrap TipTap content for display
export const wrapTiptapContent = (htmlContent: string): string => {
  if (!htmlContent) return '';
  return `<div class="prose prose-sm">${htmlContent}</div>`;
};

// React component for displaying TipTap content
export const TiptapDisplay = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => (
  <div
    className={cn('prose prose-sm', className)}
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

export default TiptapEditor;
export { TiptapEditor };
