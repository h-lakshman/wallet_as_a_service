import {
  ListItemIcon,
  MenuItem,
  Menu,
  Box,
  Typography,
  ListItemText,
} from "@mui/material";
import { SUPPORTED_TOKENS } from "@/app/lib/supportedTokens";
import { useState } from "react";
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { grey } from "@mui/material/colors";

export const TokenSelector = ({
  token,
  balance,
  onTokenSelect,
  baseAsset,
  quoteAsset,
  type,
}: {
  token: string;
  balance: string;
  onTokenSelect: (token: string) => void;
  baseAsset: string;
  quoteAsset: string;
  type: "baseAsset" | "quoteAsset";
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const tokenData = SUPPORTED_TOKENS.find((t) => t.symbol === token);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTokenSelect = (selectedToken: string) => {
    onTokenSelect(selectedToken);
    handleClose();
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: "8px 12px",
          bgcolor: grey[100],
          borderRadius: 2,
          cursor: "pointer",
          "&:hover": {
            bgcolor: grey[200],
          },
          minWidth: 120,
        }}
      >
        <Box
          component="img"
          src={tokenData?.image}
          alt={token}
          sx={{
            width: 20,
            height: 20,
            borderRadius: "50%",
          }}
        />
        <Typography sx={{ fontWeight: 500, fontSize: "0.9rem" }}>
          {token}
        </Typography>
        <KeyboardArrowDownIcon
          sx={{ color: "text.secondary", ml: "auto", fontSize: "1.2rem" }}
        />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            maxHeight: 300,
            width: 200,
          },
        }}
      >
        {SUPPORTED_TOKENS.filter(
          (t) => type === "baseAsset" || t.symbol !== baseAsset
        ).map((token) => (
          <MenuItem
            key={token.symbol}
            onClick={() => handleTokenSelect(token.symbol)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                component="img"
                src={token.image}
                alt={token.symbol}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary={token.symbol}
              secondary={token.name}
              primaryTypographyProps={{
                sx: { fontWeight: 500 },
              }}
              secondaryTypographyProps={{
                sx: { fontSize: "0.75rem" },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
