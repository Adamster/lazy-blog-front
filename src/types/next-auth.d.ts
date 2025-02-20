import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

import { SessionUser } from ".";

//https://next-auth.js.org/getting-started/typescript

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: SessionUser;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface JWT extends SessionUser {}
}
