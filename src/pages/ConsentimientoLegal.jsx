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
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
  useLocation,
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

export default function ConsentimientoLegal() {
  const {
    user,
    cerrarSesion,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    aceptaDocumentos,
    setAceptaDocumentos,
  ] = useState(false);

  const [
    aceptaFinancieros,
    setAceptaFinancieros,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const aceptar =
    async () => {
      if (
        !aceptaDocumentos ||
        !aceptaFinancieros
      ) {
        setError(
          "Debes aceptar ambos consentimientos para continuar usando LUMA."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
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

            consentimientoLegalActualizadoAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        const destino =
          location.state?.from ||
          "/";

        navigate(
          destino,
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar tu consentimiento. Intenta nuevamente."
        );
      } finally {
        setGuardando(false);
      }
    };

  return (
    <Box
      sx={{
        minHeight: "100vh",

        display: "grid",
        placeItems: "center",

        background:
          "linear-gradient(135deg, #F8F7FF 0%, #F6F7FB 50%, #EEF9F5 100%)",

        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 650,
          borderRadius: "30px",
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
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#6D5DFB",
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              LUMA
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={11}
              sx={{
                letterSpacing: 1.5,
              }}
            >
              FINANZAS CLARAS · BETA
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 4,
              fontSize: {
                xs: 25,
                sm: 29,
              },
              fontWeight: 900,
              textAlign: "center",
            }}
          >
            Antes de continuar
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Actualizamos la forma en que
            LUMA protege y documenta el
            uso de tus datos. Necesitamos
            registrar tu aceptación.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 3,
                borderRadius: "16px",
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              mt: 4,
              p: 2.5,
              backgroundColor:
                "#F7F6FF",
              borderRadius: "18px",
            }}
          >
            <Typography
              fontWeight={800}
            >
              Tus datos en LUMA
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 1,
                lineHeight: 1.7,
              }}
            >
              LUMA almacena la información
              que tú decides registrar
              para organizar tus ingresos,
              gastos, movimientos,
              apartados y cálculos
              financieros.
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 1,
                lineHeight: 1.7,
              }}
            >
              Tus datos están asociados
              a tu cuenta y las reglas de
              seguridad de la base de
              datos impiden que otro
              usuario autenticado acceda
              a tu espacio personal.
            </Typography>
          </Box>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <FormControlLabel
            sx={{
              alignItems:
                "flex-start",
            }}
            control={
              <Checkbox
                checked={
                  aceptaDocumentos
                }
                onChange={(
                  event
                ) =>
                  setAceptaDocumentos(
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
                  lineHeight: 1.6,
                }}
              >
                He leído y acepto los{" "}
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
              mt: 1,
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
                  lineHeight: 1.6,
                }}
              >
                Otorgo mi consentimiento
                expreso para que LUMA
                trate los datos
                financieros o
                patrimoniales que yo
                decida registrar con el
                fin de proporcionarme las
                funciones de la
                aplicación.
              </Typography>
            }
          />

          <Typography
            color="text.secondary"
            fontSize={11}
            sx={{
              mt: 2,
            }}
          >
            Términos:{" "}
            {LEGAL.versionTerminos}
            {" · "}
            Privacidad:{" "}
            {
              LEGAL.versionPrivacidad
            }
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={aceptar}
            disabled={
              guardando ||
              !aceptaDocumentos ||
              !aceptaFinancieros
            }
            sx={{
              mt: 3,
              py: 1.5,
            }}
          >
            {guardando
              ? "Guardando..."
              : "Aceptar y continuar"}
          </Button>

          <Button
            fullWidth
            onClick={
              cerrarSesion
            }
            disabled={
              guardando
            }
            sx={{
              mt: 1,
            }}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}