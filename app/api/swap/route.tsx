import { authConfig } from "@/app/lib/authConfig";
import {
  JUPITER_API_URL,
  PRIORITY_FEE_INCREMENT,
  MAX_RETRIES,
  BASE_PRIORITY_FEE,
  getOptimalPriorityFee,
  SOLANA_RPC_URL,
} from "@/app/lib/constants";
import { signTransactionMPC } from "@/app/lib/mpc-key-manager";
import prisma from "@/prisma";
import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const connection = new Connection(SOLANA_RPC_URL);
  const { quoteResponse } = await request.json();

  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletKey = session.user.publicKey;
  if (!walletKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const optimalFee = await getOptimalPriorityFee(connection);
  const maxPossibleFee = optimalFee + PRIORITY_FEE_INCREMENT * MAX_RETRIES;

  console.log("walletKey", walletKey);
  const solBalance = await connection.getBalance(new PublicKey(walletKey));

  //  SOL swaps, do comprehensive balance check upfront
  if (
    quoteResponse.inputMint === "So11111111111111111111111111111111111111112"
  ) {
    const swapAmount = parseInt(quoteResponse.inAmount);
    const accountCreationFee = 2039280; // Token account creation
    const totalRequired = swapAmount + accountCreationFee + maxPossibleFee;

    if (solBalance < totalRequired) {
      return NextResponse.json(
        {
          error: "Insufficient SOL balance for swap + all fees",
          requiredAmount: totalRequired / 1e9,
          currentBalance: solBalance / 1e9,
          breakdown: {
            swapAmount: swapAmount / 1e9,
            accountCreationFee: accountCreationFee / 1e9,
            maxNetworkFees: maxPossibleFee / 1e9,
          },
        },
        { status: 400 }
      );
    }
  } else {
    //  token swaps, just check network fees
    if (solBalance < maxPossibleFee) {
      return NextResponse.json(
        {
          error: "Insufficient SOL balance for network fees",
          requiredFee: maxPossibleFee / 1e9,
          currentBalance: solBalance / 1e9,
        },
        { status: 400 }
      );
    }
  }

  let retryCount = 0;
  let txid: string | null = null;
  let lastError: Error | null = null;
  let currentPriorityFee = BASE_PRIORITY_FEE;

  while (retryCount < MAX_RETRIES && !txid) {
    try {
      currentPriorityFee = await getOptimalPriorityFee(connection);
      const finalPriorityFee =
        currentPriorityFee + PRIORITY_FEE_INCREMENT * retryCount;

      let data = {
        userPublicKey: walletKey,
        quoteResponse,
        wrapAndUnwrapSol: true,
        priorityFee: finalPriorityFee,
      };

      const wallet = await prisma.solWallet.findFirst({
        where: {
          userId: session.user.uid,
        },
        select: {
          encryptedKeyShare: true,
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

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(
        response.data.swapTransaction,
        "base64"
      );
      const swapTransaction =
        VersionedTransaction.deserialize(swapTransactionBuf);

      const signedTransaction = await signTransactionMPC(
        session.user.uid,
        swapTransaction,
        wallet.encryptedKeyShare
      );

      if (
        quoteResponse.inputMint ===
        "So11111111111111111111111111111111111111112"
      ) {
        const balance = await connection.getBalance(new PublicKey(walletKey));

        // Calculate total required SOL: swap amount + fees + account creation
        const swapAmount = parseInt(quoteResponse.inAmount);
        const accountCreationFee = 2039280; // ~0.002 SOL for token account creation
        const networkFees = finalPriorityFee + 5000; // Priority fee + base transaction fee
        const totalRequired = swapAmount + accountCreationFee + networkFees;

        if (balance < totalRequired) {
          return NextResponse.json(
            {
              error: "Insufficient SOL balance for swap + fees",
              requiredAmount: totalRequired / 1e9,
              currentBalance: balance / 1e9,
              breakdown: {
                swapAmount: swapAmount / 1e9,
                accountCreationFee: accountCreationFee / 1e9,
                networkFees: networkFees / 1e9,
              },
            },
            { status: 400 }
          );
        }
      } else {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(walletKey),
          { mint: new PublicKey(quoteResponse.inputMint) }
        );

        if (tokenAccounts.value.length === 0) {
          return NextResponse.json(
            {
              error: "Token account not found",
            },
            { status: 400 }
          );
        }

        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
        if (BigInt(balance.amount) < BigInt(quoteResponse.inAmount)) {
          return NextResponse.json(
            {
              error: "Insufficient token balance",
              requiredBalance: quoteResponse.inAmount,
              currentBalance: balance.amount,
            },
            { status: 400 }
          );
        }
      }

      const rawTransaction = signedTransaction.serialize();
      txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: txid,
      });

      // Check if the transaction actually succeeded
      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed with error: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }

      // Verify the transaction was successful by checking the transaction details
      const transactionDetails = await connection.getTransaction(txid, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!transactionDetails) {
        throw new Error("Could not fetch transaction details");
      }

      if (transactionDetails.meta?.err) {
        throw new Error(
          `Transaction failed with program error: ${JSON.stringify(
            transactionDetails.meta.err
          )}`
        );
      }

      break;
    } catch (error) {
      console.error(`Transaction attempt ${retryCount + 1} failed:`, error);
      lastError = error as Error;
      retryCount++;

      if (retryCount === MAX_RETRIES) {
        return NextResponse.json(
          {
            error: "Transaction failed after multiple attempts",
            details: lastError.message,
            priorityFeeUsed: currentPriorityFee,
          },
          { status: 500 }
        );
      }

      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  return NextResponse.json({
    txid,
    status: "success",
    priorityFeeUsed: currentPriorityFee,
  });
}
