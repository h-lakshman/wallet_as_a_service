"use client";
import {
  Box,
  Button,
  Container,
  FadeProps,
  Paper,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Balance from "./Balance";
import { grey } from "@mui/material/colors";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Page } from "./ProfileData";
import { Token } from "@/app/lib/supportedTokens";
import { TokenSelector } from "./TokenSelector";
import { updateNetworkFee, ACCOUNT_CREATION_FEE } from "@/app/lib/constants";
import axios from "axios";
import TransactionStatus from "./TransactionStatus";

export default function Send({
  isLoading,
  totalUsdBalance,
  tokenBalances,
  snackbarOpen,
  setSnackbarOpen,
  setSelectedPage,
}: {
  isLoading: boolean;
  totalUsdBalance: number;
  tokenBalances: Token[];
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
  const [selectedAsset, setSelectedAsset] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [maxNetworkFee, setMaxNetworkFee] = useState<number>(0);
  const [insufficientSolForFee, setInsufficientSolForFee] = useState(false);
  const [estimatedNetworkFee, setEstimatedNetworkFee] = useState<number>(0);
  const [accountCreationFee] = useState(ACCOUNT_CREATION_FEE / 1e9); // Convert lamports to SOL
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const [transactionStatusBar, setTransactionStatusBar] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);

  const handleMaxClick = () => {
    setAmount(availableBalance.toString());
  };

  const showAvailableBalance = () => {
    const balance = tokenBalances.find(
      (t) => t.token_name === selectedAsset
    )?.token_balance;
    if (selectedAsset === "SOL") {
      const totalFeesToReserve = maxNetworkFee + accountCreationFee;
      const maxBalance = Math.max(0, Number(balance) - totalFeesToReserve);
      setAvailableBalance(maxBalance);
    } else {
      setAvailableBalance(Number(balance));
    }
  };

  useEffect(() => {
    showAvailableBalance();
    updateNetworkFee(
      tokenBalances,
      setEstimatedNetworkFee,
      setMaxNetworkFee,
      setInsufficientSolForFee
    );
    // Re-validate balance whenever network fees change
    if (amount) {
      setTimeout(() => validateBalance(), 100); // Small delay to ensure fee states are updated
    }
  }, [selectedAsset, tokenBalances, maxNetworkFee]);

  useEffect(() => {
    if (tokenBalances.length > 0) {
      updateNetworkFee(
        tokenBalances,
        setEstimatedNetworkFee,
        setMaxNetworkFee,
        setInsufficientSolForFee
      );
      // Re-validate balance whenever network fees change
      if (amount) {
        setTimeout(() => validateBalance(), 100); // Small delay to ensure fee states are updated
      }
    }
  }, [tokenBalances, maxNetworkFee]);

  // Comprehensive balance validation function
  const validateBalance = (amountToSend: string = amount) => {
    if (!amountToSend || amountToSend === "0") {
      setInsufficientFunds(false);
      setInsufficientSolForFee(false);
      return;
    }

    const currentBalance = Number(
      tokenBalances.find((t: any) => t.token_name === selectedAsset)
        ?.token_balance
    );

    console.log("🔍 Balance Validation:", {
      selectedAsset,
      amountToSend,
      currentBalance,
      maxNetworkFee,
      accountCreationFee,
      tokenBalances: tokenBalances.map((t) => ({
        name: t.token_name,
        balance: t.token_balance,
      })),
    });

    if (selectedAsset === "SOL") {
      const sendAmount = Number(amountToSend);
      const totalRequired = sendAmount + maxNetworkFee + accountCreationFee;

      console.log("💰 SOL Transaction:", {
        sendAmount,
        maxNetworkFee,
        accountCreationFee,
        totalRequired,
        currentBalance,
        isInsufficient: currentBalance < totalRequired,
      });

      if (currentBalance < totalRequired) {
        setInsufficientFunds(true);
        setInsufficientSolForFee(false);
      } else {
        setInsufficientFunds(false);
        setInsufficientSolForFee(false);
      }
    } else {
      const solBalance = Number(
        tokenBalances.find((t: any) => t.token_name === "SOL")?.token_balance
      );

      // Check token balance
      const hasInsufficientTokens = Number(amountToSend) > currentBalance;

      // For SPL tokens, check if we have enough SOL for fees and potential account creation
      const totalSolRequired = maxNetworkFee + accountCreationFee;
      const hasInsufficientSolForFees = solBalance < totalSolRequired;

      console.log("🪙 Token Transaction:", {
        tokenAmount: amountToSend,
        tokenBalance: currentBalance,
        hasInsufficientTokens,
        solBalance,
        totalSolRequired,
        hasInsufficientSolForFees,
      });

      setInsufficientFunds(hasInsufficientTokens);
      setInsufficientSolForFee(hasInsufficientSolForFees);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || !isNaN(Number(value))) {
      setAmount(value);
      validateBalance(value);
    }
  };

  const selectedTokenPrice = tokenBalances.find(
    (t) => t.token_name === selectedAsset
  )?.token_price;
  const usdValue = parseFloat(amount || "0") * Number(selectedTokenPrice || 0);

  const onConfirm = async () => {
    // Final validation check before submitting
    validateBalance();

    // Double-check that we don't have insufficient funds
    if (insufficientFunds || insufficientSolForFee) {
      console.warn("Transaction blocked: Insufficient funds detected");
      setTransactionStatus("error");
      setTransactionStatusBar(false);
      return;
    }

    // Additional manual validation using current values
    const currentBalance = Number(
      tokenBalances.find((t: any) => t.token_name === selectedAsset)
        ?.token_balance
    );

    if (selectedAsset === "SOL") {
      const sendAmount = Number(amount);
      const totalRequired = sendAmount + maxNetworkFee + accountCreationFee;

      if (currentBalance < totalRequired) {
        console.warn(
          `Transaction blocked: Need ${totalRequired.toFixed(
            6
          )} SOL but only have ${currentBalance.toFixed(6)} SOL`
        );
        setInsufficientFunds(true);
        setTransactionStatus("error");
        setTransactionStatusBar(false);
        return;
      }
    }

    try {
      setTransactionStatus("pending");
      setTransactionStatusBar(true);
      setTxid(null);

      const response = await axios.post("/api/send", {
        sendAmount: amount,
        toPubKey: recipientAddress,
        tokenSymbol: selectedAsset,
      });

      if (response.data.txid) {
        setTxid(response.data.txid);
        setTransactionStatus("success");
        // Clear form on success
        setAmount("");
        setRecipientAddress("");
      } else {
        setTransactionStatus("error");
        setTransactionStatusBar(false);
      }
    } catch (error) {
      console.error("Send failed:", error);
      setTransactionStatus("error");
      setTransactionStatusBar(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 2 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: grey[200],
          mb: 4,
        }}
      >
        <Balance
          isLoading={isLoading}
          totalUsdBalance={totalUsdBalance}
          snackbarOpen={snackbarOpen}
          setSnackbarOpen={setSnackbarOpen}
        />
      </Paper>

      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          border: "1px solid",
          borderColor: grey[200],
          maxWidth: 800,
          width: "100%",
          mx: "auto",
        }}
      >
        {/* Transaction Status */}
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

        <Typography
          variant="h4"
          sx={{
            color: "rgb(45, 76, 93)",
            fontSize: "26px",
            fontWeight: "700",
            mb: 1,
          }}
        >
          Send & Withdraw Funds
        </Typography>

        <Typography
          sx={{
            color: "rgb(82, 107, 121)",
            fontSize: "16px",
            fontWeight: "400",
            mb: 4,
          }}
        >
          Send funds to any Solana wallet address or withdraw to your external
          wallet.
        </Typography>

        {/* Asset Selector */}
        <Box sx={{ mb: 2 }}>
          <Typography
            color="text.secondary"
            sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.9rem" }}
          >
            Select Asset:
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              bgcolor: grey[50],
              borderRadius: 2,
              border: "1px solid",
              borderColor: grey[200],
            }}
          >
            <TokenSelector
              token={selectedAsset}
              balance={availableBalance.toString()}
              onTokenSelect={setSelectedAsset}
              baseAsset={selectedAsset}
              quoteAsset=""
              type="baseAsset"
            />
            <Box sx={{ flexGrow: 1 }} />
          </Box>
        </Box>

        {/* Available Balance */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 2,
            textAlign: "center",
          }}
        >
          Available {selectedAsset}: {availableBalance} {selectedAsset}
          {selectedAsset !== "SOL" && (
            <Typography
              variant="caption"
              display="block"
              sx={{ fontSize: "11px", mt: 0.5 }}
            >
              (Requires {(maxNetworkFee + accountCreationFee).toFixed(6)} SOL
              for fees + potential account creation)
            </Typography>
          )}
        </Typography>

        {/* Amount Input */}
        <Box sx={{ mb: 2 }}>
          <Typography
            color="text.secondary"
            sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.9rem" }}
          >
            Amount to Send:
          </Typography>
          <TextField
            fullWidth
            value={amount}
            type="number"
            onChange={handleInputChange}
            placeholder={`0.000105 ${selectedAsset}`}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "24px",
                fontWeight: "500",
                textAlign: "center",
                py: 3,
              },
              "& .MuiOutlinedInput-input": {
                textAlign: "center",
                "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                MozAppearance: "textfield",
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleMaxClick}
                    sx={{
                      minWidth: "auto",
                      px: 2,
                      borderColor: grey[300],
                      color: "text.secondary",
                      textTransform: "none",
                    }}
                  >
                    Max
                  </Button>
                </InputAdornment>
              ),
              inputProps: {
                inputMode: "decimal",
                pattern: "[0-9]*",
                style: {
                  MozAppearance: "textfield",
                },
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              textAlign: "center",
              mt: 1,
            }}
          >
            ~${usdValue.toFixed(2)} USD
          </Typography>
          {insufficientFunds && (
            <Typography
              variant="body2"
              sx={{
                color: "error.main",
                textAlign: "center",
                mt: 1,
              }}
            >
              {selectedAsset === "SOL"
                ? `Insufficient SOL balance. You need ${(
                    Number(amount) +
                    maxNetworkFee +
                    accountCreationFee
                  ).toFixed(6)} SOL (including network fees) but only have ${
                    tokenBalances.find(
                      (t: any) => t.token_name === selectedAsset
                    )?.token_balance
                  } SOL`
                : `Insufficient ${selectedAsset} balance`}
            </Typography>
          )}
          {insufficientSolForFee && (
            <Typography
              variant="body2"
              sx={{
                color: "error.main",
                textAlign: "center",
                mt: 1,
              }}
            >
              {selectedAsset === "SOL"
                ? `Insufficient SOL for network fees. You need at least ${maxNetworkFee.toFixed(
                    6
                  )} SOL to cover transaction fees.`
                : `Insufficient SOL for network fees and potential account creation. You need at least ${(
                    maxNetworkFee + accountCreationFee
                  ).toFixed(
                    6
                  )} SOL to cover transaction fees and account creation.`}
            </Typography>
          )}
        </Box>

        {/* Recipient Address Input */}
        <Box sx={{ mb: 1 }}>
          <Typography
            color="text.secondary"
            sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.9rem" }}
          >
            Recipient Address:
          </Typography>
          <TextField
            fullWidth
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Enter Solana wallet address"
            sx={{
              "& .MuiOutlinedInput-root": {
                py: 2,
              },
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 4,
            fontSize: "14px",
          }}
        >
          .sol and AllDomains addresses supported
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedPage("tokens")}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1.5,
              borderColor: grey[300],
              color: "text.secondary",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              !amount ||
              !recipientAddress ||
              insufficientFunds ||
              insufficientSolForFee ||
              transactionStatus === "pending"
            }
            onClick={onConfirm}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1.5,
              backgroundColor: "#1976d2",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
              "&:disabled": {
                backgroundColor: grey[300],
                color: grey[500],
              },
            }}
          >
            {transactionStatus === "pending"
              ? "Processing..."
              : "✓ Confirm Send"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
