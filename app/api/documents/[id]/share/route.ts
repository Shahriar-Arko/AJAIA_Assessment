import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DocumentModel } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

function normalizeSharedWith(
  raw: unknown[]
): { email: string; role: "editor" | "viewer" }[] {
  return (raw || [])
    .map((item) => {
      if (typeof item === "string") {
        return { email: item.toLowerCase().trim(), role: "editor" as const };
      }
      if (item && typeof item === "object" && "email" in item) {
        const obj = item as { email: string; role?: string };
        return {
          email: String(obj.email).toLowerCase().trim(),
          role: obj.role === "viewer" ? ("viewer" as const) : ("editor" as const),
        };
      }
      return null;
    })
    .filter((x): x is { email: string; role: "editor" | "viewer" } => x !== null && x.email.length > 0);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { email, role = "editor", action = "add" } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please enter an email address." }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();
    const validRole: "editor" | "viewer" = role === "viewer" ? "viewer" : "editor";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(targetEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await connectDB();
    const doc = await DocumentModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (doc.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only the document owner can manage access." },
        { status: 403 }
      );
    }

    let nextList = normalizeSharedWith(doc.sharedWith as unknown[]);

    if (action === "remove") {
      nextList = nextList.filter((c) => c.email !== targetEmail);
    } else if (action === "update_role") {
      const exists = nextList.some((c) => c.email === targetEmail);
      if (exists) {
        nextList = nextList.map((c) =>
          c.email === targetEmail ? { email: targetEmail, role: validRole } : c
        );
      } else {
        nextList.push({ email: targetEmail, role: validRole });
      }
    } else {
      if (targetEmail === doc.ownerEmail) {
        return NextResponse.json(
          { error: "You are already the owner of this document." },
          { status: 400 }
        );
      }
      const existingIdx = nextList.findIndex((c) => c.email === targetEmail);
      if (existingIdx >= 0) {
        nextList[existingIdx] = { email: targetEmail, role: validRole };
      } else {
        nextList.push({ email: targetEmail, role: validRole });
      }
    }

    await DocumentModel.findByIdAndUpdate(
      id,
      { $set: { sharedWith: nextList } },
      { new: true }
    );

    return NextResponse.json({
      message:
        action === "remove"
          ? `Removed ${targetEmail}`
          : `Shared with ${targetEmail} as ${validRole === "editor" ? "Editor" : "Viewer"}`,
      sharedWith: nextList,
    });
  } catch (error: unknown) {
    console.error("Share error:", error);
    const message = error instanceof Error ? error.message : "Failed to update sharing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}