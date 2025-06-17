"use client";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Fade,
  Grid,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loading from "../Loading";
import useTokenBalance from "@/app/hooks/hooks";
import Tokens from "./Tokens";
import Swap from "./Swap";
import Balance from "./Balance";
import Send from "./Send";
import AddFunds from "./AddFunds";

export type Page = "tokens" | "send" | "addFunds" | "swap";

export default function ProfileData() {
  const router = useRouter();
  const session = useSession();
  const { totalUsdBalance, tokenBalances, isLoading, error } = useTokenBalance(
    // @ts-ignore
    session?.data?.user?.publicKey
  );
  const [snackbarOpen, setSnackbarOpen] = useState({
    open: false,
    Transition: Fade,
    vertical: "top" as const,
    horizontal: "center" as const,
  });
  const [selectedPage, setSelectedPage] = useState<Page>("tokens");

  useEffect(() => {
    if (!session.data?.user) {
      router.push("/");
    }
  }, [session.data?.user, router]);

  if (session.status === "loading") {
    return <Loading />;
  }

  if (!session.data?.user) {
    return null;
  }

  return (
    <>
      {selectedPage === "tokens" && (
        <>
          <Box
            sx={{ display: "flex", alignItems: "center", mb: 4, pt: 6, px: 6 }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                mr: 2,
                fontSize: "1.5rem",
              }}
              src={session.data?.user?.image || undefined}
              alt={session.data?.user?.name?.[0] || "U"}
            />
            <Typography variant="h4" component="h1">
              Welcome back, {session.data?.user?.name}!
            </Typography>
          </Box>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Balance
              isLoading={isLoading}
              totalUsdBalance={totalUsdBalance}
              snackbarOpen={snackbarOpen}
              setSnackbarOpen={setSnackbarOpen}
            />
          </Box>
        </>
      )}

      {/* Action Buttons */}
      {selectedPage === "tokens" && (
        <Grid container spacing={2} sx={{ px: 6 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SendIcon />}
              sx={{ height: "48px" }}
              onClick={() => setSelectedPage("send")}
            >
              Send / Withdraw
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ height: "48px" }}
              onClick={() => setSelectedPage("addFunds")}
            >
              Add Funds
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SwapHorizIcon />}
              sx={{ height: "48px" }}
              onClick={() => setSelectedPage("swap")}
            >
              Swap
            </Button>
          </Grid>
        </Grid>
      )}
      {selectedPage === "tokens" && (
        <Tokens
          totalUsdBalance={totalUsdBalance}
          tokenBalances={tokenBalances}
          isLoading={isLoading}
          error={error || ""}
        />
      )}
      {selectedPage === "swap" && (
        <Swap
          isLoading={isLoading}
          totalUsdBalance={totalUsdBalance}
          tokenBalances={tokenBalances}
          error={error || ""}
          snackbarOpen={snackbarOpen}
          setSnackbarOpen={setSnackbarOpen}
          setSelectedPage={setSelectedPage}
        />
      )}
      {selectedPage === "send" && (
        <Send
          isLoading={isLoading}
          totalUsdBalance={totalUsdBalance}
          tokenBalances={tokenBalances}
          snackbarOpen={snackbarOpen}
          setSnackbarOpen={setSnackbarOpen}
          setSelectedPage={setSelectedPage}
        />
      )}
      {selectedPage === "addFunds" && (
        <AddFunds
          isLoading={isLoading}
          totalUsdBalance={totalUsdBalance}
          tokenBalances={tokenBalances}
          snackbarOpen={snackbarOpen}
          setSnackbarOpen={setSnackbarOpen}
          setSelectedPage={setSelectedPage}
        />
      )}
    </>
  );
}
