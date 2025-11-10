'use client';

import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading3,
  Heading4,
  RemoveFormatting,
  Eye,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Rich Text Editor Component
 *
 * TipTap-based rich text editor for indicator descriptions and technical notes.
 *
 * Features:
 * - Bold, Italic formatting
 * - Bullet and numbered lists
 * - Headings (H3, H4)
 * - Clear formatting
 * - HTML output
 * - Preview mode
 * - Placeholder text
 */

interface RichTextEditorProps {
  /** Initial HTML content */
  value?: string;

  /** Callback when content changes */
  onChange?: (html: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Whether the editor is readonly */
  readonly?: boolean;

  /** Minimum height in pixels */
  minHeight?: number;

  /** Custom class name */
  className?: string;

  /** Show preview toggle */
  showPreview?: boolean;
}

/**
 * Toolbar Button Component
 */
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );
}

/**
 * Editor Toolbar Component
 */
interface EditorToolbarProps {
  editor: Editor | null;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        isActive={editor.isActive('heading', { level: 4 })}
        title="Heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Rich Text Editor Component
 */
export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  readonly = false,
  minHeight = 200,
  className = '',
  showPreview = true,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit');

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !readonly,
    immediatelyRender: false, // Fix for SSR hydration with Next.js
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none px-4 py-3',
          `min-h-[${minHeight}px]`
        ),
      },
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  // Preview-only mode (no toolbar or tabs)
  if (readonly && !showPreview) {
    return (
      <div className={cn('border rounded-lg overflow-hidden bg-card', className)}>
        <div
          className="prose prose-sm max-w-none p-4"
          style={{ minHeight: `${minHeight}px` }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    );
  }

  // Edit mode with preview toggle
  if (showPreview) {
    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')} className={className}>
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Tabs Header */}
          <div className="flex items-center justify-between border-b bg-muted/50 px-2 py-1">
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs h-7">
                <Code className="h-3 w-3 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs h-7">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Edit Tab */}
          <TabsContent value="edit" className="m-0">
            <EditorToolbar editor={editor} />
            <div style={{ minHeight: `${minHeight}px` }}>
              <EditorContent editor={editor} />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="m-0">
            <div
              className="prose prose-sm max-w-none p-4"
              style={{ minHeight: `${minHeight}px` }}
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </TabsContent>
        </div>
      </Tabs>
    );
  }

  // Edit mode only (no preview)
  return (
    <div className={cn('border rounded-lg overflow-hidden bg-card', className)}>
      <EditorToolbar editor={editor} />
      <div style={{ minHeight: `${minHeight}px` }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
