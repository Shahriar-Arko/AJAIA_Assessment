"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Eye,
  FileUp,
  Loader2,
} from "lucide-react";

interface RichTextEditorProps {
  initialContent: string;
  editable?: boolean;
  importingFile?: boolean;
  onImportFile?: (file: File) => void;
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  initialContent,
  editable = true,
  importingFile = false,
  onImportFile,
  onChange,
}: RichTextEditorProps) {
  const appendInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[460px] w-full outline-none text-slate-900 caret-indigo-600 text-base leading-relaxed [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:mt-2 [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_p]:mb-3",
      },
    },
    onUpdate: ({ editor }) => {
      if (editor.isEditable) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Sync remote collaborator edits or appended files without disrupting cursor focus
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);

  if (!editor) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 min-h-[540px] animate-pulse shadow-sm" />
    );
  }

  const plainText = editor.getText().trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  const toolbarBtn = (active: boolean) =>
    `p-2 rounded-lg transition cursor-pointer ${
      active
        ? "bg-indigo-600 text-white shadow-2xs"
        : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
    }`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 flex flex-col">
      {editable ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 rounded-t-2xl">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              title="Bold (Ctrl+B)"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={toolbarBtn(editor.isActive("bold"))}
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Italic (Ctrl+I)"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={toolbarBtn(editor.isActive("italic"))}
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Underline (Ctrl+U)"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={toolbarBtn(editor.isActive("underline"))}
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-1.5" />

            <button
              type="button"
              title="Heading 1"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={toolbarBtn(editor.isActive("heading", { level: 1 }))}
            >
              <Heading1 className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Heading 2"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={toolbarBtn(editor.isActive("heading", { level: 2 }))}
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Heading 3"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={toolbarBtn(editor.isActive("heading", { level: 3 }))}
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-1.5" />

            <button
              type="button"
              title="Bulleted List"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={toolbarBtn(editor.isActive("bulletList"))}
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Numbered List"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={toolbarBtn(editor.isActive("orderedList"))}
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            {onImportFile && (
              <>
                <div className="h-5 w-px bg-slate-300 mx-1.5" />
                <input
                  ref={appendInputRef}
                  type="file"
                  accept=".docx,.md,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) {
                      onImportFile(selected);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={importingFile}
                  onClick={() => appendInputRef.current?.click()}
                  title="Insert content from .docx, .md, or .txt file and continue editing"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition disabled:opacity-50 cursor-pointer"
                >
                  {importingFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileUp className="w-3.5 h-3.5" />
                  )}
                  Insert File (.docx/.md/.txt)
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-35 cursor-pointer"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-35 cursor-pointer"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200/80 rounded-t-2xl flex items-center gap-2 text-xs font-semibold text-amber-800">
          <Eye className="w-4 h-4 text-amber-600" />
          View-Only Mode — Ask the document owner for Editor access to make changes.
        </div>
      )}

      <div
        onClick={() => {
          if (editable) editor.commands.focus();
        }}
        className={`px-8 sm:px-14 py-8 bg-white min-h-[500px] ${
          editable ? "cursor-text" : "cursor-default"
        }`}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between text-xs text-slate-500">
        <span>{editable ? "Rich-Text Mode • Live cloud sync active" : "Read-Only Preview • Live sync active"}</span>
        <span className="font-medium text-slate-600">
          {wordCount} {wordCount === 1 ? "word" : "words"} • {plainText.length} characters
        </span>
      </div>
    </div>
  );
}