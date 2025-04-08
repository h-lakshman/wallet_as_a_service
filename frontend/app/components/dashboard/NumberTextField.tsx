import { styled, TextField } from "@mui/material";

export const NumberTextField = styled(TextField)(({ theme }) => ({
  "& input[type=number]": {
    // Firefox
    MozAppearance: "textfield",
  },
  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
    {
      // Chrome, Safari, Edge
      WebkitAppearance: "none",
      margin: 0,
    },
}));
