import { authConfig } from "@/app/lib/authConfig";
import {
  BASE_PRIORITY_FEE,
  getOptimalPriorityFee,
  MAX_RETRIES,
  PRIORITY_FEE_INCREMENT,
  SOLANA_RPC_URL,
  ACCOUNT_CREATION_FEE,
  toLamports,
  toAtomicUnits,
} from "@/app/lib/constants";
import { signTransactionMPC } from "@/app/lib/mpc-key-manager";
import { SUPPORTED_TOKENS } from "@/app/lib/supportedTokens";
import prisma from "@/prisma";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const connection = new Connection(SOLANA_RPC_URL);
  const { sendAmount, toPubKey, tokenSymbol } = await request.json();

  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletKey = session.user.publicKey;
  if (!walletKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    new PublicKey(toPubKey);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid recipient address" },
      { status: 400 }
    );
  }

  const optimalFee = await getOptimalPriorityFee(connection);
  const maxPossibleFee = optimalFee + PRIORITY_FEE_INCREMENT * MAX_RETRIES;

  const solBalance = await connection.getBalance(new PublicKey(walletKey));

  const tokenInfo = SUPPORTED_TOKENS.find((t) => t.symbol === tokenSymbol);
  if (!tokenInfo) {
    return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
  }

  if (tokenSymbol === "SOL") {
    const sendAmountLamports = toLamports(sendAmount);
    const totalRequired =
      sendAmountLamports + maxPossibleFee + ACCOUNT_CREATION_FEE;

    if (solBalance < totalRequired) {
      return NextResponse.json(
        {
          error: "Insufficient SOL balance for transfer + fees",
          requiredAmount: totalRequired / LAMPORTS_PER_SOL,
          currentBalance: solBalance / LAMPORTS_PER_SOL,
        },
        { status: 400 }
      );
    }
  } else {
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletKey),
        { mint: new PublicKey(tokenInfo.mintAddress) }
      );

      if (tokenAccounts.value.length === 0) {
        return NextResponse.json(
          { error: "Token account not found" },
          { status: 400 }
        );
      }

      const tokenBalance =
        tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      const sendAmountAtomic = toAtomicUnits(sendAmount, tokenInfo.decimals);

      if (Number(tokenBalance.amount) < sendAmountAtomic) {
        return NextResponse.json(
          {
            error: "Insufficient token balance",
            requiredBalance: sendAmount,
            currentBalance:
              Number(tokenBalance.amount) / Math.pow(10, tokenInfo.decimals),
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to check token balance" },
        { status: 400 }
      );
    }

    let needsAccountCreation = false;
    try {
      const toTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenInfo.mintAddress),
        new PublicKey(toPubKey)
      );
      await getAccount(connection, toTokenAccount);
    } catch (error) {
      needsAccountCreation = true;
    }

    const accountCreationFee = needsAccountCreation ? ACCOUNT_CREATION_FEE : 0;
    const totalRequiredSol = maxPossibleFee + accountCreationFee;

    if (solBalance < totalRequiredSol) {
      return NextResponse.json(
        {
          error: needsAccountCreation
            ? "Insufficient SOL balance for network fees and account creation"
            : "Insufficient SOL balance for network fees",
          requiredFee: totalRequiredSol / LAMPORTS_PER_SOL,
          currentBalance: solBalance / LAMPORTS_PER_SOL,
          needsAccountCreation,
          accountCreationFee: accountCreationFee / LAMPORTS_PER_SOL,
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

      let transferInstruction;
      let instructions = [];

      if (tokenSymbol === "SOL") {
        transferInstruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(walletKey),
          toPubkey: new PublicKey(toPubKey),
          lamports: toLamports(sendAmount),
        });
        instructions.push(transferInstruction);
      } else {
        const fromTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(tokenInfo.mintAddress),
          new PublicKey(walletKey)
        );

        const toTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(tokenInfo.mintAddress),
          new PublicKey(toPubKey)
        );

        try {
          await getAccount(connection, toTokenAccount);
        } catch (error) {
          const createAccountInstruction =
            createAssociatedTokenAccountInstruction(
              new PublicKey(walletKey),
              toTokenAccount,
              new PublicKey(toPubKey),
              new PublicKey(tokenInfo.mintAddress)
            );
          instructions.push(createAccountInstruction);
        }

        transferInstruction = createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          new PublicKey(walletKey),
          toAtomicUnits(sendAmount, tokenInfo.decimals)
        );
        instructions.push(transferInstruction);
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(walletKey),
        recentBlockhash: blockhash,
        instructions: instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      const signedTransaction = await signTransactionMPC(
        session.user.uid,
        transaction,
        wallet.encryptedKeyShare
      );

      const rawTransaction = signedTransaction.serialize();
      txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      const confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: txid,
      });

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed with error: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }

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
