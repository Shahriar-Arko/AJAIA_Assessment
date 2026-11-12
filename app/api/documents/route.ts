import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DocumentModel } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const owned = await DocumentModel.find({ ownerId: user.id })
      .sort({ updatedAt: -1 })
      .lean();

    const sharedRaw = await DocumentModel.find({
      "sharedWith.email": user.email,
      ownerId: { $ne: user.id },
    })
      .sort({ updatedAt: -1 })
      .lean();

    const shared = sharedRaw.map((doc) => {
      const entry = (doc.sharedWith || []).find((c: unknown) =>
        typeof c === "string"
          ? c.toLowerCase() === user.email
          : (c as { email: string }).email?.toLowerCase() === user.email
      );
      const role =
        typeof entry === "object" && entry !== null
          ? (entry as { role: string }).role
          : "editor";
      return { ...doc, userRole: role };
    });

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = (body.title || "Untitled Document").trim();
    const content = body.content || "<p>Start writing your ideas here...</p>";

    await connectDB();

    const doc = await DocumentModel.create({
      title,
      content,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      sharedWith: [],
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document." }, { status: 500 });
  }
}