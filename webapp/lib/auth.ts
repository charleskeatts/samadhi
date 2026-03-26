import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { account: { select: { subscriptionStatus: true, trialEndsAt: true } } },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          accountId: user.accountId,
          role: user.role,
          subscriptionStatus: user.account.subscriptionStatus,
          trialEndsAt: user.account.trialEndsAt?.toISOString() ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accountId = (user as any).accountId;
        token.role = (user as any).role;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.trialEndsAt = (user as any).trialEndsAt;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      (session.user as any).accountId = token.accountId;
      (session.user as any).role = token.role;
      (session.user as any).subscriptionStatus = token.subscriptionStatus;
      (session.user as any).trialEndsAt = token.trialEndsAt;
      return session;
    },
  },
});
