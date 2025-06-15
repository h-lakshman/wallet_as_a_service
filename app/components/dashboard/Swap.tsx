import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stack,
  FadeProps,
  Container,
  CircularProgress,
  AlertTitle,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SettingsIcon from "@mui/icons-material/Settings";
import { SUPPORTED_TOKENS, Token } from "@/app/lib/supportedTokens";
import { blue, grey } from "@mui/material/colors";
import Balance from "./Balance";
import { NumberTextField } from "./NumberTextField";
import axios from "axios";
import {
  updateNetworkFee,
  fetchQuote,
} from "@/app/lib/constants";
import { Page } from "./ProfileData";
import { TokenSelector } from "./TokenSelector";
import TransactionStatus from "./TransactionStatus";

export default function Swap({
  isLoading,
  totalUsdBalance,
  snackbarOpen,
  setSnackbarOpen,
  tokenBalances,
  error,
  setSelectedPage,
}: {
  isLoading: boolean;
  totalUsdBalance: number;
  tokenBalances: Token[];
  error: string;
  snackbarOpen: {
    open: boolean;
    Transition: (props: FadeProps) => React.JSX.Element;
    vertical: "top";
    horizontal: "center";
  };
  setSnackbarOpen: (value: {
    open: boolean;
    Transition: (props: FadeProps) => React.JSX.Element;
    vertical: "top";
    horizontal: "center";
  }) => void;
  setSelectedPage: (page: Page) => void;
}) {
  const [baseAsset, setBaseAsset] = useState("SOL");
  const [quoteAsset, setQuoteAsset] = useState("USDC");
  const [baseAmount, setBaseAmount] = useState(0);
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const [transactionStatusBar, setTransactionStatusBar] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [estimatedNetworkFee, setEstimatedNetworkFee] = useState<number>(0);
  const [maxNetworkFee, setMaxNetworkFee] = useState<number>(0);
  const [insufficientSolForFee, setInsufficientSolForFee] = useState(false);
  let baseAssetDecimals: number | undefined;
  let quoteAssetDecimals: number | undefined;
  useEffect(() => {
    updateNetworkFee(
      tokenBalances,
      setEstimatedNetworkFee,
      setMaxNetworkFee,
      setInsufficientSolForFee
    );
  }, [tokenBalances]);

  useEffect(() => {
    if (!baseAsset || !quoteAsset || !baseAmount) return;
    const baseAsssetMintAddress = SUPPORTED_TOKENS.find(
      (t) => t.symbol === baseAsset
    )?.mintAddress;
    const quoteAssetMintAddress = SUPPORTED_TOKENS.find(
      (t) => t.symbol === quoteAsset
    )?.mintAddress;
    baseAssetDecimals = SUPPORTED_TOKENS.find(
      (t) => t.symbol === baseAsset
    )?.decimals;
    quoteAssetDecimals = SUPPORTED_TOKENS.find(
      (t) => t.symbol === quoteAsset
    )?.decimals;
    const amount = Math.floor(
      parseFloat(baseAmount.toString()) * 10 ** (baseAssetDecimals ?? 0)
    );

    fetchQuote(
      setQuoteAmount,
      setQuoteLoading,
      setQuoteResponse,
      amount,
      baseAsset,
      quoteAsset,
      baseAsssetMintAddress,
      quoteAssetMintAddress,
      baseAssetDecimals,
      quoteAssetDecimals
    );
  }, [baseAsset, quoteAsset, baseAmount]);

  const initiateSwap = async () => {
    try {
      setTransactionStatus("pending");
      setTransactionStatusBar(true);
      setTxid(null);

      const response = await axios.post("/api/swap", {
        quoteResponse,
      });

      if (response.data.txid) {
        setTxid(response.data.txid);
        setTransactionStatus("success");
      } else {
        setTransactionStatus("error");
        setTransactionStatusBar(false);
      }
    } catch (error) {
      console.error("Swap error:", error);
      setTransactionStatus("error");
      setTransactionStatusBar(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || !isNaN(Number(value))) {
      setBaseAmount(Number(value));
      if (
        Number(value) >
        Number(
          tokenBalances.find((t: any) => t.token_name === baseAsset)
            ?.token_balance
        )
      ) {
        setInsufficientFunds(true);
      } else {
        setInsufficientFunds(false);
      }
    }
  };
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: grey[200],
          mb: 2,
        }}
      >
        <Balance
          isLoading={isLoading}
          totalUsdBalance={totalUsdBalance}
          snackbarOpen={snackbarOpen}
          setSnackbarOpen={setSnackbarOpen}
        />
      </Paper>
      <Box sx={{ maxWidth: 960, width: "100%", mx: "auto" }}>
        {/* Header */}
        <TransactionStatus
          transactionStatus={transactionStatus}
          setTransactionStatus={setTransactionStatus}
          transactionStatusBar={transactionStatusBar}
          setTransactionStatusBar={setTransactionStatusBar}
          txid={txid}
        />
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            sx={{
              color: "text.secondary",
              textTransform: "none",
              fontWeight: 400,
              p: "4px 8px",
            }}
            onClick={() => setSelectedPage("tokens")}
          >
            Back
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Powered by
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#F99D07" }}
            >
              Jupiter
            </Typography>
          </Box>
        </Box>

        {/* Swap Card */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: grey[200],
            borderRadius: 2.5,
            p: 2.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
          >
            Swap Tokens
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
            <Alert
              severity={insufficientSolForFee ? "error" : "info"}
              sx={{ display: "flex", alignItems: "center", flex: 1 }}
            >
              <AlertTitle sx={{ mr: 1, display: "inline" }}>Note:-</AlertTitle>
              {insufficientSolForFee ? (
                <>
                  You don't have enough SOL to cover the network fee. Please add
                  at least {maxNetworkFee.toFixed(6)} SOL to your wallet.
                </>
              ) : baseAsset === "SOL" ? (
                <>
                  For this swap, a network fee between{" "}
                  {estimatedNetworkFee.toFixed(6)} SOL and{" "}
                  {maxNetworkFee.toFixed(6)} SOL will be deducted from your
                  input amount. The quote above already accounts for this fee.
                </>
              ) : (
                <>
                  For this swap, a network fee between{" "}
                  {estimatedNetworkFee.toFixed(6)} SOL and{" "}
                  {maxNetworkFee.toFixed(6)} SOL will be required from your SOL
                  balance. Make sure you have enough SOL to cover the network
                  fee.
                </>
              )}
              The actual fee will depend on network conditions at the time of
              the swap.
            </Alert>
          </Box>
          {/* You Pay Section */}
          <Box sx={{ mb: 2 }}>
            <Typography
              color="text.secondary"
              sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.9rem" }}
            >
              You Pay:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                bgcolor: grey[50],
                borderRadius: 2,
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: grey[100],
                },
              }}
            >
              <TokenSelector
                token={baseAsset}
                balance="0.0639"
                onTokenSelect={setBaseAsset}
                baseAsset={baseAsset}
                quoteAsset={quoteAsset}
                type="baseAsset"
              />
              <Box sx={{ flexGrow: 1, position: "relative" }}>
                <NumberTextField
                  fullWidth
                  variant="standard"
                  placeholder="0"
                  type="number"
                  disabled={quoteLoading}
                  value={baseAmount}
                  onChange={handleInputChange}
                  InputProps={{
                    sx: {
                      fontSize: "1.75rem",
                      fontWeight: 500,
                      "&::before": { display: "none" },
                      "&::after": { display: "none" },
                      direction: "rtl",
                    },
                  }}
                />

                <Button
                  sx={{
                    position: "absolute",
                    top: "100%",
                    right: "-1.8%",
                    transform: "translateY(-50%)",
                    color: "primary.main",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    minWidth: 0,
                    p: "4px 8px",
                    "&:hover": {
                      bgcolor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                  onClick={() =>
                    setBaseAmount(
                      Number(
                        tokenBalances.find(
                          (t: any) => t.token_name === baseAsset
                        )?.token_balance
                      )
                    )
                  }
                >
                  Max
                </Button>
              </Box>
            </Box>
            {insufficientFunds && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Insufficient balance
              </Alert>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, ml: 1, fontSize: "0.8rem" }}
            >
              Current Balance:{" "}
              {
                tokenBalances.find((t: any) => t.token_name === baseAsset)
                  ?.token_balance
              }{" "}
              {baseAsset}
            </Typography>
          </Box>

          {/* Swap Direction Button */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={() => {
                setBaseAsset(quoteAsset);
                setQuoteAsset(baseAsset);
              }}
              sx={{
                bgcolor: grey[100],
                p: 1,
                "&:hover": {
                  bgcolor: grey[200],
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s",
              }}
            >
              <SwapVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* You Receive Section */}
          <Box sx={{ mb: 3 }}>
            <Typography
              color="text.secondary"
              sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.9rem" }}
            >
              You Receive:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                bgcolor: grey[50],
                borderRadius: 2,
              }}
            >
              <TokenSelector
                token={quoteAsset}
                balance="0"
                onTokenSelect={setQuoteAsset}
                baseAsset={baseAsset}
                quoteAsset={quoteAsset}
                type="quoteAsset"
              />
              <Box sx={{ flexGrow: 1, position: "relative" }}>
                <Box sx={{ textAlign: "right" }}>
                  {quoteLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Typography
                      variant="body2"
                      color="black"
                      sx={{ fontWeight: 500, fontSize: "1.75rem" }}
                    >
                      {quoteAmount}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, ml: 1, fontSize: "0.8rem" }}
            >
              Current Balance:{" "}
              {
                tokenBalances.find((t: any) => t.token_name === quoteAsset)
                  ?.token_balance
              }{" "}
              {quoteAsset}
            </Typography>
          </Box>

          {/* Bottom Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2.5,
              color: grey[600],
            }}
          >
            <Button
              sx={{
                color: "inherit",
                textTransform: "none",
                fontSize: "0.85rem",
                p: "4px 8px",
                "&:hover": {
                  bgcolor: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              View Swap Details
            </Button>
            <IconButton
              size="small"
              sx={{
                color: "inherit",
                p: 1,
                "&:hover": {
                  bgcolor: grey[100],
                },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: 1.5,
                py: 1.25,
                borderColor: grey[300],
                color: "text.primary",
                textTransform: "none",
                fontSize: "0.9rem",
                "&:hover": {
                  borderColor: grey[400],
                  bgcolor: "transparent",
                },
              }}
              onClick={() => setSelectedPage("tokens")}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 1.5,
                py: 1.25,
                textTransform: "none",
                fontSize: "0.9rem",
                "&:hover": {
                  bgcolor: blue[300],
                },
                "&:disabled": {
                  bgcolor: grey[200],
                  color: grey[600],
                },
              }}
              disabled={
                !quoteResponse?.outAmount ||
                insufficientFunds ||
                insufficientSolForFee ||
                baseAmount <= 0 ||
                quoteLoading
              }
              onClick={initiateSwap}
            >
              Confirm & Swap
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
