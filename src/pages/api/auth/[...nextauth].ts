import { NextApiHandler } from 'next';
import NextAuth from "next-auth"
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from "next-auth/providers/google"
import prisma from '../../../lib/prisma';

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options);
export default authHandler;

const options = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    session: async ({ session, user }: any) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
  }
};