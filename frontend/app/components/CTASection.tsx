"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import AuthButton from "./AuthButton";

export default function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 8, sm: 12 },
        background:
          "linear-gradient(135deg, #1976d2 0%, #2196f3 50%, #21CBF3 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 80% -50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)",
        },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              color: "white",
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.5rem" },
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Ready to Start Your Crypto Journey?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              mb: 4,
              maxWidth: "600px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Join thousands of users who trust DCEX for their cryptocurrency
            exchange needs
          </Typography>
          <AuthButton buttonStyle="white" size="large" />
        </Box>
      </Container>
    </Box>
  );
}
