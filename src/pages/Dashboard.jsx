import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  db,
} from "../services/firebase";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

import SummaryCard from "../components/SummaryCard";

const crearResumen = () => ({
  Casa: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
  },

  Consultorio: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
  },

  Extras: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
  },
});

export default function Dashboard() {
  const [
    resumen,
    setResumen,
  ] = useState(
    crearResumen()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const cargarDatos =
      async () => {
        try {
          setLoading(true);

          const nuevoResumen =
            crearResumen();

          const ingresosSnap =
            await getDocs(
              collection(
                db,
                "ingresos"
              )
            );

          ingresosSnap.forEach(
            (documento) => {
              const data =
                documento.data();

              if (
                !nuevoResumen[
                  data.lugar
                ]
              ) {
                return;
              }

              nuevoResumen[
                data.lugar
              ].ingresos +=
                calcularSemanal(
                  data.monto,
                  data.frecuencia
                );
            }
          );

          const gastosSnap =
            await getDocs(
              collection(
                db,
                "gastos"
              )
            );

          gastosSnap.forEach(
            (documento) => {
              const data =
                documento.data();

              if (
                !nuevoResumen[
                  data.lugar
                ]
              ) {
                return;
              }

              const semanal =
                calcularSemanal(
                  data.monto,
                  data.frecuencia
                );

              if (
                data.tipo ===
                "Fijo"
              ) {
                nuevoResumen[
                  data.lugar
                ].gastosFijos +=
                  semanal;
              } else {
                nuevoResumen[
                  data.lugar
                ].gastosVariables +=
                  semanal;
              }
            }
          );

          setResumen(
            nuevoResumen
          );

          setError("");
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible conectar con Firebase. Revisa la configuración."
          );
        } finally {
          setLoading(false);
        }
      };

    cargarDatos();
  }, []);

  const lugares = [
    "Casa",
    "Consultorio",
    "Extras",
  ];

  const totalIngresos =
    Object.values(
      resumen
    ).reduce(
      (acc, item) =>
        acc +
        item.ingresos,
      0
    );

  const totalGastos =
    Object.values(
      resumen
    ).reduce(
      (acc, item) =>
        acc +
        item.gastosFijos +
        item.gastosVariables,
      0
    );

  const disponibleGeneral =
    totalIngresos -
    totalGastos;

  const porcentajeGasto =
    totalIngresos > 0
      ? Math.min(
          100,
          (totalGastos /
            totalIngresos) *
            100
        )
      : 0;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            "70vh",
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          lg: 4,
        },

        maxWidth: 1450,
        mx: "auto",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: {
              xs: 29,
              md: 36,
            },

            fontWeight: 800,
            letterSpacing:
              "-1.2px",
          }}
        >
          Hola 👋
        </Typography>

        <Typography
          color="text.secondary"
        >
          Este es tu panorama
          financiero semanal.
        </Typography>
      </Box>

      {error && (
        <Card
          sx={{
            mb: 3,
            borderRadius:
              "18px",
          }}
        >
          <CardContent>
            <Typography
              color="error"
              fontWeight={600}
            >
              {error}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 1 }}
            >
              La interfaz de
              LUMA ya está
              funcionando. Solo
              falta colocar el
              firebaseConfig
              original.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",
              sm:
                "repeat(2, 1fr)",
              lg:
                "repeat(3, 1fr)",
            },

          gap: 2.5,
        }}
      >
        <SummaryCard
          title="Ingresos"
          value={
            totalIngresos
          }
          color="#0E9F6E"
          background="#ECFDF5"
          icon="💰"
        />

        <SummaryCard
          title="Gastos"
          value={
            totalGastos
          }
          color="#E44747"
          background="#FFF1F1"
          icon="🧾"
        />

        <SummaryCard
          title="Disponible"
          value={
            disponibleGeneral
          }
          color="#6755D9"
          background="#F1EEFF"
          icon="✨"
        />
      </Box>

      <Card
        sx={{
          borderRadius:
            "24px",
          mt: 3,
        }}
      >
        <CardContent
          sx={{ p: 3 }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            Salud financiera
          </Typography>

          <Typography
            sx={{
              color:
                "text.secondary",
              mt: 0.5,
              fontSize: 14,
            }}
          >
            {disponibleGeneral >=
            0
              ? "Tus finanzas se mantienen dentro de un rango saludable."
              : "Tus gastos actuales superan tus ingresos semanales."}
          </Typography>

          <Box
            sx={{
              mt: 3,
              backgroundColor:
                "#ECEEF3",
              borderRadius: 20,
              overflow:
                "hidden",
              height: 12,
            }}
          >
            <Box
              sx={{
                height:
                  "100%",

                width:
                  `${porcentajeGasto}%`,

                backgroundColor:
                  porcentajeGasto >
                  85
                    ? "#EF4444"
                    : porcentajeGasto >
                        65
                      ? "#F59E0B"
                      : "#10B981",

                borderRadius:
                  20,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: 12,
              mt: 1,
              color:
                "text.secondary",
            }}
          >
            Has utilizado{" "}
            {Math.round(
              porcentajeGasto
            )}
            % de tus ingresos
            semanales.
          </Typography>
        </CardContent>
      </Card>

      <Typography
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        Tus espacios
      </Typography>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",
              md:
                "repeat(3, 1fr)",
            },

          gap: 2.5,
        }}
      >
        {lugares.map(
          (lugar) => {
            const info =
              resumen[lugar];

            const disponible =
              info.ingresos -
              info.gastosFijos -
              info.gastosVariables;

            return (
              <Card
                key={lugar}
                sx={{
                  borderRadius:
                    "24px",
                }}
              >
                <CardContent
                  sx={{ p: 3 }}
                >
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 800,
                      mb: 3,
                    }}
                  >
                    {lugar ===
                    "Casa"
                      ? "🏠"
                      : lugar ===
                          "Consultorio"
                        ? "🩺"
                        : "⭐"}{" "}
                    {lugar}
                  </Typography>

                  <Box
                    sx={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography color="text.secondary">
                      Ingresos
                    </Typography>

                    <Typography fontWeight={600}>
                      {formatearDinero(
                        info.ingresos
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography color="text.secondary">
                      Gastos fijos
                    </Typography>

                    <Typography>
                      {formatearDinero(
                        info.gastosFijos
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography color="text.secondary">
                      Gastos
                      variables
                    </Typography>

                    <Typography>
                      {formatearDinero(
                        info.gastosVariables
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      pt: 2,
                      borderTop:
                        "1px solid #EEEFF3",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <Typography fontWeight={700}>
                      Disponible
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight:
                          800,

                        color:
                          disponible >=
                          0
                            ? "#10B981"
                            : "#EF4444",
                      }}
                    >
                      {formatearDinero(
                        disponible
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}
      </Box>
    </Box>
  );
}
