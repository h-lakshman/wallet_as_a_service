"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const session = useSession();
  return (
    <AppBar
      position="fixed"
      sx={{ bgcolor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DCEX
          </Typography>
          <Stack direction="row" spacing={2}>
            {session.data?.user ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => signOut()}
                startIcon={<AccountBalanceWallet />}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                px: 3,
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.04)",
                },
              }}
            >
                Sign In
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => signIn()}
                startIcon={<AccountBalanceWallet />}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  px: 3,
                }}
              > 
                Sign In
              </Button>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
