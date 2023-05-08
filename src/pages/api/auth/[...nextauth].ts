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
      //@ts-ignore
      profile(profile) {
        return {
          id: profile.sub,
          image: profile.picture,
          email: profile.email,
          name: profile.given_name+' '+profile.family_name,
          username: profile.email.split('@')[0]
        }
      }
    }),
  ],
  callbacks: {
    session: async ({ session, user }: any) => {
      if (session?.user) {
        session.user.id = user.id;
        session.user.username = user.username
      }
      return session;
    }
  },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
  }
};