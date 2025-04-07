import { Connection } from "@solana/web3.js";
import axios from "axios";
import { SUPPORTED_TOKENS } from "./supportedTokens";
type TokenPriceResponse = {
  [key: string]: { id: string; price: number; type: string };
};


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
