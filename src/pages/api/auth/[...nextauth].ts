import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { API_URL } from "@/utils/fetcher";
import type { NextAuthOptions } from "next-auth";

const providers = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      const { email, password } = credentials as any;

      try {
        const res = await fetch(`${API_URL}/users/login`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });

        const user = await res.json();

        // If no error and we have user data, return it
        if (res.ok && user) {
          return user;
        }
      } catch (e) {
        return e;
      }

      // Return null if user data could not be retrieved
      return null;
    },
  }),
];

// const useSecureCookies = !!process.env.VERCEL_URL;
const useSecureCookies = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.userName = token.username;
        session.user.token = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.user.id;
        token.firstName = user.user.firstName;
        token.lastName = user.user.lastName;
        token.username = user.user.userName;
        token.token = user.accessToken;
      }
      return token;
    },
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: `${useSecureCookies ? ".notlazy.blog" : "localhost"}`,
        secure: useSecureCookies,
      },
    },
  },
};

export default NextAuth(authOptions);
