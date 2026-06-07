"use client";

import { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { saveProjectDocs } from "@/actions/project";
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, 
  CheckSquare, Heading1, Heading2, Loader2, CheckCircle2 
} from "lucide-react";

export default function ProjectDocs({ 
  projectId, 
  initialContent = "" 
}: { 
  projectId: string; 
  initialContent?: string; 
}) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing your project documentation, sprint notes, or server credentials...",
        emptyEditorClass: "cursor-text before:content-[attr(data-placeholder)] before:text-zinc-300 before:absolute before:pointer-events-none",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        className: "prose prose-zinc max-w-none focus:outline-none min-h-[500px] pb-32 text-zinc-800 leading-relaxed",
      },
    },
    onUpdate: () => {
      setSaveStatus("unsaved");
    },
  });

  // Auto-Save Logic (Debounced)
  useEffect(() => {
    if (!editor || saveStatus !== "unsaved") return;

    const timeoutId = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const html = editor.getHTML();
        await saveProjectDocs(projectId, html);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Failed to save docs", error);
        setSaveStatus("unsaved");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [editor?.getHTML(), saveStatus, projectId, editor]);

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, isActive, icon: Icon 
  }: { 
    onClick: () => void, isActive: boolean, icon: any 
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
        isActive ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-100 bg-zinc-50/50 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive("heading", { level: 1 })} 
            icon={Heading1} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive("heading", { level: 2 })} 
            icon={Heading2} 
          />
          <div className="w-[1px] h-6 bg-zinc-200 mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive("bold")} 
            icon={Bold} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive("italic")} 
            icon={Italic} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            isActive={editor.isActive("strike")} 
            icon={Strikethrough} 
          />
          <div className="w-[1px] h-6 bg-zinc-200 mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive("bulletList")} 
            icon={List} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive("orderedList")} 
            icon={ListOrdered} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleTaskList().run()} 
            isActive={editor.isActive("taskList")} 
            icon={CheckSquare} 
          />
        </div>

        {/* Save Status Indicator */}
        <div className="px-3 flex items-center gap-2 text-xs font-bold tracking-wide">
          {saveStatus === "saving" && (
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-zinc-400">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 custom-scrollbar relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}