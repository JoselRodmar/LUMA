import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

export default function NotFound() {
  const navigate =
    useNavigate();

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 600,
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
              fontSize: 54,
            }}
          >
            🧭
          </Typography>

          <Typography
            sx={{
              fontSize: 38,
              fontWeight: 900,
              color: "#6D5DFB",
              mt: 1,
            }}
          >
            404
          </Typography>

          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Esta página no existe
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              lineHeight: 1.6,
            }}
          >
            Es posible que el enlace sea incorrecto o
            que esta sección ya no esté disponible.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 1.5,
              mt: 4,
            }}
          >
            <Button
              variant="contained"
              onClick={() =>
                navigate("/")
              }
            >
              Ir al Dashboard
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                navigate(-1)
              }
            >
              Volver
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}