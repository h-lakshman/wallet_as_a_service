"use client";

import { Button, Skeleton } from "@mui/material";

export default function LoadingButton() {
  return (
    <Skeleton
      variant="rectangular"
      width={160}
      height={40}
      sx={{
        borderRadius: "12px",
        bgcolor: "rgba(0, 0, 0, 0.1)",
      }}
    />
  );
}
