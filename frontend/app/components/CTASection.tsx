"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";
import { signIn } from "next-auth/react";

export default function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 8, sm: 12 },
        background: "linear-gradient(135deg, #f6f9fc 0%, #f1f4f8 100%)",
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
            "radial-gradient(circle at 80% -60%, #2196f3 0%, transparent 70%)",
          opacity: 0.05,
        },
      }}
    >
      <Container maxWidth="lg">
        <Card
          sx={{
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 30px 60px rgba(0,0,0,0.08)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #2196f3 0%, #21CBF3 100%)",
            },
          }}
        >
          <CardContent sx={{ p: { xs: 4, sm: 8 }, textAlign: "center" }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", sm: "2.5rem" },
                mb: 2,
                background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Ready to Start Trading?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                mb: 4,
                maxWidth: "600px",
                mx: "auto",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Join thousands of users who trust our platform for their
              cryptocurrency needs. Start trading with confidence today!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => signIn("google")}
              startIcon={<AccountBalanceWallet />}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: "12px",
                textTransform: "none",
                background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
                boxShadow: "0 8px 16px rgba(33, 150, 243, 0.3)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 20px rgba(33, 150, 243, 0.4)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Create Your Account
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
