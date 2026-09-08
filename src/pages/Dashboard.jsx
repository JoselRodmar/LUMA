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
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const nuevoResumen =
          crearResumen();

        /*
        ========================================
        INGRESOS
        ========================================
        */

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

        /*
        ========================================
        GASTOS
        ========================================
        */

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

        /*
        ========================================
        APARTADOS
        ========================================
        */

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

  /*
  ========================================
  TOTALES GENERALES
  ========================================
  */

  const totalIngresos =
    useMemo(() => {
      return Object.values(
        resumen
      ).reduce(
        (acc, item) =>
          acc +
          item.ingresos,
        0
      );
    }, [resumen]);

  const totalGastos =
    useMemo(() => {
      return Object.values(
        resumen
      ).reduce(
        (acc, item) =>
          acc +
          item.gastosFijos +
          item.gastosVariables,
        0
      );
    }, [resumen]);

  const totalApartados =
    useMemo(() => {
      return Object.values(
        resumen
      ).reduce(
        (acc, item) =>
          acc +
          item.apartados,
        0
      );
    }, [resumen]);

  /*
  Disponible tradicional:
  Ingresos - gastos
  */

  const disponibleGeneral =
    totalIngresos -
    totalGastos;

  /*
  Disponible real:
  Ingresos - gastos - apartados
  */

  const disponibleReal =
    disponibleGeneral -
    totalApartados;

  /*
  Porcentaje realmente comprometido
  */

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

  /*
  ========================================
  DATOS PARA GRÁFICA DE BARRAS
  ========================================
  */

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

  /*
  ========================================
  DATOS PARA GRÁFICA CIRCULAR
  ========================================
  */

  const datosDistribucionGastos =
    lugares
      .map(
        (lugar) => {
          const info =
            resumen[lugar];

          return {
            name: lugar,

            value:
              Math.round(
                info.gastosFijos +
                  info.gastosVariables
              ),
          };
        }
      )
      .filter(
        (item) =>
          item.value > 0
      );

  /*
  ========================================
  LECTURA RÁPIDA
  ========================================
  */

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

  /*
  Ahora "Mejor disponible"
  usa el DISPONIBLE REAL
  */

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
              valor:
                disponible,
            };
          }
        }
      );

      return resultado;
    }, [resumen]);

  const gastoFijoTotal =
    useMemo(() => {
      return Object.values(
        resumen
      ).reduce(
        (acc, item) =>
          acc +
          item.gastosFijos,
        0
      );
    }, [resumen]);

  const gastoVariableTotal =
    useMemo(() => {
      return Object.values(
        resumen
      ).reduce(
        (acc, item) =>
          acc +
          item.gastosVariables,
        0
      );
    }, [resumen]);

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            "70vh",

          display:
            "flex",

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
      {/* ===================================
          ENCABEZADO
      =================================== */}

      <Box
        sx={{
          mb: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: 29,
              md: 36,
            },

            fontWeight:
              800,

            letterSpacing:
              "-1.2px",
          }}
        >
          Hola 👋
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          Este es tu panorama
          financiero semanal.
        </Typography>
      </Box>

      {/* ===================================
          ERROR
      =================================== */}

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
          </CardContent>
        </Card>
      )}

      {/* ===================================
          TARJETAS PRINCIPALES
      =================================== */}

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

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
            disponibleReal >=
            0
              ? "#6755D9"
              : "#EF4444"
          }
          background="#F1EEFF"
          icon="✨"
        />
      </Box>

      {/* ===================================
          DISPONIBLE REAL DESTACADO
      =================================== */}

      <Card
        sx={{
          mt: 3,

          borderRadius:
            "24px",

          border:
            disponibleReal >=
            0
              ? "1px solid #E7E2FF"
              : "1px solid #FFDADA",

          background:
            disponibleReal >=
            0
              ? "linear-gradient(135deg, #FFFFFF 0%, #F5F2FF 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #FFF1F1 100%)",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3.5,
            },
          }}
        >
          <Typography
            sx={{
              color:
                "text.secondary",

              fontSize: 12,

              fontWeight: 800,

              letterSpacing:
                1,
            }}
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

              fontWeight:
                900,

              letterSpacing:
                "-1.5px",

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
              maxWidth: 720,
              mt: 1,
              lineHeight: 1.6,
            }}
          >
            Es lo que realmente
            queda disponible esta
            semana después de
            considerar tus gastos
            actuales y el dinero que
            necesitas reservar para
            compromisos futuros.
          </Typography>

          <Box
            sx={{
              display:
                "flex",

              flexWrap:
                "wrap",

              gap: {
                xs: 2,
                md: 4,
              },

              mt: 3,
            }}
          >
            <Box>
              <Typography
                color="text.secondary"
                fontSize={12}
              >
                Disponible antes
                de apartados
              </Typography>

              <Typography
                fontWeight={800}
              >
                {formatearDinero(
                  disponibleGeneral
                )}
              </Typography>
            </Box>

            <Box>
              <Typography
                color="text.secondary"
                fontSize={12}
              >
                Reserva recomendada
              </Typography>

              <Typography
                fontWeight={800}
                sx={{
                  color:
                    "#D97706",
                }}
              >
                {formatearDinero(
                  totalApartados
                )}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ===================================
          GRÁFICAS
      =================================== */}

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

              lg:
                "1.5fr 1fr",
            },

          gap: 2.5,

          mt: 3,
        }}
      >
        {/* BARRAS */}

        <Card
          sx={{
            borderRadius:
              "24px",
          }}
        >
          <CardContent
            sx={{
              p: 3,
            }}
          >
            <Typography
              sx={{
                fontWeight:
                  800,

                fontSize:
                  19,
              }}
            >
              Flujo por espacio
            </Typography>

            <Typography
              sx={{
                color:
                  "text.secondary",

                fontSize:
                  13,

                mt: 0.5,

                mb: 3,
              }}
            >
              Ingresos, gastos y
              apartados semanales.
            </Typography>

            <Box
              sx={{
                width:
                  "100%",

                height:
                  330,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={
                    datosComparativa
                  }
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
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

        {/* PIE */}

        <Card
          sx={{
            borderRadius:
              "24px",
          }}
        >
          <CardContent
            sx={{
              p: 3,
            }}
          >
            <Typography
              sx={{
                fontWeight:
                  800,

                fontSize:
                  19,
              }}
            >
              Distribución de gastos
            </Typography>

            <Typography
              sx={{
                color:
                  "text.secondary",

                fontSize:
                  13,

                mt: 0.5,
              }}
            >
              Qué espacio está
              absorbiendo más dinero.
            </Typography>

            <Box
              sx={{
                width:
                  "100%",

                height:
                  270,

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
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {datosDistribucionGastos.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={
                              entry.name
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
                    height:
                      "100%",

                    display:
                      "flex",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Aún no hay
                    gastos.
                  </Typography>
                </Box>
              )}
            </Box>

            {datosDistribucionGastos.length >
              0 && (
              <Box
                sx={{
                  display:
                    "flex",

                  justifyContent:
                    "center",

                  gap: 2,

                  flexWrap:
                    "wrap",

                  mt: -1,
                }}
              >
                {datosDistribucionGastos.map(
                  (
                    item,
                    index
                  ) => (
                    <Box
                      key={
                        item.name
                      }
                      sx={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: 0.8,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,

                          borderRadius:
                            "50%",

                          backgroundColor:
                            coloresEspacios[
                              index %
                                coloresEspacios.length
                            ],
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize:
                            12,

                          color:
                            "text.secondary",
                        }}
                      >
                        {
                          item.name
                        }
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ===================================
          SALUD FINANCIERA
      =================================== */}

      <Card
        sx={{
          borderRadius:
            "24px",

          mt: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight:
                800,

              fontSize:
                19,
            }}
          >
            Salud financiera
          </Typography>

          <Typography
            sx={{
              color:
                "text.secondary",

              mt: 0.5,

              fontSize:
                14,
            }}
          >
            {disponibleReal >=
            0
              ? "Tus ingresos alcanzan para cubrir tus gastos actuales y tus apartados."
              : "Tus gastos y compromisos futuros superan tus ingresos semanales actuales."}
          </Typography>

          <Box
            sx={{
              mt: 3,

              backgroundColor:
                "#ECEEF3",

              borderRadius:
                20,

              overflow:
                "hidden",

              height:
                12,
            }}
          >
            <Box
              sx={{
                height:
                  "100%",

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

                borderRadius:
                  20,

                transition:
                  "width .4s ease",
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize:
                12,

              mt: 1,

              color:
                "text.secondary",
            }}
          >
            Tienes comprometido{" "}
            {Math.round(
              porcentajeComprometido
            )}
            % de tus ingresos
            semanales entre gastos
            y apartados.
          </Typography>
        </CardContent>
      </Card>

      {/* ===================================
          TUS ESPACIOS
      =================================== */}

      <Typography
        sx={{
          mt: 4,

          mb: 2,

          fontWeight:
            800,

          fontSize:
            22,
        }}
      >
        Tus espacios
      </Typography>

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

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

            const gastosEspacio =
              info.gastosFijos +
              info.gastosVariables;

            const disponible =
              info.ingresos -
              gastosEspacio;

            const disponibleRealEspacio =
              disponible -
              info.apartados;

            return (
              <Card
                key={
                  lugar
                }
                sx={{
                  borderRadius:
                    "24px",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize:
                        20,

                      fontWeight:
                        800,

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

                  <FilaEspacio
                    titulo="Ingresos"
                    valor={
                      info.ingresos
                    }
                    color="#10B981"
                  />

                  <FilaEspacio
                    titulo="Gastos fijos"
                    valor={
                      info.gastosFijos
                    }
                  />

                  <FilaEspacio
                    titulo="Gastos variables"
                    valor={
                      info.gastosVariables
                    }
                  />

                  <FilaEspacio
                    titulo="Apartados"
                    valor={
                      info.apartados
                    }
                    color="#D97706"
                  />

                  <Box
                    sx={{
                      pt: 2,

                      mt: 2,

                      borderTop:
                        "1px solid #EEEFF3",
                    }}
                  >
                    <FilaEspacio
                      titulo="Disponible"
                      valor={
                        disponible
                      }
                      negrita
                    />

                    <Box
                      sx={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "center",

                        gap: 2,

                        mt: 1.4,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight:
                            800,
                        }}
                      >
                        Disponible real
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight:
                            900,

                          fontSize:
                            18,

                          color:
                            disponibleRealEspacio >=
                            0
                              ? "#6755D9"
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

      {/* ===================================
          LECTURA RÁPIDA
      =================================== */}

      <Typography
        sx={{
          mt: 4,

          mb: 2,

          fontWeight:
            800,

          fontSize:
            22,
        }}
      >
        Lectura rápida
      </Typography>

      <Box
        sx={{
          display:
            "grid",

          gridTemplateColumns:
            {
              xs:
                "1fr",

              sm:
                "repeat(2, 1fr)",

              lg:
                "repeat(4, 1fr)",
            },

          gap: 2,
        }}
      >
        {/* MAYOR GASTO */}

        <Card
          sx={{
            borderRadius:
              "20px",
          }}
        >
          <CardContent>
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              Mayor gasto
            </Typography>

            <Typography
              sx={{
                mt: 1,

                fontWeight:
                  800,

                fontSize:
                  20,
              }}
            >
              {
                espacioMayorGasto.nombre
              }
            </Typography>

            <Typography
              color="error"
              fontWeight={700}
            >
              {formatearDinero(
                espacioMayorGasto.valor
              )}
            </Typography>
          </CardContent>
        </Card>

        {/* MEJOR DISPONIBLE REAL */}

        <Card
          sx={{
            borderRadius:
              "20px",
          }}
        >
          <CardContent>
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              Mejor disponible real
            </Typography>

            <Typography
              sx={{
                mt: 1,

                fontWeight:
                  800,

                fontSize:
                  20,
              }}
            >
              {
                espacioMayorDisponibleReal.nombre
              }
            </Typography>

            <Typography
              color={
                espacioMayorDisponibleReal.valor >=
                0
                  ? "success.main"
                  : "error.main"
              }
              fontWeight={700}
            >
              {formatearDinero(
                espacioMayorDisponibleReal.valor
              )}
            </Typography>
          </CardContent>
        </Card>

        {/* GASTOS FIJOS */}

        <Card
          sx={{
            borderRadius:
              "20px",
          }}
        >
          <CardContent>
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              Gastos fijos
            </Typography>

            <Typography
              sx={{
                mt: 1,

                fontWeight:
                  800,

                fontSize:
                  20,
              }}
            >
              {formatearDinero(
                gastoFijoTotal
              )}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={12}
            >
              equivalente semanal
            </Typography>
          </CardContent>
        </Card>

        {/* GASTOS VARIABLES */}

        <Card
          sx={{
            borderRadius:
              "20px",
          }}
        >
          <CardContent>
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              Gastos variables
            </Typography>

            <Typography
              sx={{
                mt: 1,

                fontWeight:
                  800,

                fontSize:
                  20,
              }}
            >
              {formatearDinero(
                gastoVariableTotal
              )}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={12}
            >
              equivalente semanal
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

/*
========================================
COMPONENTE AUXILIAR
========================================
*/

function FilaEspacio({
  titulo,
  valor,
  color,
  negrita = false,
}) {
  return (
    <Box
      sx={{
        display:
          "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        gap: 2,

        mb: 1.5,
      }}
    >
      <Typography
        color="text.secondary"
        sx={{
          fontWeight:
            negrita
              ? 700
              : 400,
        }}
      >
        {titulo}
      </Typography>

      <Typography
        sx={{
          fontWeight:
            negrita
              ? 800
              : 600,

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