import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DocumentModel } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

function normalizeSharedWith(raw: unknown[]): { email: string; role: "editor" | "viewer" }[] {
  return (raw || []).map((item) => {
    if (typeof item === "string") {
      return { email: item.toLowerCase(), role: "editor" };
    }
    const obj = item as { email: string; role?: "editor" | "viewer" };
    return { email: obj.email.toLowerCase(), role: obj.role === "viewer" ? "viewer" : "editor" };
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DocumentModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const isOwner = doc.ownerId === user.id;
    const sharedList = normalizeSharedWith(doc.sharedWith as unknown[]);
    const collabEntry = sharedList.find((c) => c.email === user.email);

    if (!isOwner && !collabEntry) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this document." },
        { status: 403 }
      );
    }

    const role = isOwner ? "owner" : collabEntry!.role;
    const canEdit = isOwner || collabEntry!.role === "editor";

    return NextResponse.json({
      document: {
        ...doc,
        _id: doc._id.toString(),
        sharedWith: sharedList,
        isOwner,
        role,
        canEdit,
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await req.json();

    await connectDB();
    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const isOwner = doc.ownerId === user.id;
    const sharedList = normalizeSharedWith(doc.sharedWith as unknown[]);
    const collabEntry = sharedList.find((c) => c.email === user.email);

    if (!isOwner && collabEntry?.role !== "editor") {
      return NextResponse.json(
        { error: "View-only access. You do not have permission to edit this document." },
        { status: 403 }
      );
    }

    if (typeof title === "string" && title.trim().length > 0) {
      doc.title = title.trim();
    }
    if (typeof content === "string") {
      doc.content = content;
    }

    await doc.save();

    return NextResponse.json({
      document: {
        ...doc.toObject(),
        _id: doc._id.toString(),
        sharedWith: sharedList,
        isOwner,
        role: isOwner ? "owner" : "editor",
        canEdit: true,
      },
    });
  } catch (error) {
    console.error("PATCH /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to save document." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (doc.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only the document owner can delete this document." },
        { status: 403 }
      );
    }

    await doc.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}