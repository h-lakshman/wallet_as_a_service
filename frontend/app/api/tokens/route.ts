import { NextResponse } from "next/server";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  connection,
  getSupportedTokensPrice,
  SUPPORTED_TOKENS,
} from "@/app/lib/constants";
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

    const balances = await Promise.all(
      SUPPORTED_TOKENS.map(async (token) => {
        try {
          const ata = await getAssociatedTokenAddress(
            new PublicKey(token.mintAddress),
            new PublicKey(address)
          );

          try {
            const ata_data = await getAccount(connection, ata);
            const price = await getSupportedTokensPrice();
            const token_price = price.find(
              (p) => p.token_name === token.name
            )?.token_price;
            if (!token_price) {
              return {
                token_name: token.name,
                token_price: null,
                token_balance: "0",
                usd_balance: "0",
                error: "Token price not found",
              };
            }
            const token_balance =
              Number(ata_data.amount.toString()) / 10 ** token.decimals;

            return {
              token_name: token.name,
              token_price: token_price,
              token_balance: token_balance.toString(),
              usd_balance: (token_balance * token_price).toString(),
              error: null,
            };
          } catch (e) {
            // Account doesn't exist or other token account error
            return {
              token_name: token.name,
              token_price: null,
              token_balance: "0",
              usd_balance: "0",
              error: "Token account not found",
            };
          }
        } catch (e) {
          // Error getting associated token address
          return {
            token_name: token.name,
            token_price: null,
            token_balance: "0",
            usd_balance: "0",
            error: "Failed to get associated token address",
          };
        }
      })
    );

    return NextResponse.json({
      tokens: balances,
      total_usd_balance: balances.reduce(
        (acc, curr) => acc + Number(curr.usd_balance),
        0
      ),
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
