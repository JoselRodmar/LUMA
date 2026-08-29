import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import App from "./App";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#6D5DFB",
    },

    success: {
      main: "#10B981",
    },

    error: {
      main: "#EF4444",
    },

    background: {
      default: "#F6F7FB",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#1E2330",
      secondary: "#73798A",
    },
  },

  typography: {
    fontFamily:
      '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingLeft: 20,
          paddingRight: 20,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 8px 30px rgba(31,38,135,0.07)",
        },
      },
    },
  },
});

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
