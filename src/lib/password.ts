import bcrypt from "bcryptjs";

export async function hashPassword(p: string): Promise<string> {
  return bcrypt.hash(p, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
