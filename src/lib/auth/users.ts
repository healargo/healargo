import { USER_ROLES } from "@/constants/auth";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@/types/user";

export type LeanAuthUser = {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string | null;
  image?: string | null;
};

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash?: string | null;
  image?: string | null;
}): LeanAuthUser {
  return {
    _id: user.id,
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user.role as UserRole) ?? USER_ROLES.USER,
    passwordHash: user.passwordHash,
    image: user.image,
  };
}

export async function findAuthUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return user ? toAuthUser(user) : null;
}

export async function findAuthUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toAuthUser(user) : null;
}

export async function upsertGoogleUser(profile: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  if (!profile.email) return null;

  const email = profile.email.toLowerCase();
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    if (profile.image && profile.image !== existing.image) {
      const updated = await prisma.user.update({
        where: { email },
        data: { image: profile.image },
      });
      return toAuthUser(updated);
    }
    return existing;
  }

  const created = await prisma.user.create({
    data: {
      name: profile.name?.trim() || email.split("@")[0],
      email,
      role: USER_ROLES.USER,
      image: profile.image ?? undefined,
    },
  });

  return toAuthUser(created);
}
