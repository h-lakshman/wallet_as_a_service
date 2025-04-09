import { authConfig } from "@/app/lib/authConfig";
import { JUPITER_API_URL } from "@/app/lib/constants";
import prisma from "@/prisma";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const MAX_RETRIES = 3;
const BASE_PRIORITY_FEE = 100000; // 0.0001 SOL
const PRIORITY_FEE_INCREMENT = 50000; // 0.00005 SOL

export async function POST(request: NextRequest) {
  const connection = new Connection(`https://api.mainnet-beta.solana.com`);
  const { quoteResponse } = await request.json();

  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletKey = session.user.publicKey;
  if (!walletKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let retryCount = 0;
  let txid: string | null = null;

  while (retryCount < MAX_RETRIES && !txid) {
    try {
      // Calculate priority fee for this attempt
      const currentPriorityFee =
        BASE_PRIORITY_FEE + PRIORITY_FEE_INCREMENT * retryCount;

      let data = {
        userPublicKey: walletKey,
        quoteResponse,
        wrapAndUnwrapSol: true,
        priorityFee: currentPriorityFee,
      };

      const wallet = await prisma.solWallet.findFirst({
        where: {
          userId: session.user.uid,
        },
        select: {
          privateKey: true,
        },
      });

      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet not found" },
          { status: 401 }
        );
      }

      const response = await axios.post(
        `${JUPITER_API_URL}/swap/v1/swap`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Deserialize and sign the transaction
      const swapTransactionBuf = Buffer.from(
        response.data.swapTransaction,
        "base64"
      );
      const swapTransaction =
        VersionedTransaction.deserialize(swapTransactionBuf);
      const secret = getPrivateKey(wallet.privateKey);
      swapTransaction.sign([secret]);

      // Send the transaction
      const rawTransaction = swapTransaction.serialize();
      txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      // Confirm the transaction
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: txid,
      });

      break;
    } catch (error) {
      console.error(`Transaction attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      if (retryCount === MAX_RETRIES) {
        return NextResponse.json(
          {
            error: "Transaction failed after multiple attempts",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({
    txid,
    status: "success",
    priorityFeeUsed: BASE_PRIORITY_FEE + PRIORITY_FEE_INCREMENT * retryCount,
  });
}

function getPrivateKey(privateKey: string) {
  const secretKey = privateKey.split(",").map((key) => Number(key));
  const privateKeyUintArr = Uint8Array.from(secretKey);
  return Keypair.fromSecretKey(privateKeyUintArr);
}
