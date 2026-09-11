import {
  useState,
} from "react";

import {
  deleteUser,
  getAdditionalUserInfo,
} from "firebase/auth";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Link,
  TextField,
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

export default function Login() {
  const {
    iniciarSesion,
    iniciarConGoogle,
    recuperarPassword,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const destino =
    location.state?.from ||
    "/";

  const entrar =
    async (event) => {
      event.preventDefault();

      try {
        setLoading(true);
        setError("");
        setMensaje("");

        await iniciarSesion(
          email.trim(),
          password
        );

        navigate(
          destino,
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

  const entrarGoogle =
    async () => {
      try {
        setLoading(true);
        setError("");
        setMensaje("");

        const credencial =
          await iniciarConGoogle();

        const info =
          getAdditionalUserInfo(
            credencial
          );

        /*
          Si Google acaba de crear
          esta cuenta, significa que
          todavía no pasó por Registro
          ni otorgó los consentimientos.

          Eliminamos inmediatamente
          esa cuenta vacía.
        */

        if (
          info?.isNewUser
        ) {
          await deleteUser(
            credencial.user
          );

          setError(
            "Esta cuenta todavía no está registrada en LUMA. Selecciona Crear cuenta para revisar y aceptar los Términos y el Aviso de Privacidad."
          );

          return;
        }

        navigate(
          destino,
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

  const recuperar =
    async () => {
      if (!email.trim()) {
        setError(
          "Escribe tu correo para recuperar la contraseña."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        await recuperarPassword(
          email.trim()
        );

        setMensaje(
          "Te enviamos un correo para restablecer tu contraseña."
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
            460,

          borderRadius:
            "28px",

          border:
            "1px solid rgba(109,93,251,.10)",
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
          <Box
            sx={{
              textAlign:
                "center",

              mb: 3,
            }}
          >
            <Typography
              sx={{
                color:
                  "#6D5DFB",

                fontSize:
                  36,

                fontWeight:
                  900,

                letterSpacing:
                  "-1.5px",
              }}
            >
              LUMA
            </Typography>

            <Typography
              sx={{
                color:
                  "text.secondary",

                fontSize:
                  11,

                letterSpacing:
                  1.5,
              }}
            >
              FINANZAS CLARAS · BETA
            </Typography>

            <Typography
              sx={{
                mt: 3,

                fontSize:
                  23,

                fontWeight:
                  800,
              }}
            >
              Bienvenido
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Tu dinero,
              organizado con
              claridad.
            </Typography>
          </Box>

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

          {mensaje && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius:
                  "14px",
              }}
            >
              {mensaje}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            onClick={
              entrarGoogle
            }
            disabled={
              loading
            }
            sx={{
              py: 1.4,
            }}
          >
            Continuar con Google
          </Button>

          <Divider
            sx={{
              my: 2.5,
            }}
          >
            <Typography
              color="text.secondary"
              fontSize={12}
            >
              o
            </Typography>
          </Divider>

          <Box
            component="form"
            onSubmit={entrar}
          >
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
            />

            <Box
              sx={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                mt: 0.5,
              }}
            >
              <Button
                size="small"
                onClick={
                  recuperar
                }
                disabled={
                  loading
                }
              >
                Olvidé mi contraseña
              </Button>
            </Box>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={
                loading
              }
              sx={{
                mt: 2,
                py: 1.4,
              }}
            >
              {loading
                ? "Entrando..."
                : "Iniciar sesión"}
            </Button>
          </Box>

          <Typography
            sx={{
              textAlign:
                "center",

              mt: 3,

              color:
                "text.secondary",
            }}
          >
            ¿No tienes cuenta?{" "}
            <Button
              size="small"
              onClick={() =>
                navigate(
                  "/registro"
                )
              }
            >
              Crear cuenta
            </Button>
          </Typography>

          <Divider
            sx={{
              my: 2.5,
            }}
          />

          <Box
            sx={{
              textAlign:
                "center",
            }}
          >
            <Link
              component={
                RouterLink
              }
              to="/privacidad"
              fontSize={12}
              underline="hover"
            >
              Privacidad
            </Link>

            <Typography
              component="span"
              color="text.secondary"
              fontSize={12}
              sx={{
                mx: 1,
              }}
            >
              ·
            </Typography>

            <Link
              component={
                RouterLink
              }
              to="/terminos"
              fontSize={12}
              underline="hover"
            >
              Términos
            </Link>
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
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";

    case "auth/invalid-email":
      return "El correo electrónico no es válido.";

    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta nuevamente más tarde.";

    case "auth/popup-closed-by-user":
      return "Se cerró la ventana de Google antes de completar el acceso.";

    default:
      return "No fue posible iniciar sesión. Intenta nuevamente.";
  }
}