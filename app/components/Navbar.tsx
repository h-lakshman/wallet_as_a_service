"use client";

import { AppBar, Container, Stack, Toolbar, Typography } from "@mui/material";
import AuthButton from "./landing/AuthButton";

export default function Navbar() {
  return (
    <AppBar
      position="fixed"
      sx={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
      }}
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
              letterSpacing: "-0.02em",
            }}
          >
            DCEX
          </Typography>
          <Stack direction="row" spacing={2}>
            <AuthButton buttonStyle="primary" />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
