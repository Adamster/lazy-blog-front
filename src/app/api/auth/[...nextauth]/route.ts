import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { API_URL } from "@/utils/fetcher";

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_URL}/api/users/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      headers: { "Content-Type": "application/json" },
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
      accessTokenExpires: Date.now() + 30 * 60 * 1000, // 30 минут
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

// Сделай authOptions локальной константой, не экспортируя её
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          const res = await fetch(`${API_URL}/api/users/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          });

          const user = await res.json();
          if (res.ok && user) return user;
        } catch (e: any) {
          throw new Error(`Authorization failed: ${e.message}`);
        }

        return null;
      },
    }),
  ],
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...user,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpires: Date.now() + 30 * 60 * 1000,
        };
      }

      if (Date.now() < (token as any).accessTokenExpires) return token;

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        (session as any).user = token.user;
        (session as any).user.accessToken = token.accessToken;
        (session as any).error = token.error ? token.error : null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
