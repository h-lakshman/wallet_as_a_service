import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Typography,
  Link,
} from "@mui/material";
import { CheckCircle, Error } from "@mui/icons-material";

const TransactionStatus = ({
  transactionStatus,
  setTransactionStatus,
  transactionStatusBar,
  setTransactionStatusBar,
  txid,
}: {
  transactionStatus: "pending" | "success" | "error" | null;
  setTransactionStatus: (
    status: "pending" | "success" | "error" | null
  ) => void;
  transactionStatusBar: boolean;
  setTransactionStatusBar: (status: boolean) => void;
  txid: string | null;
}) => {
  const handleClose = () => {
    setTransactionStatusBar(false);
    setTransactionStatus(null);
  };

  const getStatusContent = () => {
    switch (transactionStatus) {
      case "pending":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} sx={{ color: "info.main" }} />
            <Typography variant="body2">Processing transaction...</Typography>
          </Box>
        );
      case "success":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle sx={{ color: "success.main" }} />
            <Box>
              <Typography variant="body2" sx={{ color: "success.main" }}>
                Transaction successful!
              </Typography>
              {txid && (
                <Link
                  href={`https://solscan.io/tx/${txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: "0.75rem", color: "info.main" }}
                >
                  View on Solscan
                </Link>
              )}
            </Box>
          </Box>
        );
      case "error":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Error sx={{ color: "error.main" }} />
            <Typography variant="body2" sx={{ color: "error.main" }}>
              Transaction failed. Please try again.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Snackbar
      open={transactionStatusBar}
      autoHideDuration={transactionStatus === "success" ? 30000 : null}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        severity={
          transactionStatus === "success"
            ? "success"
            : transactionStatus === "error"
            ? "error"
            : "info"
        }
        sx={{
          width: "100%",
          alignItems: "center",
          "& .MuiAlert-icon": {
            alignItems: "center",
          },
        }}
      >
        {getStatusContent()}
      </Alert>
    </Snackbar>
  );
};

export default TransactionStatus;
