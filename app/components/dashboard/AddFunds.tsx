"use client";
import {
  Box,
  Button,
  Container,
  FadeProps,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import Balance from "./Balance";
import { grey } from "@mui/material/colors";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCodeIcon from "@mui/icons-material/QrCode";
import { Page } from "./ProfileData";
import { Token } from "@/app/lib/supportedTokens";
import { useSession } from "next-auth/react";

export default function AddFunds({
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
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const publicKey = session?.user?.publicKey || "";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
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
          Add Funds to Your Wallet
        </Typography>

        <Typography
          sx={{
            color: "rgb(82, 107, 121)",
            fontSize: "16px",
            fontWeight: "400",
            mb: 4,
          }}
        >
          Send SOL or SPL tokens from another wallet to deposit funds into your
          account.
        </Typography>

        {/* Wallet Address Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
          >
            Your Wallet Address
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: "2px solid",
              borderColor: "#1976d2",
              borderRadius: 2,
              bgcolor: "#f8f9ff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  Solana Address:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    wordBreak: "break-all",
                    bgcolor: "white",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: grey[300],
                  }}
                >
                  {publicKey}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Tooltip title={copied ? "Copied!" : "Copy address"}>
                  <IconButton
                    onClick={handleCopyAddress}
                    sx={{
                      bgcolor: copied ? "success.main" : "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: copied ? "success.dark" : "primary.dark",
                      },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show QR Code">
                  <IconButton
                    sx={{
                      bgcolor: grey[100],
                      color: "text.secondary",
                      "&:hover": {
                        bgcolor: grey[200],
                      },
                    }}
                  >
                    <QrCodeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle sx={{ fontWeight: 600 }}>How to Add Funds</AlertTitle>
          <Box component="ol" sx={{ pl: 2, mt: 1 }}>
            <li>Copy your wallet address above</li>
            <li>Open your external wallet (Phantom, Solflare, etc.)</li>
            <li>Send SOL or any Solana token to this address</li>
            <li>Your funds will appear in your balance within a few minutes</li>
          </Box>
        </Alert>

        {/* Supported Assets */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
          >
            Supported Assets
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: grey[200],
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              You can deposit any of these tokens:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["SOL", "USDC", "USDT", "RAY", "BONK", "WIF", "JUP"].map(
                (token) => (
                  <Box
                    key={token}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: grey[100],
                      borderRadius: 1,
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {token}
                  </Box>
                )
              )}
            </Box>
          </Paper>
        </Box>

        {/* Safety Notice */}
        <Alert severity="warning">
          <AlertTitle sx={{ fontWeight: 600 }}>
            Important Safety Notice
          </AlertTitle>
          <ul style={{ paddingLeft: "20px", margin: "8px 0 0 0" }}>
            <li>Only send Solana network tokens to this address</li>
            <li>
              Do not send tokens from other blockchains (Ethereum, Bitcoin,
              etc.)
            </li>
            <li>Double-check the address before sending</li>
            <li>Start with a small test amount for the first transaction</li>
          </ul>
        </Alert>
      </Paper>
    </Container>
  );
}
