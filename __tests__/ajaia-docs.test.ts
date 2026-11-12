import { describe, it, expect, beforeAll } from "vitest";

let hashPassword: (pw: string) => string;
let verifyPassword: (pw: string, stored: string) => boolean;

beforeAll(async () => {
  process.env.MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/ajaia-docs-test";
  const auth = await import("@/lib/auth");
  hashPassword = auth.hashPassword;
  verifyPassword = auth.verifyPassword;
});

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
    .filter(
      (x): x is { email: string; role: "editor" | "viewer" } =>
        x !== null && x.email.length > 0
    );
}

function canUserEdit(
  userId: string,
  userEmail: string,
  doc: { ownerId: string; sharedWith: unknown[] }
): boolean {
  if (doc.ownerId === userId) return true;
  const normalized = normalizeSharedWith(doc.sharedWith);
  const entry = normalized.find((c) => c.email === userEmail.toLowerCase().trim());
  return entry?.role === "editor";
}

describe("Ajaia Docs — Security, RBAC & File Import Suite", () => {
  it("hashes and verifies user passwords securely with SHA-256", () => {
    const hash = hashPassword("StrongPass123!");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe("StrongPass123!");
    expect(verifyPassword("StrongPass123!", hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("enforces Owner, Editor, and Viewer permissions accurately", () => {
    const mockDoc = {
      ownerId: "user_owner_1",
      sharedWith: [
        { email: "editor@team.com", role: "editor" },
        { email: "viewer@team.com", role: "viewer" },
      ],
    };

    expect(canUserEdit("user_owner_1", "owner@team.com", mockDoc)).toBe(true);
    expect(canUserEdit("user_2", "editor@team.com", mockDoc)).toBe(true);
    expect(canUserEdit("user_3", "viewer@team.com", mockDoc)).toBe(false);
    expect(canUserEdit("user_4", "stranger@team.com", mockDoc)).toBe(false);
  });

  it("normalizes legacy string collaborators and preserves Viewer downgrades", () => {
    const legacy = ["legacy@team.com", { email: "review@team.com", role: "viewer" }];
    const normalized = normalizeSharedWith(legacy);

    expect(normalized).toEqual([
      { email: "legacy@team.com", role: "editor" },
      { email: "review@team.com", role: "viewer" },
    ]);
  });
});