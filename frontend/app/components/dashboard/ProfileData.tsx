"use client";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Snackbar,
  Fade,
  Grid,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loading from "../Loading";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import useTokenBalance from "@/app/hooks/hooks";
import { SUPPORTED_TOKENS } from "@/app/lib/constants";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type Token = {
  token_name: string;
  token_price: number | null;
  token_balance: string;
  usd_balance: string;
  error?: string | null;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ width: "100%" }}>{children}</Box>}
    </div>
  );
}

export default function ProfileData() {
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();
  const session = useSession();
  const { totalUsdBalance, tokenBalances } = useTokenBalance(
    // @ts-ignore
    session?.data?.user?.publicKey
  );
  const [snackbarOpen, setSnackbarOpen] = useState({
    open: false,
    Transition: Fade,
    vertical: "top",
    horizontal: "center",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(
      // @ts-ignore
      session.data?.user?.publicKey || ""
    );
    setSnackbarOpen({ ...snackbarOpen, open: true });
  };

  useEffect(() => {
    if (!session.data?.user) {
      router.push("/");
    }
  }, [session.data?.user, router]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (session.status === "loading") {
    return <Loading />;
  }

  if (!session.data?.user) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
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
      {/* Balance Section */}
      <Box sx={{ mb: 4 }}>
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
          <Typography variant="h2" component="div" sx={{ mb: 3 }}>
            {totalUsdBalance} USD{" "}
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
              horizontal: snackbarOpen.horizontal as
                | "center"
                | "right"
                | "left",
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SendIcon />}
              sx={{ height: "48px" }}
            >
              Send
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ height: "48px" }}
            >
              Add Funds
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LogoutIcon />}
              sx={{ height: "48px" }}
            >
              Withdraw
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<SwapHorizIcon />}
              sx={{ height: "48px" }}
            >
              Swap
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tokens" />
          <Tab label="NFTs" />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {totalUsdBalance === 0 ? (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You don't have any assets yet!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Start by buying or depositing funds:
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} size="large">
                Add Funds
              </Button>
            </>
          ) : (
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
                          1 {token.token_name} = $
                          {token.token_price
                            ? Number(token.token_price).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )
                            : "0.00"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right side - Balance info */}
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        $
                        {Number(token.usd_balance || "0").toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Number(token.token_balance || "0").toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          }
                        )}{" "}
                        {token.token_name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 4,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No NFTs found
          </Typography>
        </Box>
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 4,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No activity to show
          </Typography>
        </Box>
      </TabPanel>
    </>
  );
}
