import {
  useState,
} from "react";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  updateProfile,
} from "firebase/auth";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  db,
} from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

export default function Bienvenida() {
  const {
    user,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    paso,
    setPaso,
  ] = useState(1);

  const [
    nombre,
    setNombre,
  ] = useState(
    user?.displayName ||
      ""
  );

  const [
    pais,
    setPais,
  ] = useState(
    "México"
  );

  const [
    moneda,
    setMoneda,
  ] = useState(
    "MXN"
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const guardarPerfil =
    async () => {
      const nombreLimpio =
        nombre.trim();

      if (!nombreLimpio) {
        setError(
          "Escribe tu nombre."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        /*
        Actualizamos también
        Firebase Authentication.
        */

        await updateProfile(
          user,
          {
            displayName:
              nombreLimpio,
          }
        );

        /*
        Guardamos el perfil
        financiero del usuario.

        merge:true conserva cualquier
        dato existente, incluyendo
        datosMigrados.
        */

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            displayName:
              nombreLimpio,

            email:
              user.email ||
              "",

            pais,

            moneda,

            onboardingCompleto:
              true,

            perfilActualizado:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setPaso(2);
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar tu perfil. Intenta nuevamente."
        );
      } finally {
        setGuardando(false);
      }
    };

  const comenzar =
    () => {
      navigate(
        "/ingresos",
        {
          replace: true,
        }
      );
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
          "linear-gradient(135deg, #F9F8FF 0%, #F6F7FB 48%, #EDF9F5 100%)",

        p: 2,
      }}
    >
      <Card
        sx={{
          width:
            "100%",

          maxWidth:
            620,

          borderRadius:
            "30px",

          border:
            "1px solid rgba(109,93,251,.10)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 5,
            },
          }}
        >
          <Box
            sx={{
              textAlign:
                "center",

              mb: 4,
            }}
          >
            <Typography
              sx={{
                color:
                  "#6D5DFB",

                fontSize:
                  38,

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
                  1.7,
              }}
            >
              FINANZAS CLARAS
            </Typography>
          </Box>

          {paso === 1 && (
            <>
              <Typography
                sx={{
                  textAlign:
                    "center",

                  fontSize: {
                    xs: 25,
                    sm: 30,
                  },

                  fontWeight:
                    900,
                }}
              >
                Bienvenido a LUMA
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  textAlign:
                    "center",

                  mt: 1,

                  mb: 4,

                  lineHeight:
                    1.6,
                }}
              >
                Antes de comenzar,
                configuremos tu espacio
                financiero.
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius:
                      "16px",
                  }}
                >
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Tu nombre"
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
                label="Correo"
                value={
                  user?.email ||
                  ""
                }
                disabled
                sx={{
                  mb: 2,
                }}
              />

              <FormControl
                fullWidth
                sx={{
                  mb: 2,
                }}
              >
                <InputLabel>
                  País
                </InputLabel>

                <Select
                  value={pais}
                  label="País"
                  onChange={(
                    event
                  ) =>
                    setPais(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="México">
                    México
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
              >
                <InputLabel>
                  Moneda
                </InputLabel>

                <Select
                  value={moneda}
                  label="Moneda"
                  onChange={(
                    event
                  ) =>
                    setMoneda(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="MXN">
                    Peso mexicano
                    (MXN)
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography
                color="text.secondary"
                fontSize={12}
                sx={{
                  mt: 1.5,
                  lineHeight: 1.5,
                }}
              >
                En esta primera versión
                LUMA trabaja con pesos
                mexicanos. La estructura
                ya queda preparada para
                incorporar otras monedas
                posteriormente.
              </Typography>

              <Button
                fullWidth
                variant="contained"
                onClick={
                  guardarPerfil
                }
                disabled={
                  guardando
                }
                sx={{
                  mt: 4,
                  py: 1.5,
                }}
              >
                {guardando
                  ? "Guardando..."
                  : "Continuar"}
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <Box
                sx={{
                  textAlign:
                    "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize:
                      44,
                  }}
                >
                  ✨
                </Typography>

                <Typography
                  sx={{
                    mt: 1,

                    fontSize: {
                      xs: 25,
                      sm: 30,
                    },

                    fontWeight:
                      900,
                  }}
                >
                  Tu espacio está listo
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 1,

                    lineHeight:
                      1.6,
                  }}
                >
                  LUMA funciona mejor
                  cuando primero le
                  muestras cómo se mueve
                  tu dinero.
                </Typography>
              </Box>

              <Box
                sx={{
                  display:
                    "grid",

                  gap: 1.5,

                  mt: 4,
                }}
              >
                <Paso
                  numero="1"
                  titulo="Registra tus ingresos"
                  descripcion="Dinos cuánto dinero recibes y con qué frecuencia."
                />

                <Paso
                  numero="2"
                  titulo="Agrega tus gastos"
                  descripcion="Separa gastos fijos y variables para entender tus compromisos."
                />

                <Paso
                  numero="3"
                  titulo="Crea apartados"
                  descripcion="Prepárate para pagos y objetivos futuros."
                />

                <Paso
                  numero="4"
                  titulo="Registra movimientos"
                  descripcion="Anota lo que realmente entra y sale para comparar planeado contra real."
                />

                <Paso
                  numero="5"
                  titulo="Consulta tu disponible real"
                  descripcion="LUMA calcula lo que verdaderamente tienes disponible después de gastos y reservas."
                />
              </Box>

              <Box
                sx={{
                  mt: 4,

                  p: 2.5,

                  backgroundColor:
                    "#F7F6FF",

                  borderRadius:
                    "18px",
                }}
              >
                <Typography
                  fontWeight={800}
                  fontSize={14}
                >
                  💡 ¿Por dónde empezar?
                </Typography>

                <Typography
                  color="text.secondary"
                  fontSize={13}
                  sx={{
                    mt: 0.7,

                    lineHeight:
                      1.6,
                  }}
                >
                  Empecemos por tus
                  ingresos. Después
                  podrás agregar tus
                  gastos y LUMA comenzará
                  a construir tu panorama
                  financiero.
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={
                  comenzar
                }
                sx={{
                  mt: 3,
                  py: 1.5,
                }}
              >
                Comenzar con mis ingresos
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function Paso({
  numero,
  titulo,
  descripcion,
}) {
  return (
    <Box
      sx={{
        display:
          "flex",

        gap: 2,

        alignItems:
          "flex-start",

        p: 2,

        border:
          "1px solid #EEEFF3",

        borderRadius:
          "18px",
      }}
    >
      <Box
        sx={{
          minWidth: 34,
          width: 34,
          height: 34,

          borderRadius:
            "50%",

          display:
            "grid",

          placeItems:
            "center",

          backgroundColor:
            "#EEEAFE",

          color:
            "#6D5DFB",

          fontWeight:
            900,
        }}
      >
        {numero}
      </Box>

      <Box>
        <Typography
          fontWeight={800}
        >
          {titulo}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={13}
          sx={{
            mt: 0.3,

            lineHeight:
              1.5,
          }}
        >
          {descripcion}
        </Typography>
      </Box>
    </Box>
  );
}