import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  createdAt: Date;
}

export interface Collaborator {
  email: string;
  role: "editor" | "viewer";
}

export interface IDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sharedWith: Collaborator[];
  sourceFileName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarColor: { type: String, default: "bg-indigo-600" },
  },
  { timestamps: true }
);

const CollaboratorSchema = new Schema<Collaborator>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["editor", "viewer"], default: "editor" },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true, default: "Untitled Document" },
    content: { type: String, default: "<p></p>" },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, lowercase: true },
    sharedWith: { type: [CollaboratorSchema], default: [] },
    sourceFileName: { type: String, default: null },
  },
  { timestamps: true }
);

DocumentSchema.index({ "sharedWith.email": 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);