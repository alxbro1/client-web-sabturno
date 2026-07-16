import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { User } from "@/lib/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://app-api.sabturno.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const data = (await res.json()) as { user: User; token: string };

        return {
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email,
          isLocal: data.user.isLocal,
          imageProfile: data.user.imageProfile,
          phone: data.user.phone,
          localName: data.user.localName,
          accessToken: data.token,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.isLocal = (user as any).isLocal;
        token.phone = (user as any).phone;
        token.localName = (user as any).localName;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isLocal = token.isLocal;
        (session.user as any).phone = token.phone;
        (session.user as any).localName = token.localName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
