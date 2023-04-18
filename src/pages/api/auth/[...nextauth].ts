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

      console.log("auth", JSON.stringify({ email, password }));

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

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: 6 * 24 * 60 * 60, // 6 days
  },
  callbacks: {
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.userName = token.username;
        session.user.token = token.token;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.user.id;
        token.firstName = user.user.firstName;
        token.lastName = user.user.lastName;
        token.username = user.user.userName;
        token.token = user.token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export default NextAuth(authOptions);
