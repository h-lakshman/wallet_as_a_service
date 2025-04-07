import { SUPPORTED_TOKENS } from "@/app/lib/supportedTokens";
import { Box } from "@mui/material";
import { Typography } from "@mui/material";
import React from "react";
type Token = {
  token_name: string;
  token_price: number | null;
  token_balance: string;
  usd_balance: string;
  error?: string | null;
};
export default function TokenList({
  tokenBalances,
}: {
  tokenBalances: Token[];
}) {
  return (
    <Box sx={{ width: "100%" }}>
      {tokenBalances.map((token: Token) => {
        const supportedToken = SUPPORTED_TOKENS.find(
          (t) => t.name === token.token_name
        );
        return (
          <Box
            key={token.token_name}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            {/* Left side - Token info */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                component="img"
                src={supportedToken?.image}
                alt={token.token_name}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  mr: 2,
                }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {token.token_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  1 {token.token_name} = ${token.token_price}
                </Typography>
              </Box>
            </Box>

            {/* Right side - Balance info */}
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="subtitle1" fontWeight="medium">
                ${token.usd_balance}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {token.token_balance} {token.token_name}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
