import prisma from "@/prisma";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Keypair } from "@solana/web3.js";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
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
});

export { handler as GET, handler as POST };
