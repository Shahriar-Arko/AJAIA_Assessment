import crypto from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "./mongodb";
import { User } from "./models";

export const SESSION_COOKIE_NAME = "ajaia_session_email";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_ajaia_salt").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!email) return null;

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}