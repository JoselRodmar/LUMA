import {
  useEffect,
  useMemo,
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
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  db,
} from "../services/firebase";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

import {
  calcularApartadoSemanal,
} from "../utils/apartados";

import SummaryCard from "../components/SummaryCard";

const crearResumen = () => ({
  Casa: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
    apartados: 0,
  },

  Consultorio: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
    apartados: 0,
  },

  Extras: {
    ingresos: 0,
    gastosFijos: 0,
    gastosVariables: 0,
    apartados: 0,
  },
});

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const coloresEspacios = [
  "#6D5DFB",
  "#10B981",
  "#F59E0B",
];

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

          const apartadosSnap =
            await getDocs(
              collection(
                db,
                "apartados"
              )
            );

          apartadosSnap.forEach(
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

              if (
                data.activo ===
                false
              ) {
                return;
              }

              nuevoResumen[
                data.lugar
              ].apartados +=
                calcularApartadoSemanal(
                  data.montoObjetivo,
                  data.ahorrado,
                  data.fechaVencimiento
                );
            }
          );

          setResumen(
            nuevoResumen
          );

          setError("");
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible cargar la información financiera."
          );
        } finally {
          setLoading(false);
        }
      };

    cargarDatos();
  }, []);

  const totalIngresos =
    useMemo(
      () =>
        Object.values(
          resumen
        ).reduce(
          (acc, item) =>
            acc +
            item.ingresos,
          0
        ),
      [resumen]
    );

  const totalGastos =
    useMemo(
      () =>
        Object.values(
          resumen
        ).reduce(
          (acc, item) =>
            acc +
            item.gastosFijos +
            item.gastosVariables,
          0
        ),
      [resumen]
    );

  const totalApartados =
    useMemo(
      () =>
        Object.values(
          resumen
        ).reduce(
          (acc, item) =>
            acc +
            item.apartados,
          0
        ),
      [resumen]
    );

  const disponible =
    totalIngresos -
    totalGastos;

  const disponibleReal =
    disponible -
    totalApartados;

  const porcentajeComprometido =
    totalIngresos > 0
      ? Math.min(
          100,
          ((totalGastos +
            totalApartados) /
            totalIngresos) *
            100
        )
      : 0;

  const datosComparativa =
    lugares.map(
      (lugar) => {
        const info =
          resumen[lugar];

        return {
          nombre: lugar,

          ingresos:
            Math.round(
              info.ingresos
            ),

          gastos:
            Math.round(
              info.gastosFijos +
                info.gastosVariables
            ),

          apartados:
            Math.round(
              info.apartados
            ),
        };
      }
    );

  const datosDistribucion =
    lugares
      .map(
        (lugar) => ({
          name: lugar,

          value:
            Math.round(
              resumen[lugar]
                .gastosFijos +
                resumen[lugar]
                  .gastosVariables
            ),
        })
      )
      .filter(
        (item) =>
          item.value > 0
      );

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

        <Typography color="text.secondary">
          Este es tu panorama
          financiero semanal.
        </Typography>
      </Box>

      {error && (
        <Typography
          color="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",
              sm:
                "repeat(2,1fr)",
              xl:
                "repeat(4,1fr)",
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
          title="Apartados"
          value={
            totalApartados
          }
          color="#D97706"
          background="#FFF7E7"
          icon="🎯"
        />

        <SummaryCard
          title="Disponible real"
          value={
            disponibleReal
          }
          color={
            disponibleReal >= 0
              ? "#6755D9"
              : "#EF4444"
          }
          background="#F1EEFF"
          icon="✨"
        />
      </Box>

      <Card
        sx={{
          mt: 3,

          borderRadius:
            "24px",

          background:
            disponibleReal >= 0
              ? "linear-gradient(135deg, #FFFFFF 0%, #F5F2FF 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #FFF1F1 100%)",
        }}
      >
        <CardContent
          sx={{ p: 3 }}
        >
          <Typography
            color="text.secondary"
            fontSize={13}
            fontWeight={700}
          >
            TU DINERO REALMENTE
            DISPONIBLE
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: 34,
                md: 44,
              },

              fontWeight: 900,

              color:
                disponibleReal >=
                0
                  ? "#6755D9"
                  : "#EF4444",

              mt: 0.5,
            }}
          >
            {formatearDinero(
              disponibleReal
            )}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 700,
              mt: 1,
            }}
          >
            Este monto ya
            descuenta tus gastos
            actuales y lo que
            deberías reservar esta
            semana para compromisos
            futuros.
          </Typography>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",
              lg:
                "1.5fr 1fr",
            },

          gap: 2.5,
          mt: 3,
        }}
      >
        <Card
          sx={{
            borderRadius:
              "24px",
          }}
        >
          <CardContent
            sx={{ p: 3 }}
          >
            <Typography
              fontWeight={800}
              fontSize={19}
            >
              Flujo por espacio
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 0.5 }}
            >
              Ingresos, gastos y
              compromisos futuros.
            </Typography>

            <Box
              sx={{
                width: "100%",
                height: 330,
                mt: 3,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={
                    datosComparativa
                  }
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="nombre"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatearDinero(
                        value
                      )
                    }
                  />

                  <Bar
                    dataKey="ingresos"
                    name="Ingresos"
                    fill="#10B981"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill="#EF4444"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="apartados"
                    name="Apartados"
                    fill="#F59E0B"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius:
              "24px",
          }}
        >
          <CardContent
            sx={{ p: 3 }}
          >
            <Typography
              fontWeight={800}
              fontSize={19}
            >
              Distribución de gastos
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 0.5 }}
            >
              Dónde se concentra tu
              gasto semanal.
            </Typography>

            <Box
              sx={{
                width: "100%",
                height: 280,
                mt: 2,
              }}
            >
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={
                      datosDistribucion
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {datosDistribucion.map(
                      (
                        item,
                        index
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            coloresEspacios[
                              index %
                                coloresEspacios.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatearDinero(
                        value
                      )
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card
        sx={{
          mt: 3,
          borderRadius:
            "24px",
        }}
      >
        <CardContent
          sx={{ p: 3 }}
        >
          <Typography
            fontWeight={800}
            fontSize={19}
          >
            Salud financiera
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={14}
            sx={{ mt: 0.5 }}
          >
            {disponibleReal >= 0
              ? "Tus ingresos alcanzan para cubrir tus gastos y tus apartados actuales."
              : "Tus compromisos actuales requieren más dinero del que generan tus ingresos semanales."}
          </Typography>

          <Box
            sx={{
              height: 12,
              mt: 3,

              backgroundColor:
                "#ECEEF3",

              borderRadius: 20,

              overflow:
                "hidden",
            }}
          >
            <Box
              sx={{
                width:
                  `${porcentajeComprometido}%`,

                height:
                  "100%",

                borderRadius:
                  20,

                backgroundColor:
                  porcentajeComprometido >
                  90
                    ? "#EF4444"
                    : porcentajeComprometido >
                        70
                      ? "#F59E0B"
                      : "#10B981",
              }}
            />
          </Box>

          <Typography
            color="text.secondary"
            fontSize={12}
            sx={{ mt: 1 }}
          >
            Tienes comprometido{" "}
            {Math.round(
              porcentajeComprometido
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
                "repeat(3,1fr)",
            },

          gap: 2.5,
        }}
      >
        {lugares.map(
          (lugar) => {
            const info =
              resumen[lugar];

            const gasto =
              info.gastosFijos +
              info.gastosVariables;

            const disponibleEspacio =
              info.ingresos -
              gasto;

            const disponibleRealEspacio =
              disponibleEspacio -
              info.apartados;

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

                  <Fila
                    titulo="Ingresos"
                    valor={
                      info.ingresos
                    }
                  />

                  <Fila
                    titulo="Gastos"
                    valor={gasto}
                  />

                  <Fila
                    titulo="Apartados"
                    valor={
                      info.apartados
                    }
                  />

                  <Box
                    sx={{
                      borderTop:
                        "1px solid #EEEFF3",
                      pt: 2,
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 2,
                      }}
                    >
                      <Typography
                        fontWeight={800}
                      >
                        Disponible real
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight:
                            900,

                          color:
                            disponibleRealEspacio >=
                            0
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      >
                        {formatearDinero(
                          disponibleRealEspacio
                        )}
                      </Typography>
                    </Box>
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

function Fila({
  titulo,
  valor,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 2,
        mb: 1.4,
      }}
    >
      <Typography
        color="text.secondary"
      >
        {titulo}
      </Typography>

      <Typography
        fontWeight={600}
      >
        {formatearDinero(
          valor
        )}
      </Typography>
    </Box>
  );
}