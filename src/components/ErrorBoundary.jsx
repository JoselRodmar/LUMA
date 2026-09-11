import React from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tieneError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      tieneError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error(
      "Error no controlado en LUMA:",
      error,
      info
    );
  }

  recargar = () => {
    window.location.reload();
  };

  irInicio = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.tieneError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#F6F7FB",
          p: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 560,
            borderRadius: "28px",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                sm: 5,
              },
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#6D5DFB",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              LUMA
            </Typography>

            <Typography
              sx={{
                fontSize: 42,
                mt: 3,
              }}
            >
              ⚠️
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: {
                  xs: 23,
                  sm: 27,
                },
                fontWeight: 900,
              }}
            >
              Algo no salió como esperábamos
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1.5,
                lineHeight: 1.6,
              }}
            >
              LUMA encontró un error y detuvo esta
              pantalla para evitar que continúes
              trabajando sobre un estado incorrecto.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                justifyContent: "center",
                gap: 1.5,
                mt: 4,
              }}
            >
              <Button
                variant="contained"
                onClick={this.recargar}
              >
                Intentar nuevamente
              </Button>

              <Button
                variant="outlined"
                onClick={this.irInicio}
              >
                Ir al inicio
              </Button>
            </Box>

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{
                mt: 3,
              }}
            >
              Si el problema continúa, cierra y vuelve
              a abrir LUMA.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }
}