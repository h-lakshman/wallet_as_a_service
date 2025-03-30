"use client";

import { Box, Button, Container, Grid, Typography } from "@mui/material";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <Box
      sx={{
        position: "relative",
        pt: { xs: 15, sm: 20 },
        pb: { xs: 8, sm: 12 },
        background:
          "linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #21CBF3 100%)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 150%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)",
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", sm: "3.5rem" },
                  fontWeight: 800,
                  mb: 2,
                  color: "white",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  lineHeight: 1.2,
                }}
              >
                Your Gateway to{" "}
                <Box
                  component="span"
                  sx={{
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: "0.1em",
                      left: 0,
                      width: "100%",
                      height: "0.2em",
                      background: "rgba(255,255,255,0.3)",
                      zIndex: -1,
                    },
                  }}
                >
                  Crypto
                </Box>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                Experience secure, fast, and reliable cryptocurrency exchange
                platform
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => signIn("google")}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: "12px",
                  textTransform: "none",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 20px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Get Started Now
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: "relative",
                height: { xs: "300px", md: "500px" },
                width: "100%",
                display: { xs: "none", md: "block" },
              }}
            >
              <Box
                component="img"
                src="/hero-image.svg"
                alt="Crypto Exchange"
                sx={{
                  position: "absolute",
                  width: "120%",
                  height: "120%",
                  objectFit: "contain",
                  transform: "translateX(-10%)",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))",
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
