import { authConfig } from "@/app/lib/authConfig";
import { JUPITER_API_URL } from "@/app/lib/constants";
import prisma from "@/prisma";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const { quoteResponse } = await request.json();

  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletKey = session.user.publicKey;
  if (!walletKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let data = {
    userPublicKey: walletKey,
    quoteResponse,
    wrapAndUnwrapSol: true,
  };
  const response = await axios.post(`${JUPITER_API_URL}/swap/v1/swap`, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const privateKey = await prisma.user.findFirst({
    where: {
      subId: session.user.uid,
    },
    select: {
      solWallet: {
        select: {
          privateKey: true,
        },
      },
    },
  });
  if (!privateKey) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 401 });
  }
  const swapTransactionBuf = Buffer.from(
    response.data.response.swapTransaction,
    "base64"
  );
  const swapTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
  const wallet = getPrivateKey(privateKey.solWallet?.privateKey!);
  swapTransaction.sign([wallet]);
  const latestBlockhash = await connection.getLatestBlockhash();
  const rawTransaction = swapTransaction.serialize();
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2,
  });

  await connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: txid,
  });
  return NextResponse.json({
    txid,
    status: "success",
  });
}

function getPrivateKey(privateKey: string) {
  const secretKey = privateKey.split(",").map((key) => Number(key));
  const privateKeyUintArr = Uint8Array.from(secretKey);
  return Keypair.fromSecretKey(privateKeyUintArr);
}
