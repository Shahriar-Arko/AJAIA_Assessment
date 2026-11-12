import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { connectDB } from "@/lib/mongodb";
import { DocumentModel } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkdown(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<u>$1</u>");
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return out;
}

function markdownToHtml(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      blocks.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      blocks.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeLists();
      blocks.push(`<h3>${formatInlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      closeLists();
      blocks.push(`<h2>${formatInlineMarkdown(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      closeLists();
      blocks.push(`<h1>${formatInlineMarkdown(trimmed.slice(2))}</h1>`);
    } else if (/^[-*+]\s+/.test(trimmed)) {
      if (inOl) {
        blocks.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        blocks.push("<ul>");
        inUl = true;
      }
      blocks.push(`<li>${formatInlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""))}</li>`);
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (inUl) {
        blocks.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        blocks.push("<ol>");
        inOl = true;
      }
      blocks.push(`<li>${formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
    } else {
      closeLists();
      blocks.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    }
  }

  closeLists();
  return blocks.join("") || "<p></p>";
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const targetDocId = formData.get("documentId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileName = file.name;
    const lower = fileName.toLowerCase();

    if (!lower.endsWith(".md") && !lower.endsWith(".txt") && !lower.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx, .md, and .txt files are supported." },
        { status: 400 }
      );
    }

    let htmlContent = "<p></p>";

    if (lower.endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.convertToHtml({ buffer });
      htmlContent = result.value?.trim() || "<p></p>";
    } else {
      const rawText = await file.text();
      htmlContent = markdownToHtml(rawText);
    }

    await connectDB();

    // Case A: Append imported file content into an existing open document
    if (typeof targetDocId === "string" && targetDocId.trim().length > 0) {
      const existingDoc = await DocumentModel.findById(targetDocId);
      if (!existingDoc) {
        return NextResponse.json({ error: "Target document not found." }, { status: 404 });
      }

      const isOwner = existingDoc.ownerId === user.id;
      const isEditor = (existingDoc.sharedWith || []).some(
        (c) => c.email === user.email && c.role === "editor"
      );

      if (!isOwner && !isEditor) {
        return NextResponse.json({ error: "No edit permission on this document." }, { status: 403 });
      }

      const currentBody =
        existingDoc.content === "<p></p>" ||
        existingDoc.content === "<p>Start writing your ideas here...</p>"
          ? ""
          : existingDoc.content;

      const combinedContent = `${currentBody}${htmlContent}<p></p>`;
      existingDoc.content = combinedContent;
      await existingDoc.save();

      return NextResponse.json({
        document: existingDoc,
        appendedHtml: combinedContent,
      });
    }

    // Case B: Create a brand-new document from the uploaded file
    const cleanTitle = fileName.replace(/\.(docx|md|txt)$/i, "") || "Imported Document";

    const doc = await DocumentModel.create({
      title: cleanTitle,
      content: `${htmlContent}<p></p>`,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      sharedWith: [],
      sourceFileName: fileName,
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/import error:", error);
    return NextResponse.json({ error: "Failed to import file." }, { status: 500 });
  }
}