import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { API_URL } from "@/utils/fetcher";
import type { NextAuthOptions } from "next-auth";

async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_URL}/users/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      headers: { "Content-Type": "application/json" },
    });

    const refreshedTokens = await response.json();

    // console.log('refreshAccessToken', refreshedTokens)
    // console.log('refreshAccessToken', ref/reshedTokens.accessToken, refreshedTokens.refreshToken)

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
      accessTokenExpires: Date.now() + 30 * 60 * 1000, // 30 minutes
    }
  } catch (error) {

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const useSecureCookies = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };

        try {
          const res = await fetch(`${API_URL}/users/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          });

          const user = await res.json();

          // console.log('authorize', user)

          if (res.ok && user) {
            return user;
          }
        } catch (e: any) {
          throw new Error(`Authorization failed: ${e.message}`);
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 6 months
  },
  jwt: {
    maxAge: 30 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }: any) {

      if (user && account) {
        return {
          ...user,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 30 * 60 * 1000, // 30 minutes
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        // console.log('return token', token)
        return token
      }

      return refreshAccessToken(token)
    },
    async session({ session, token }: any) {
      if (token) {
        session.user = token.user;
        session.user.accessToken = token.accessToken;
        session.error = token.error ? token.error : null;
      }

      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: `${useSecureCookies ? ".notlazy.org" : "localhost"}`,
        secure: useSecureCookies,
      },
    },
  },
};

export default NextAuth(authOptions);
