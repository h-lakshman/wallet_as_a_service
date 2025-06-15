import { NextResponse } from "next/server";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { connection, getSupportedTokensPrice } from "@/app/lib/constants";
import { SUPPORTED_TOKENS, Token } from "@/app/lib/supportedTokens";
import { PublicKey } from "@solana/web3.js";

async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "Missing address or token" },
        { status: 400 }
      );
    }

    try {
      new PublicKey(address);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    const prices = await getSupportedTokensPrice();

    const balances = await Promise.all(
      SUPPORTED_TOKENS.map(async (token) => {
        try {
          if (token.name === "SOL") {
            // Fetch native SOL balance
            const solBalanceLamports = await connection.getBalance(
              new PublicKey(address)
            );
            const solBalance = solBalanceLamports / 1e9;

            const token_price = prices.find(
              (p) => p.token_name === token.name
            )?.token_price;
            if (!token_price) {
              return {
                token_name: token.name,
                token_price: "0.00",
                token_balance: "0.0000",
                usd_balance: "0.00",
                error: "Token price not found",
              };
            }

            return {
              token_name: token.name,
              token_price: Number(token_price).toFixed(2),
              token_balance: solBalance.toFixed(4),
              usd_balance: (solBalance * Number(token_price)).toFixed(2),
              error: null,
            };
          } else {
            // Fetch SPL token ATA and balance
            const ata = await getAssociatedTokenAddress(
              new PublicKey(token.mintAddress),
              new PublicKey(address)
            );

            const ata_data = await getAccount(connection, ata);
            const token_price = prices.find(
              (p) => p.token_name === token.name
            )?.token_price;

            if (!token_price) {
              return {
                token_name: token.name,
                token_price: "0.00",
                token_balance: "0.0000",
                usd_balance: "0.00",
                error: "Token price not found",
              };
            }

            const token_balance =
              Number(ata_data.amount.toString()) / 10 ** token.decimals;
            return {
              token_name: token.name,
              token_price: Number(token_price),
              token_balance: token_balance,
              usd_balance: token_balance * Number(token_price),
              error: null,
            };
          }
        } catch (e) {
          return {
            token_name: token.name,
            token_price: "0.00",
            token_balance: "0.0000",
            usd_balance: "0.00",
            error: "Token account not found or failed to fetch",
          };
        }
      })
    );

    const total_usd = balances.reduce(
      (acc, curr) => acc + Number(curr.usd_balance),
      0
    );

    return NextResponse.json({
      tokens: balances,
      total_usd_balance: total_usd,
    });
  } catch (e) {
    console.error("Error processing request:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export { GET };
