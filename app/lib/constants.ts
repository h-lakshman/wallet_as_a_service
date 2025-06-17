import { Connection } from "@solana/web3.js";
import axios from "axios";
import { SUPPORTED_TOKENS, Token } from "./supportedTokens";

type TokenPriceResponse = {
  [key: string]: { id: string; price: number; type: string };
};

export const SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com";
export const SOLANA_MAINNET_RPC_URL = `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
export const SOLANA_RPC_URL = `https://api.mainnet-beta.solana.com`;
export const JUPITER_API_URL = "https://api.jup.ag";

export const connection = new Connection(SOLANA_MAINNET_RPC_URL);

export const MAX_RETRIES = 3;
export const BASE_PRIORITY_FEE = 120000; // 0.00012 SOL
export const PRIORITY_FEE_INCREMENT = 50000; // 0.00005 SOL
export const ACCOUNT_CREATION_FEE = 2039280; // 0.00203928 SOL

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

export const getOptimalPriorityFee = async (connection: Connection) => {
  try {
    //min fee 120000 units, max 50000 units
    const recentBlockhash = await connection.getLatestBlockhash();
    if (!recentBlockhash) {
      console.warn("Could not get recent blockhash, using base priority fee");
      return BASE_PRIORITY_FEE;
    }

    try {
      const recentBlock = await connection.getBlock(
        recentBlockhash.lastValidBlockHeight,
        { maxSupportedTransactionVersion: 0 }
      );

      if (!recentBlock) {
        return BASE_PRIORITY_FEE;
      }

      const recentTransactions = recentBlock.transactions.length;
      const maxTransactionsPerBlock = 1000;

      const congestionRatio = Math.min(
        recentTransactions / maxTransactionsPerBlock,
        1
      );

      const congestionMultiplier = 1 + congestionRatio * 2;
      const optimalFee = Math.floor(BASE_PRIORITY_FEE * congestionMultiplier);

      return Math.min(
        Math.max(optimalFee, BASE_PRIORITY_FEE),
        BASE_PRIORITY_FEE * 3
      );
    } catch (blockError) {
      console.warn(
        "Error getting block data, using base priority fee:",
        blockError
      );
      return BASE_PRIORITY_FEE;
    }
  } catch (error) {
    console.error("Error calculating optimal priority fee:", error);
    return BASE_PRIORITY_FEE;
  }
};

export const updateNetworkFee = async (
  tokenBalances: Token[],
  setEstimatedNetworkFee: (fee: number) => void,
  setMaxNetworkFee: (fee: number) => void,
  setInsufficientSolForFee: (sufficient: boolean) => void
) => {
  try {
    const now = Date.now();
    const lastUpdate = parseInt(localStorage.getItem("LAST_UPDATE_KEY") || "0");
    const oneMinute = 60 * 1000;

    const solBalance = tokenBalances.find(
      (t) => t.token_name === "SOL"
    )?.token_balance;

    // Always check insufficient balance even if we skip fee updates
    if (now - lastUpdate < oneMinute && solBalance) {
      const currentMaxFee = parseFloat(
        localStorage.getItem("CACHED_MAX_FEE") || "0"
      );
      if (currentMaxFee > 0) {
        const totalRequiredSol = currentMaxFee + ACCOUNT_CREATION_FEE / 1e9;
        const hasEnoughSol = Number(solBalance) >= totalRequiredSol;
        setInsufficientSolForFee(!hasEnoughSol);
        return;
      }
    }

    let optimalFee;
    try {
      optimalFee = await getOptimalPriorityFee(connection);
    } catch (error) {
      console.warn("Failed to get optimal fee, using base fee:", error);
      optimalFee = BASE_PRIORITY_FEE;
    }

    const currentFee = optimalFee / 1e9;
    const maxPossibleFee =
      (optimalFee + PRIORITY_FEE_INCREMENT * MAX_RETRIES) / 1e9;

    setEstimatedNetworkFee(currentFee);
    setMaxNetworkFee(maxPossibleFee);

    // Cache the max fee for use during cached periods
    localStorage.setItem("CACHED_MAX_FEE", maxPossibleFee.toString());

    if (solBalance) {
      // Account for potential account creation fees (consistent with backend logic)
      const totalRequiredSol = maxPossibleFee + ACCOUNT_CREATION_FEE / 1e9;
      const hasEnoughSol = Number(solBalance) >= totalRequiredSol;
      setInsufficientSolForFee(!hasEnoughSol);
    }

    localStorage.setItem("LAST_UPDATE_KEY", now.toString());
  } catch (error) {
    console.error("Error updating network fee:", error);
    const baseFee = BASE_PRIORITY_FEE / 1e9;
    const maxFeeInSol = baseFee + (PRIORITY_FEE_INCREMENT * MAX_RETRIES) / 1e9;
    setEstimatedNetworkFee(baseFee);
    setMaxNetworkFee(maxFeeInSol);

    // Cache the max fee for use during cached periods
    localStorage.setItem("CACHED_MAX_FEE", maxFeeInSol.toString());

    const solBalance = tokenBalances.find(
      (t) => t.token_name === "SOL"
    )?.token_balance;

    if (solBalance) {
      const totalRequiredSol = maxFeeInSol + ACCOUNT_CREATION_FEE / 1e9;
      const hasEnoughSol = Number(solBalance) >= totalRequiredSol;
      setInsufficientSolForFee(!hasEnoughSol);
    }
  }
};

export const fetchQuote = async (
  setQuoteAmount: (amount: number) => void,
  setQuoteLoading: (loading: boolean) => void,
  setQuoteResponse: (response: any) => void,
  amount: number,
  baseAsset: string | undefined,
  quoteAsset: string | undefined,
  baseAsssetMintAddress: string | undefined,
  quoteAssetMintAddress: string | undefined,
  baseAssetDecimals: number | undefined,
  quoteAssetDecimals: number | undefined
) => {
  setQuoteLoading(true);
  try {
    const optimalFee = await getOptimalPriorityFee(connection);
    const maxPossibleFee = optimalFee + PRIORITY_FEE_INCREMENT * MAX_RETRIES;

    // Convert decimal amount to atomic units for Jupiter API
    let amountInAtomicUnits: number;
    if (baseAssetDecimals !== undefined) {
      amountInAtomicUnits = toAtomicUnits(amount, baseAssetDecimals);
    } else {
      // Fallback to treating as already atomic units
      amountInAtomicUnits = Math.floor(amount);
    }

    // For SOL swaps, subtract the network fees from the atomic amount
    let amountForQuote = amountInAtomicUnits;
    if (baseAsset === "SOL") {
      amountForQuote = amountInAtomicUnits - maxPossibleFee;
    }

    const response = await axios.get(
      `${JUPITER_API_URL}/swap/v1/quote?inputMint=${baseAsssetMintAddress}&outputMint=${quoteAssetMintAddress}&amount=${amountForQuote}`
    );

    setQuoteResponse(response.data);
    setQuoteAmount(
      Number(response.data.outAmount ?? 0) / 10 ** (quoteAssetDecimals ?? 0)
    );
  } catch (error) {
    console.error("Error fetching quote:", error);
  } finally {
    setQuoteLoading(false);
  }
};

/**
 * Safely converts a decimal amount to integer atomic units (lamports/tokens)
 * Handles floating-point precision issues by using string manipulation
 */
export const toAtomicUnits = (
  amount: string | number,
  decimals: number
): number => {
  const amountStr = amount.toString();

  // Handle empty or zero amounts
  if (!amountStr || amountStr === "0" || amountStr === "") {
    return 0;
  }

  // Split by decimal point
  const [integerPart = "0", decimalPart = ""] = amountStr.split(".");

  // Pad or truncate decimal part to match required decimals
  const paddedDecimalPart = decimalPart
    .padEnd(decimals, "0")
    .substring(0, decimals);

  // Combine integer and decimal parts
  const atomicStr = integerPart + paddedDecimalPart;

  // Convert to number, ensuring it's an integer
  const atomicValue = parseInt(atomicStr, 10);

  if (isNaN(atomicValue)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return atomicValue;
};

/**
 * Safely converts a decimal SOL amount to lamports
 */
export const toLamports = (solAmount: string | number): number => {
  return toAtomicUnits(solAmount, 9); // SOL has 9 decimals
};
