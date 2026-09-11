import {
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

export default function Registro() {
  const {
    user,
    registrar,
    iniciarConGoogle,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmar,
    setConfirmar,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const crearCuenta =
    async (event) => {
      event.preventDefault();

      if (
        password.length <
        6
      ) {
        setError(
          "La contraseña debe tener al menos 6 caracteres."
        );

        return;
      }

      if (
        password !==
        confirmar
      ) {
        setError(
          "Las contraseñas no coinciden."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        await registrar({
          nombre,
          email:
            email.trim(),
          password,
        });

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          traducirError(
            err.code
          )
        );
      } finally {
        setLoading(false);
      }
    };

  const registrarGoogle =
    async () => {
      try {
        setLoading(true);
        setError("");

        await iniciarConGoogle();

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          traducirError(
            err.code
          )
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <Box
      sx={{
        minHeight:
          "100vh",

        display:
          "grid",

        placeItems:
          "center",

        background:
          "linear-gradient(135deg, #F8F7FF 0%, #F6F7FB 45%, #EEF9F5 100%)",

        p: 2,
      }}
    >
      <Card
        sx={{
          width:
            "100%",

          maxWidth:
            480,

          borderRadius:
            "28px",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 4,
            },
          }}
        >
          <Typography
            sx={{
              textAlign:
                "center",

              color:
                "#6D5DFB",

              fontSize:
                34,

              fontWeight:
                900,
            }}
          >
            LUMA
          </Typography>

          <Typography
            sx={{
              mt: 2,

              textAlign:
                "center",

              fontSize:
                23,

              fontWeight:
                800,
            }}
          >
            Crea tu cuenta
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              textAlign:
                "center",

              mb: 3,
            }}
          >
            Empieza a organizar
            tus finanzas.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius:
                  "14px",
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            onClick={
              registrarGoogle
            }
            disabled={
              loading
            }
            sx={{
              mb: 2.5,
              py: 1.3,
            }}
          >
            Registrarme con Google
          </Button>

          <Box
            component="form"
            onSubmit={
              crearCuenta
            }
          >
            <TextField
              fullWidth
              label="Nombre"
              value={nombre}
              onChange={(
                event
              ) =>
                setNombre(
                  event.target.value
                )
              }
              sx={{
                mb: 2,
              }}
            />

            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              required
              sx={{
                mb: 2,
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
              required
              sx={{
                mb: 2,
              }}
            />

            <TextField
              fullWidth
              label="Confirmar contraseña"
              type="password"
              value={
                confirmar
              }
              onChange={(
                event
              ) =>
                setConfirmar(
                  event.target.value
                )
              }
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                loading
              }
              sx={{
                mt: 3,
                py: 1.4,
              }}
            >
              {loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </Button>
          </Box>

          <Box
            sx={{
              textAlign:
                "center",

              mt: 2.5,
            }}
          >
            <Button
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >
              Ya tengo una cuenta
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function traducirError(
  codigo
) {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este correo.";

    case "auth/invalid-email":
      return "El correo electrónico no es válido.";

    case "auth/weak-password":
      return "La contraseña es demasiado débil.";

    case "auth/popup-closed-by-user":
      return "Se cerró la ventana de Google antes de completar el registro.";

    default:
      return "No fue posible crear la cuenta.";
  }
}