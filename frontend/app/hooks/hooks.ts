import { useEffect, useState } from "react";

const useTokenBalance = (address: string) => {
  const [totalUsdBalance, setTotalUsdBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<any>([]);
  useEffect(() => {
    const fetchTokenBalance = async () => {
      const response = await fetch(`/api/tokens?address=${address}`);
      const data = await response.json();
      setTotalUsdBalance(data.total_usd_balance);
      setTokenBalances(data.tokens);
      console.log(data.tokens);
    };
    fetchTokenBalance();
  }, []);
  return { totalUsdBalance, tokenBalances };
};

export default useTokenBalance;
