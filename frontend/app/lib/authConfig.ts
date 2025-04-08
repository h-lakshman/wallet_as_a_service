import prisma from "@/prisma";
import { Account, Profile, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Keypair } from "@solana/web3.js";
import { JWT } from "next-auth/jwt";

export interface CustomSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    uid: string;
    publicKey: string;
  };
}
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET ?? "s3cret",
  callbacks: {
    async session({ session, token }: any): Promise<CustomSession> {
      const newSession = session as CustomSession;
      if (newSession.user && token.uid && token.publicKey) {
        newSession.user.uid = token.uid;
        newSession.user.publicKey = token.publicKey;
      }
      return newSession;
    },
    async jwt({
      token,
      account,
      profile,
    }: {
      token: JWT;
      account: Account;
      profile: Profile;
    }) {
      const user = await prisma.user.findFirst({
        where: {
          subId: account?.providerAccountId,
        },
        include: {
          solWallet: true,
        },
      });
      if (user) {
        token.uid = user.id;
        token.publicKey = user.solWallet?.publicKey;
      }
      return token;
    },
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User;
      account: Account;
      profile: Profile;
    }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) {
          return false;
        }
        const existingUser = await prisma.user.findUnique({
          where: {
            username: email,
          },
        });
        if (existingUser) {
          return true;
        }
        const keypair = Keypair.generate();
        await prisma.user
          .create({
            data: {
              username: email,
              name: profile?.name,
              subId: account?.providerAccountId,
              // @ts-ignore
              profilePicture: profile?.picture,
              solWallet: {
                create: {
                  publicKey: keypair.publicKey.toBase58(),
                  privateKey: keypair.secretKey.toString(),
                },
              },
              inrWallet: {
                create: {
                  balance: 0,
                },
              },
            },
            include: {
              solWallet: true,
              inrWallet: true,
            },
          })
          .then(async (user) => {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                solWalletId: user.solWallet?.id,
                inrWalletId: user.inrWallet?.id,
              },
            });
          });
        return true;
      }
      return false;
    },
  },
};
