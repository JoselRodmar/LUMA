import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
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
  useAuth,
} from "../context/AuthContext";

import {
  userCollection,
} from "../services/userData";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

import {
  calcularApartadoSemanal,
} from "../utils/apartados";

import SummaryCard from "../components/SummaryCard";

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

export default function Dashboard() {
  const {
    user,
  } = useAuth();

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

          const [
            ingresosSnap,
            gastosSnap,
            apartadosSnap,
          ] =
            await Promise.all([
              getDocs(
                userCollection(
                  user.uid,
                  "ingresos"
                )
              ),

              getDocs(
                userCollection(
                  user.uid,
                  "gastos"
                )
              ),

              getDocs(
                userCollection(
                  user.uid,
                  "apartados"
                )
              ),
            ]);

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
  }, [user.uid]);

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

  const disponibleGeneral =
    totalIngresos -
    totalGastos;

  const disponibleReal =
    disponibleGeneral -
    totalApartados;

  const porcentajeComprometido =
    totalIngresos > 0
      ? Math.min(
          100,
          (
            (
              totalGastos +
              totalApartados
            ) /
            totalIngresos
          ) *
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

  const datosDistribucionGastos =
    lugares
      .map(
        (lugar) => ({
          name: lugar,
          value:
            Math.round(
              resumen[
                lugar
              ].gastosFijos +
                resumen[
                  lugar
                ].gastosVariables
            ),
        })
      )
      .filter(
        (item) =>
          item.value > 0
      );

  const espacioMayorGasto =
    useMemo(() => {
      let resultado = {
        nombre: "-",
        valor: 0,
      };

      lugares.forEach(
        (lugar) => {
          const info =
            resumen[lugar];

          const gasto =
            info.gastosFijos +
            info.gastosVariables;

          if (
            gasto >
            resultado.valor
          ) {
            resultado = {
              nombre: lugar,
              valor: gasto,
            };
          }
        }
      );

      return resultado;
    }, [resumen]);

  const espacioMayorDisponibleReal =
    useMemo(() => {
      let resultado = {
        nombre: "-",
        valor: -Infinity,
      };

      lugares.forEach(
        (lugar) => {
          const info =
            resumen[lugar];

          const disponible =
            info.ingresos -
            info.gastosFijos -
            info.gastosVariables -
            info.apartados;

          if (
            disponible >
            resultado.valor
          ) {
            resultado = {
              nombre: lugar,
              valor: disponible,
            };
          }
        }
      );

      return resultado;
    }, [resumen]);

  const gastoFijoTotal =
    useMemo(
      () =>
        Object.values(
          resumen
        ).reduce(
          (acc, item) =>
            acc +
            item.gastosFijos,
          0
        ),
      [resumen]
    );

  const gastoVariableTotal =
    useMemo(
      () =>
        Object.values(
          resumen
        ).reduce(
          (acc, item) =>
            acc +
            item.gastosVariables,
          0
        ),
      [resumen]
    );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
          }}
        >
          Hola{" "}
          {user?.displayName
            ? user.displayName.split(
                " "
              )[0]
            : ""}
          👋
        </Typography>

        <Typography
          color="text.secondary"
        >
          Este es tu panorama
          financiero semanal.
        </Typography>
      </Box>

      {error && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              color="error"
            >
              {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm:
              "repeat(2, 1fr)",
            xl:
              "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        <SummaryCard
          title="Ingresos"
          value={totalIngresos}
          color="#0E9F6E"
          background="#ECFDF5"
          icon="💰"
        />

        <SummaryCard
          title="Gastos"
          value={totalGastos}
          color="#E44747"
          background="#FFF1F1"
          icon="🧾"
        />

        <SummaryCard
          title="Apartados"
          value={totalApartados}
          color="#D97706"
          background="#FFF7E7"
          icon="🎯"
        />

        <SummaryCard
          title="Disponible real"
          value={disponibleReal}
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
          borderRadius: "24px",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F5F2FF 100%)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            color="text.secondary"
            fontSize={12}
            fontWeight={800}
          >
            TU DINERO REALMENTE
            DISPONIBLE
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: 34,
                md: 46,
              },
              fontWeight: 900,
              color:
                disponibleReal >= 0
                  ? "#6755D9"
                  : "#EF4444",
            }}
          >
            {formatearDinero(
              disponibleReal
            )}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              lineHeight: 1.6,
            }}
          >
            Después de considerar
            gastos actuales y la
            reserva recomendada para
            tus compromisos futuros.
          </Typography>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.5fr 1fr",
          },
          gap: 2.5,
          mt: 3,
        }}
      >
        <Card
          sx={{
            borderRadius: "24px",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              fontWeight={800}
              fontSize={19}
            >
              Flujo por espacio
            </Typography>

            <Box
              sx={{
                width: "100%",
                height: 330,
                mt: 2,
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
                  />

                  <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill="#EF4444"
                  />

                  <Bar
                    dataKey="apartados"
                    name="Apartados"
                    fill="#F59E0B"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: "24px",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              fontWeight={800}
              fontSize={19}
            >
              Distribución de gastos
            </Typography>

            <Box
              sx={{
                height: 280,
                mt: 2,
              }}
            >
              {datosDistribucionGastos.length >
              0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={
                        datosDistribucionGastos
                      }
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={90}
                    >
                      {datosDistribucionGastos.map(
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
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Aún no hay gastos.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card
        sx={{
          mt: 3,
          borderRadius: "24px",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            fontWeight={800}
            fontSize={19}
          >
            Salud financiera
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Tienes comprometido{" "}
            {Math.round(
              porcentajeComprometido
            )}
            % de tus ingresos
            semanales.
          </Typography>

          <Box
            sx={{
              mt: 3,
              height: 12,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor:
                "#ECEEF3",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width:
                  `${porcentajeComprometido}%`,
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
          gridTemplateColumns: {
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

            const gastos =
              info.gastosFijos +
              info.gastosVariables;

            const disponible =
              info.ingresos -
              gastos;

            const real =
              disponible -
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
                    fontWeight={800}
                    fontSize={20}
                    sx={{ mb: 2 }}
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
                    titulo="Gastos fijos"
                    valor={
                      info.gastosFijos
                    }
                  />

                  <Fila
                    titulo="Gastos variables"
                    valor={
                      info.gastosVariables
                    }
                  />

                  <Fila
                    titulo="Apartados"
                    valor={
                      info.apartados
                    }
                  />

                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop:
                        "1px solid #EEEFF3",
                    }}
                  >
                    <Fila
                      titulo="Disponible"
                      valor={disponible}
                    />

                    <Fila
                      titulo="Disponible real"
                      valor={real}
                      fuerte
                      color={
                        real >= 0
                          ? "#6755D9"
                          : "#EF4444"
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}
      </Box>

      <Typography
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        Lectura rápida
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm:
              "repeat(2, 1fr)",
            lg:
              "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <Lectura
          titulo="Mayor gasto"
          principal={
            espacioMayorGasto.nombre
          }
          valor={
            espacioMayorGasto.valor
          }
        />

        <Lectura
          titulo="Mejor disponible real"
          principal={
            espacioMayorDisponibleReal.nombre
          }
          valor={
            espacioMayorDisponibleReal.valor
          }
        />

        <Lectura
          titulo="Gastos fijos"
          valor={gastoFijoTotal}
        />

        <Lectura
          titulo="Gastos variables"
          valor={
            gastoVariableTotal
          }
        />
      </Box>
    </Box>
  );
}

function Fila({
  titulo,
  valor,
  fuerte = false,
  color,
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
        fontWeight={
          fuerte
            ? 700
            : 400
        }
      >
        {titulo}
      </Typography>

      <Typography
        sx={{
          fontWeight:
            fuerte
              ? 900
              : 700,
          color:
            color ||
            "text.primary",
        }}
      >
        {formatearDinero(
          valor
        )}
      </Typography>
    </Box>
  );
}

function Lectura({
  titulo,
  principal,
  valor,
}) {
  return (
    <Card
      sx={{
        borderRadius: "20px",
      }}
    >
      <CardContent>
        <Typography
          color="text.secondary"
          fontSize={13}
        >
          {titulo}
        </Typography>

        {principal && (
          <Typography
            fontWeight={800}
            fontSize={20}
            sx={{ mt: 1 }}
          >
            {principal}
          </Typography>
        )}

        <Typography
          fontWeight={800}
          sx={{
            mt:
              principal
                ? 0
                : 1,
          }}
        >
          {formatearDinero(
            valor
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}