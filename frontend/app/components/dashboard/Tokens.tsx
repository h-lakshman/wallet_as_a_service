import useTokenBalance from "@/app/hooks/hooks";
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { Typography, Button } from "@mui/material";
import React, { useState } from "react";
import TokenList from "./TokenList";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";
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
      {value === index && <Box sx={{ width: "100%" }}>{children}</Box>}
    </div>
  );
}
export default function Tokens({
  totalUsdBalance,
  tokenBalances,
  isLoading,
  error,
}: {
  totalUsdBalance: number;
  tokenBalances: any;
  isLoading: boolean;
  error: string;
}) {
  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* Tabs Section */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          width: "100%",
          marginTop: 2,
          px: 6,
        }}
      >
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
            px: 6,
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading your tokens...
              </Typography>
            </Box>
          ) : error ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <Typography variant="h6" color="error" gutterBottom>
                Error loading tokens
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
            </Box>
          ) : totalUsdBalance === 0 ? (
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
            <TokenList tokenBalances={tokenBalances} />
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
            px: 6,
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
            px: 6,
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
