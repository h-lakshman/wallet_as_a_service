"use client";

import { Button, ButtonProps } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingButton from "./LoadingButton";

interface AuthButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  buttonStyle?: "primary" | "white";
  size?: "medium" | "large";
  showIcon?: boolean;
}

export default function AuthButton({
  buttonStyle = "primary",
  size = "medium",
  showIcon = true,
  sx,
  ...props
}: AuthButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <LoadingButton />;
  }

  const baseStyles = {
    borderRadius: "12px",
    textTransform: "none",
    transition: "all 0.2s ease-in-out",
    px: size === "large" ? 4 : 3,
    py: size === "large" ? 1.5 : 1,
    fontSize: size === "large" ? "1.1rem" : "1rem",
    fontWeight: 600,
    ...sx,
  };

  const variants = {
    primary: {
      background: "linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)",
      color: "white",
      "&:hover": {
        background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
        transform: "translateY(-1px)",
        boxShadow: "0 6px 12px rgba(33, 150, 243, 0.2)",
      },
    },
    white: {
      bgcolor: "white",
      color: "primary.main",
      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
      "&:hover": {
        bgcolor: "rgba(255,255,255,0.9)",
        transform: "translateY(-2px)",
        boxShadow: "0 12px 20px rgba(0,0,0,0.15)",
      },
    },
  };

  const buttonProps = {
    variant: "contained" as const,
    onClick: session?.user
      ? buttonStyle === "white"
        ? () => router.push("/dashboard")
        : () => signOut()
      : () => signIn("google"),
    startIcon: showIcon ? <AccountBalanceWallet /> : null,
    sx: {
      ...baseStyles,
      ...variants[buttonStyle],
    },
    ...props,
  };

  return (
    <Button {...buttonProps}>
      {session?.user
        ? buttonStyle === "white"
          ? "Go to Dashboard"
          : "Sign Out"
        : buttonStyle === "white"
        ? "Get Started Now"
        : "Sign In with Google"}
    </Button>
  );
}
