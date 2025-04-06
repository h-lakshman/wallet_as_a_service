import { Connection } from "@solana/web3.js";
import axios from "axios";

type TokenPriceResponse = {
  [key: string]: { id: string; price: number; type: string };
};
export const SUPPORTED_TOKENS = [
  {
    mintAddress: "So11111111111111111111111111111111111111112",
    name: "SOL",
    symbol: "SOL",
    decimals: 9,
    image:
      "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fsolana-labs%2Ftoken-list%40main%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png&anim=true&fit=cover&width=256&height=256",
  },
  {
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    image:
      "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fstatic.phantom.app%2Fassets%2Fusdt.png&anim=false&fit=cover&width=256&height=256",
  },
  {
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    image:
      "https://api.phantom.app/image-proxy/?image=https%3A%2F%2Fstatic.phantom.app%2Fassets%2Fusdc.png&anim=false&fit=cover&width=256&height=256",
  },
];

export const SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";
export const SOLANA_MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";
export const JUPITER_API_URL = "https://api.jup.ag";

export const connection = new Connection(SOLANA_MAINNET_RPC_URL);

let cachedPrices: { token_name: string; token_price: number }[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // every 60 seconds

export const getSupportedTokensPrice = async () => {
  const now = Date.now();
  if (cachedPrices && now - lastFetchTime < CACHE_DURATION) {
    return cachedPrices;
  }

  const response = await axios.get(
    `${JUPITER_API_URL}/price/v2?ids=${SUPPORTED_TOKENS.map(
      (token) => token.mintAddress
    ).join(",")}`
  );
  const prices = Object.entries(response.data.data as TokenPriceResponse).map(
    ([token, tokenData]) => {
      const token_name =
        SUPPORTED_TOKENS.find((t) => t.mintAddress === token)?.name ||
        "UNKNOWN";
      return {
        token_name,
        token_price: tokenData.price,
      };
    }
  );

  cachedPrices = prices;
  lastFetchTime = now;
  return prices;
};
