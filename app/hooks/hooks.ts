import { useEffect, useState } from "react";

const useTokenBalance = (address: string) => {
  const [totalUsdBalance, setTotalUsdBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/tokens?address=${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch token balances");
        }

        setTotalUsdBalance(data.total_usd_balance);
        setTokenBalances(data.tokens);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching token balances:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenBalance();
  }, [address]);

  return { totalUsdBalance, tokenBalances, isLoading, error };
};

export default useTokenBalance;
