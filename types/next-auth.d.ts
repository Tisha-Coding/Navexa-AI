import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// Extend NextAuth's default types so `role` and `id` are typed everywhere.
declare module "next-auth" {
  interface User extends DefaultUser {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
  }
}
