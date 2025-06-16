"use client";

import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import {
  AccountBalanceWallet,
  Security,
  Speed,
  SwapHoriz,
} from "@mui/icons-material";

const features = [
  {
    icon: <AccountBalanceWallet sx={{ fontSize: 48 }} />,
    title: "Secure Wallet",
    description:
      "Your funds are protected with enterprise-grade security and multi-signature support.",
    gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)",
  },
  {
    icon: <SwapHoriz sx={{ fontSize: 48 }} />,
    title: "Instant Exchange",
    description:
      "Trade between multiple cryptocurrencies with lightning-fast execution.",
    gradient: "linear-gradient(135deg, #4ECDC4 0%, #556270 100%)",
  },
  {
    icon: <Security sx={{ fontSize: 48 }} />,
    title: "Advanced Security",
    description:
      "State-of-the-art encryption and security measures to protect your assets.",
    gradient: "linear-gradient(135deg, #6C5CE7 0%, #A8E6CF 100%)",
  },
  {
    icon: <Speed sx={{ fontSize: 48 }} />,
    title: "Lightning Fast",
    description:
      "Experience seamless transactions with our optimized infrastructure.",
    gradient: "linear-gradient(135deg, #FF8C42 0%, #FFF275 100%)",
  },
];

export default function FeaturesSection() {
  return (
    <Box sx={{ py: { xs: 8, sm: 12 }, bgcolor: "#f8fafc" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          align="center"
          sx={{
            mb: 8,
            fontWeight: 800,
            fontSize: { xs: "2rem", sm: "2.5rem" },
            background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Why Choose FlowWallet
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "all 0.3s ease-in-out",
                  border: "1px solid rgba(0,0,0,0.08)",
                  "&:hover": {
                    transform: "translateY(-12px)",
                    boxShadow: "0 22px 40px rgba(0,0,0,0.08)",
                    "& .icon-wrapper": {
                      transform: "scale(1.1)",
                    },
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <Box
                    className="icon-wrapper"
                    sx={{
                      mb: 3,
                      p: 2,
                      borderRadius: "16px",
                      display: "inline-flex",
                      background: feature.gradient,
                      color: "white",
                      transition: "transform 0.3s ease-in-out",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.7,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
