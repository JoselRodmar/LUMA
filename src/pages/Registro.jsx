import {
  useState,
} from "react";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  TextField,
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
  useNavigate,
} from "react-router-dom";

import {
  db,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

import {
  LEGAL,
} from "../config/legal";

export default function Registro() {
  const {
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
    aceptaTerminos,
    setAceptaTerminos,
  ] = useState(false);

  const [
    aceptaFinancieros,
    setAceptaFinancieros,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const validarConsentimientos =
    () => {
      if (!aceptaTerminos) {
        setError(
          "Debes aceptar los Términos de Uso y el Aviso de Privacidad."
        );

        return false;
      }

      if (!aceptaFinancieros) {
        setError(
          "Necesitamos tu consentimiento expreso para tratar los datos financieros que decidas registrar en LUMA."
        );

        return false;
      }

      return true;
    };

  const guardarConsentimiento =
    async (
      usuario,
      nombreUsuario
    ) => {
      await setDoc(
        doc(
          db,
          "users",
          usuario.uid
        ),
        {
          displayName:
            nombreUsuario ||
            usuario.displayName ||
            "",

          email:
            usuario.email ||
            "",

          beta:
            true,

          terminosAceptados:
            true,

          terminosVersion:
            LEGAL.versionTerminos,

          terminosAceptadosAt:
            serverTimestamp(),

          privacidadAceptada:
            true,

          privacidadVersion:
            LEGAL.versionPrivacidad,

          privacidadAceptadaAt:
            serverTimestamp(),

          consentimientoDatosFinancieros:
            true,

          consentimientoDatosFinancierosAt:
            serverTimestamp(),

          createdAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    };

  const crearCuenta =
    async (event) => {
      event.preventDefault();

      setError("");

      if (
        !nombre.trim()
      ) {
        setError(
          "Escribe tu nombre."
        );

        return;
      }

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

      if (
        !validarConsentimientos()
      ) {
        return;
      }

      try {
        setLoading(true);

        const credencial =
          await registrar({
            nombre:
              nombre.trim(),

            email:
              email.trim(),

            password,
          });

        await guardarConsentimiento(
          credencial.user,
          nombre.trim()
        );

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
      setError("");

      if (
        !validarConsentimientos()
      ) {
        return;
      }

      try {
        setLoading(true);

        const credencial =
          await iniciarConGoogle();

        await guardarConsentimiento(
          credencial.user,
          credencial.user
            .displayName ||
            ""
        );

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
            520,

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
          <Box
            sx={{
              textAlign:
                "center",
            }}
          >
            <Typography
              sx={{
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
          </Box>

          <Typography
            sx={{
              mt: 3,

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

          <Divider
            sx={{
              mb: 2.5,
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
              required
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

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius:
                  "16px",
                backgroundColor:
                  "#F7F6FF",
              }}
            >
              <Typography
                fontWeight={800}
                fontSize={13}
              >
                Aviso de privacidad
                simplificado
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={12}
                sx={{
                  mt: 0.7,
                  lineHeight:
                    1.6,
                }}
              >
                {
                  LEGAL.responsable
                }
                , con domicilio en{" "}
                {
                  LEGAL.domicilio
                }
                , tratará tus datos
                de identificación y
                los datos financieros
                que decidas registrar
                para crear tu cuenta,
                operar LUMA y mostrar
                tus cálculos
                financieros.
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={12}
                sx={{
                  mt: 1,
                  lineHeight:
                    1.6,
                }}
              >
                Puedes limitar su uso
                o ejercer tus derechos
                mediante{" "}
                {
                  LEGAL.emailPrivacidad
                }
                . Consulta el{" "}
                <Link
                  component={
                    RouterLink
                  }
                  to="/privacidad"
                  target="_blank"
                >
                  Aviso de Privacidad
                </Link>{" "}
                integral.
              </Typography>
            </Box>

            <FormControlLabel
              sx={{
                mt: 2,
                alignItems:
                  "flex-start",
              }}
              control={
                <Checkbox
                  checked={
                    aceptaTerminos
                  }
                  onChange={(
                    event
                  ) =>
                    setAceptaTerminos(
                      event.target
                        .checked
                    )
                  }
                />
              }
              label={
                <Typography
                  fontSize={13}
                  sx={{
                    pt: 0.9,
                  }}
                >
                  He leído y acepto
                  los{" "}
                  <Link
                    component={
                      RouterLink
                    }
                    to="/terminos"
                    target="_blank"
                  >
                    Términos de Uso
                  </Link>{" "}
                  y el{" "}
                  <Link
                    component={
                      RouterLink
                    }
                    to="/privacidad"
                    target="_blank"
                  >
                    Aviso de Privacidad
                  </Link>
                  .
                </Typography>
              }
            />

            <FormControlLabel
              sx={{
                mt: 0.5,
                alignItems:
                  "flex-start",
              }}
              control={
                <Checkbox
                  checked={
                    aceptaFinancieros
                  }
                  onChange={(
                    event
                  ) =>
                    setAceptaFinancieros(
                      event.target
                        .checked
                    )
                  }
                />
              }
              label={
                <Typography
                  fontSize={13}
                  sx={{
                    pt: 0.9,
                  }}
                >
                  Otorgo mi
                  consentimiento
                  expreso para que
                  LUMA trate los datos
                  financieros o
                  patrimoniales que yo
                  decida registrar en
                  la aplicación para
                  proporcionarme sus
                  funciones.
                </Typography>
              }
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                loading ||
                !aceptaTerminos ||
                !aceptaFinancieros
              }
              sx={{
                mt: 2.5,
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
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              ¿Ya tienes una cuenta?
            </Typography>

            <Button
              onClick={() =>
                navigate(
                  "/login"
                )
              }
            >
              Iniciar sesión
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