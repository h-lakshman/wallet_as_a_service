import {
  Box,
  Typography,
  Button,
  Snackbar,
  Fade,
  CircularProgress,
  FadeProps,
} from "@mui/material";
import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { grey } from "@mui/material/colors";
import { useSession } from "next-auth/react";

export default function Balance({
  isLoading,
  totalUsdBalance,
  snackbarOpen,
  setSnackbarOpen,
}: {
  isLoading: boolean;
  totalUsdBalance: number;
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
}) {
  const session = useSession();
  const handleCopy = () => {
    navigator.clipboard.writeText(
      // @ts-ignore
      session.data?.user?.publicKey || ""
    );
    setSnackbarOpen({ ...snackbarOpen, open: true });
  };
  return (
    <Box sx={{ px: 6 }}>
      <Typography variant="body1" color="text.secondary">
        Account Assets
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h2" component="div">
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              Loading...
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="h2" component="div">
                {totalUsdBalance}
              </Typography>
              <Typography
                variant="h2"
                component="div"
                sx={{
                  color: grey[600],
                  fontSize: "1.5rem",
                }}
              >
                USD
              </Typography>
            </Box>
          )}
        </Typography>
        <Button
          variant="contained"
          onClick={handleCopy}
          size="small"
          startIcon={<ContentCopyIcon />}
          sx={{
            height: "48px",
            backgroundColor: "grey.300",
            color: "grey.700",
            borderRadius: "24px",
            opacity: 0.8,
          }}
        >
          Your Wallet address
        </Button>
        <Snackbar
          open={snackbarOpen.open}
          onClose={() => setSnackbarOpen({ ...snackbarOpen, open: false })}
          message="Copied to clipboard"
          anchorOrigin={{
            vertical: snackbarOpen.vertical as "top" | "bottom",
            horizontal: snackbarOpen.horizontal as "center" | "right" | "left",
          }}
        />
      </Box>
    </Box>
  );
}
