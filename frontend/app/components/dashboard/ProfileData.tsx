"use client";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfileData() {
  const [tabValue, setTabValue] = useState(0);
  const [balance] = useState("0.00");
  const router = useRouter();
  const session = useSession();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      // @ts-ignore
      session.data?.user?.publicKey || ""
    );
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
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
            ${balance} USD
          </Typography>
          <Button variant="contained" color="primary" onClick={handleCopy}>
            Your Wallet address
          </Button>
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
            py: 4,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You don't have any assets yet!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Start by buying or depositing funds:
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add Funds
          </Button>
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
