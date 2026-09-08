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
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  db,
} from "../services/firebase";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

/*
========================================
CONFIGURACIÓN
========================================
*/

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const obtenerMesActual = () => {
  const fecha = new Date();

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

  return `${year}-${month}`;
};

const formatearNombreMes = (
  valor
) => {
  if (!valor) {
    return "";
  }

  const [
    year,
    month,
  ] = valor
    .split("-")
    .map(Number);

  const fecha =
    new Date(
      year,
      month - 1,
      1
    );

  const texto =
    new Intl.DateTimeFormat(
      "es-MX",
      {
        month: "long",
        year: "numeric",
      }
    ).format(fecha);

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
};

/*
Convierte cualquier recurrencia
a un promedio mensual.

Ejemplos:

Mensual:
9000 / 4.333 * 4.333 = 9000

Semanal:
1000 * 4.333 = 4333
*/

const calcularMensual =
  (
    monto,
    frecuencia
  ) =>
    calcularSemanal(
      monto,
      frecuencia
    ) * 4.333;

const porcentaje = (
  real,
  planeado
) => {
  if (
    Number(planeado) <= 0
  ) {
    return real > 0
      ? 100
      : 0;
  }

  return (
    (Number(real) /
      Number(planeado)) *
    100
  );
};

const crearResumenEspacios =
  () => ({
    Casa: {
      ingresoPlaneado: 0,
      ingresoReal: 0,
      gastoPlaneado: 0,
      gastoReal: 0,
    },

    Consultorio: {
      ingresoPlaneado: 0,
      ingresoReal: 0,
      gastoPlaneado: 0,
      gastoReal: 0,
    },

    Extras: {
      ingresoPlaneado: 0,
      ingresoReal: 0,
      gastoPlaneado: 0,
      gastoReal: 0,
    },
  });

export default function PlaneadoReal() {
  const [
    ingresos,
    setIngresos,
  ] = useState([]);

  const [
    gastos,
    setGastos,
  ] = useState([]);

  const [
    movimientos,
    setMovimientos,
  ] = useState([]);

  const [
    mesSeleccionado,
    setMesSeleccionado,
  ] = useState(
    obtenerMesActual()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
  ========================================
  CARGAR FIRESTORE
  ========================================
  */

  useEffect(() => {
    const cargarDatos =
      async () => {
        try {
          setLoading(true);

          const [
            ingresosSnapshot,
            gastosSnapshot,
            movimientosSnapshot,
          ] =
            await Promise.all([
              getDocs(
                collection(
                  db,
                  "ingresos"
                )
              ),

              getDocs(
                collection(
                  db,
                  "gastos"
                )
              ),

              getDocs(
                collection(
                  db,
                  "movimientos"
                )
              ),
            ]);

          setIngresos(
            ingresosSnapshot.docs.map(
              (
                documento
              ) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );

          setGastos(
            gastosSnapshot.docs.map(
              (
                documento
              ) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );

          setMovimientos(
            movimientosSnapshot.docs.map(
              (
                documento
              ) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );

          setError("");
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible cargar la comparación financiera."
          );
        } finally {
          setLoading(false);
        }
      };

    cargarDatos();
  }, []);

  /*
  ========================================
  MOVIMIENTOS DEL MES
  ========================================
  */

  const movimientosMes =
    useMemo(() => {
      return movimientos.filter(
        (movimiento) =>
          movimiento.fecha
            ?.startsWith(
              mesSeleccionado
            )
      );
    }, [
      movimientos,
      mesSeleccionado,
    ]);

  /*
  ========================================
  TOTALES PLANEADOS
  ========================================
  */

  const ingresoPlaneado =
    useMemo(() => {
      return ingresos.reduce(
        (
          total,
          ingreso
        ) =>
          total +
          calcularMensual(
            ingreso.monto,
            ingreso.frecuencia
          ),
        0
      );
    }, [ingresos]);

  const gastoPlaneado =
    useMemo(() => {
      return gastos.reduce(
        (
          total,
          gasto
        ) =>
          total +
          calcularMensual(
            gasto.monto,
            gasto.frecuencia
          ),
        0
      );
    }, [gastos]);

  /*
  ========================================
  TOTALES REALES
  ========================================
  */

  const ingresoReal =
    useMemo(() => {
      return movimientosMes.reduce(
        (
          total,
          movimiento
        ) => {
          if (
            movimiento.tipo !==
            "Ingreso"
          ) {
            return total;
          }

          return (
            total +
            Number(
              movimiento.monto ||
                0
            )
          );
        },
        0
      );
    }, [
      movimientosMes,
    ]);

  const gastoReal =
    useMemo(() => {
      return movimientosMes.reduce(
        (
          total,
          movimiento
        ) => {
          if (
            movimiento.tipo !==
            "Egreso"
          ) {
            return total;
          }

          return (
            total +
            Number(
              movimiento.monto ||
                0
            )
          );
        },
        0
      );
    }, [
      movimientosMes,
    ]);

  /*
  ========================================
  DIFERENCIAS
  ========================================
  */

  const diferenciaIngreso =
    ingresoReal -
    ingresoPlaneado;

  const diferenciaGasto =
    gastoPlaneado -
    gastoReal;

  const resultadoPlaneado =
    ingresoPlaneado -
    gastoPlaneado;

  const resultadoReal =
    ingresoReal -
    gastoReal;

  const avanceIngresos =
    porcentaje(
      ingresoReal,
      ingresoPlaneado
    );

  const avanceGastos =
    porcentaje(
      gastoReal,
      gastoPlaneado
    );

  /*
  ========================================
  ESPACIOS
  ========================================
  */

  const resumenEspacios =
    useMemo(() => {
      const resumen =
        crearResumenEspacios();

      ingresos.forEach(
        (ingreso) => {
          if (
            !resumen[
              ingreso.lugar
            ]
          ) {
            return;
          }

          resumen[
            ingreso.lugar
          ].ingresoPlaneado +=
            calcularMensual(
              ingreso.monto,
              ingreso.frecuencia
            );
        }
      );

      gastos.forEach(
        (gasto) => {
          if (
            !resumen[
              gasto.lugar
            ]
          ) {
            return;
          }

          resumen[
            gasto.lugar
          ].gastoPlaneado +=
            calcularMensual(
              gasto.monto,
              gasto.frecuencia
            );
        }
      );

      movimientosMes.forEach(
        (movimiento) => {
          if (
            !resumen[
              movimiento.lugar
            ]
          ) {
            return;
          }

          const monto =
            Number(
              movimiento.monto ||
                0
            );

          if (
            movimiento.tipo ===
            "Ingreso"
          ) {
            resumen[
              movimiento.lugar
            ].ingresoReal +=
              monto;
          } else {
            resumen[
              movimiento.lugar
            ].gastoReal +=
              monto;
          }
        }
      );

      return resumen;
    }, [
      ingresos,
      gastos,
      movimientosMes,
    ]);

  /*
  ========================================
  GRÁFICAS
  ========================================
  */

  const datosIngresos =
    lugares.map(
      (lugar) => ({
        nombre: lugar,

        Planeado:
          Math.round(
            resumenEspacios[
              lugar
            ].ingresoPlaneado
          ),

        Real:
          Math.round(
            resumenEspacios[
              lugar
            ].ingresoReal
          ),
      })
    );

  const datosGastos =
    lugares.map(
      (lugar) => ({
        nombre: lugar,

        Planeado:
          Math.round(
            resumenEspacios[
              lugar
            ].gastoPlaneado
          ),

        Real:
          Math.round(
            resumenEspacios[
              lugar
            ].gastoReal
          ),
      })
    );

  /*
  ========================================
  COMPARACIÓN DE GASTOS POR CATEGORÍA
  ========================================
  */

  const categoriasGastos =
    useMemo(() => {
      const mapa = {};

      gastos.forEach(
        (gasto) => {
          const categoria =
            gasto.categoria ||
            "Sin categoría";

          if (
            !mapa[categoria]
          ) {
            mapa[categoria] = {
              categoria,
              planeado: 0,
              real: 0,
            };
          }

          mapa[
            categoria
          ].planeado +=
            calcularMensual(
              gasto.monto,
              gasto.frecuencia
            );
        }
      );

      movimientosMes
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Egreso"
        )
        .forEach(
          (movimiento) => {
            const categoria =
              movimiento.categoria ||
              "Sin categoría";

            if (
              !mapa[
                categoria
              ]
            ) {
              mapa[
                categoria
              ] = {
                categoria,
                planeado: 0,
                real: 0,
              };
            }

            mapa[
              categoria
            ].real +=
              Number(
                movimiento.monto ||
                  0
              );
          }
        );

      return Object.values(
        mapa
      ).sort(
        (a, b) =>
          b.real +
          b.planeado -
          (a.real +
            a.planeado)
      );
    }, [
      gastos,
      movimientosMes,
    ]);

  /*
  ========================================
  COMPARACIÓN DE INGRESOS POR FUENTE
  ========================================
  */

  const fuentesIngresos =
    useMemo(() => {
      const mapa = {};

      ingresos.forEach(
        (ingreso) => {
          const fuente =
            ingreso.fuente ||
            "Sin clasificar";

          if (!mapa[fuente]) {
            mapa[fuente] = {
              fuente,
              planeado: 0,
              real: 0,
            };
          }

          mapa[
            fuente
          ].planeado +=
            calcularMensual(
              ingreso.monto,
              ingreso.frecuencia
            );
        }
      );

      movimientosMes
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Ingreso"
        )
        .forEach(
          (movimiento) => {
            const fuente =
              movimiento.categoria ||
              "Sin clasificar";

            if (!mapa[fuente]) {
              mapa[fuente] = {
                fuente,
                planeado: 0,
                real: 0,
              };
            }

            mapa[
              fuente
            ].real +=
              Number(
                movimiento.monto ||
                  0
              );
          }
        );

      return Object.values(
        mapa
      ).sort(
        (a, b) =>
          b.real +
          b.planeado -
          (a.real +
            a.planeado)
      );
    }, [
      ingresos,
      movimientosMes,
    ]);

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
          display:
            "flex",

          flexDirection:
            {
              xs: "column",
              sm: "row",
            },

          justifyContent:
            "space-between",

          alignItems:
            {
              xs:
                "stretch",

              sm:
                "flex-end",
            },

          gap: 2,

          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: 29,
                md: 34,
              },

              fontWeight:
                800,
            }}
          >
            Planeado vs. real
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Compara lo que
            esperabas con lo que
            realmente ocurrió.
          </Typography>
        </Box>

        <TextField
          label="Mes"
          type="month"
          value={
            mesSeleccionado
          }
          onChange={(
            event
          ) =>
            setMesSeleccionado(
              event.target.value
            )
          }
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            minWidth: 190,
          }}
        />
      </Box>

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

      {/* ===================================
          PERIODO
      =================================== */}

      <Typography
        sx={{
          color:
            "#6D5DFB",

          fontWeight:
            800,

          mb: 2,
        }}
      >
        {formatearNombreMes(
          mesSeleccionado
        )}
      </Typography>

      {/* ===================================
          TARJETAS PRINCIPALES
      =================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",

              sm:
                "repeat(2, 1fr)",

              xl:
                "repeat(4, 1fr)",
            },

          gap: 2,

          mb: 3,
        }}
      >
        <ComparacionCard
          titulo="Ingresos"
          planeado={
            ingresoPlaneado
          }
          real={ingresoReal}
          diferencia={
            diferenciaIngreso
          }
          tipo="ingreso"
          icono="💰"
        />

        <ComparacionCard
          titulo="Gastos"
          planeado={
            gastoPlaneado
          }
          real={gastoReal}
          diferencia={
            diferenciaGasto
          }
          tipo="gasto"
          icono="🧾"
        />

        <ResultadoCard
          titulo="Resultado planeado"
          valor={
            resultadoPlaneado
          }
          icono="🎯"
        />

        <ResultadoCard
          titulo="Resultado real"
          valor={
            resultadoReal
          }
          icono="✨"
          destacado
        />
      </Box>

      {/* ===================================
          PROGRESO
      =================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",

              lg:
                "repeat(2, 1fr)",
            },

          gap: 2,

          mb: 3,
        }}
      >
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
              fontWeight={800}
              fontSize={18}
            >
              Ingresos recibidos
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 0.5,
              }}
            >
              Qué porcentaje del
              ingreso esperado ya
              entró realmente.
            </Typography>

            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 900,
                color:
                  "#10B981",
                mt: 2,
              }}
            >
              {Math.round(
                avanceIngresos
              )}
              %
            </Typography>

            <LinearProgress
              variant="determinate"
              value={Math.min(
                100,
                avanceIngresos
              )}
              color="success"
              sx={{
                height: 10,
                borderRadius: 10,
                mt: 1,
              }}
            />

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{
                mt: 1.5,
              }}
            >
              {diferenciaIngreso <
              0
                ? `Faltan ${formatearDinero(
                    Math.abs(
                      diferenciaIngreso
                    )
                  )} por recibir.`
                : diferenciaIngreso >
                    0
                  ? `Superaste lo planeado por ${formatearDinero(
                      diferenciaIngreso
                    )}.`
                  : "Alcanzaste exactamente lo planeado."}
            </Typography>
          </CardContent>
        </Card>

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
              fontWeight={800}
              fontSize={18}
            >
              Presupuesto utilizado
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{
                mt: 0.5,
              }}
            >
              Cuánto del gasto
              planeado ya utilizaste
              realmente.
            </Typography>

            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 900,
                color:
                  avanceGastos >
                  100
                    ? "#EF4444"
                    : "#6D5DFB",
                mt: 2,
              }}
            >
              {Math.round(
                avanceGastos
              )}
              %
            </Typography>

            <LinearProgress
              variant="determinate"
              value={Math.min(
                100,
                avanceGastos
              )}
              color={
                avanceGastos >
                100
                  ? "error"
                  : "primary"
              }
              sx={{
                height: 10,
                borderRadius: 10,
                mt: 1,
              }}
            />

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{
                mt: 1.5,
              }}
            >
              {diferenciaGasto >
              0
                ? `Quedan ${formatearDinero(
                    diferenciaGasto
                  )} del presupuesto.`
                : diferenciaGasto <
                    0
                  ? `Excediste el presupuesto por ${formatearDinero(
                      Math.abs(
                        diferenciaGasto
                      )
                    )}.`
                  : "Has utilizado exactamente lo presupuestado."}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ===================================
          GRÁFICAS
      =================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            {
              xs: "1fr",

              xl:
                "repeat(2, 1fr)",
            },

          gap: 2,

          mb: 3,
        }}
      >
        <GraficaComparacion
          titulo="Ingresos por espacio"
          descripcion="Planeado frente a ingreso realmente recibido."
          datos={
            datosIngresos
          }
        />

        <GraficaComparacion
          titulo="Gastos por espacio"
          descripcion="Presupuesto frente a gasto realmente realizado."
          datos={
            datosGastos
          }
        />
      </Box>

      {/* ===================================
          ESPACIOS
      =================================== */}

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

          gap: 2,
        }}
      >
        {lugares.map(
          (lugar) => {
            const info =
              resumenEspacios[
                lugar
              ];

            const balancePlaneado =
              info.ingresoPlaneado -
              info.gastoPlaneado;

            const balanceReal =
              info.ingresoReal -
              info.gastoReal;

            return (
              <Card
                key={lugar}
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
                      fontWeight: 800,
                      fontSize: 20,
                      mb: 2.5,
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

                  <Linea
                    titulo="Ingreso planeado"
                    valor={
                      info.ingresoPlaneado
                    }
                  />

                  <Linea
                    titulo="Ingreso real"
                    valor={
                      info.ingresoReal
                    }
                    color="#10B981"
                  />

                  <Linea
                    titulo="Gasto planeado"
                    valor={
                      info.gastoPlaneado
                    }
                  />

                  <Linea
                    titulo="Gasto real"
                    valor={
                      info.gastoReal
                    }
                    color="#EF4444"
                  />

                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop:
                        "1px solid #EEEFF3",
                    }}
                  >
                    <Linea
                      titulo="Resultado planeado"
                      valor={
                        balancePlaneado
                      }
                      negrita
                    />

                    <Linea
                      titulo="Resultado real"
                      valor={
                        balanceReal
                      }
                      color={
                        balanceReal >=
                        0
                          ? "#6D5DFB"
                          : "#EF4444"
                      }
                      negrita
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}
      </Box>

      {/* ===================================
          INGRESOS POR FUENTE
      =================================== */}

      <Typography
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        Ingresos por fuente
      </Typography>

      <TablaComparacion
        datos={
          fuentesIngresos
        }
        campoNombre="fuente"
        tipo="ingreso"
      />

      {/* ===================================
          GASTOS POR CATEGORÍA
      =================================== */}

      <Typography
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        Gastos por categoría
      </Typography>

      <TablaComparacion
        datos={
          categoriasGastos
        }
        campoNombre="categoria"
        tipo="gasto"
      />

      {/* ===================================
          NOTA
      =================================== */}

      <Card
        sx={{
          mt: 3,
          borderRadius:
            "20px",
          background:
            "#F8F7FF",
        }}
      >
        <CardContent>
          <Typography
            fontWeight={800}
            fontSize={14}
          >
            Cómo interpreta LUMA
            esta comparación
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{
              mt: 0.7,
              lineHeight: 1.6,
            }}
          >
            El valor planeado es
            el promedio mensual de
            tus ingresos y gastos
            recurrentes actuales.
            El valor real proviene
            únicamente de los
            movimientos registrados
            durante el mes
            seleccionado.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

/*
========================================
COMPARACIÓN PRINCIPAL
========================================
*/

function ComparacionCard({
  titulo,
  planeado,
  real,
  diferencia,
  tipo,
  icono,
}) {
  const favorable =
    tipo === "ingreso"
      ? diferencia >= 0
      : diferencia >= 0;

  return (
    <Card
      sx={{
        borderRadius:
          "22px",
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
          }}
        >
          <Typography
            color="text.secondary"
            fontWeight={700}
          >
            {titulo}
          </Typography>

          <Typography
            fontSize={22}
          >
            {icono}
          </Typography>
        </Box>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 2,
          }}
        >
          Planeado
        </Typography>

        <Typography
          fontWeight={800}
          fontSize={19}
        >
          {formatearDinero(
            planeado
          )}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 1.5,
          }}
        >
          Real
        </Typography>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 25,

            color:
              tipo === "ingreso"
                ? "#10B981"
                : "#EF4444",
          }}
        >
          {formatearDinero(
            real
          )}
        </Typography>

        <Typography
          sx={{
            mt: 1.5,

            fontSize: 12,

            fontWeight: 700,

            color:
              favorable
                ? "#10B981"
                : "#EF4444",
          }}
        >
          {tipo === "ingreso"
            ? diferencia >= 0
              ? `+${formatearDinero(
                  diferencia
                )} sobre lo planeado`
              : `${formatearDinero(
                  Math.abs(
                    diferencia
                  )
                )} pendiente`
            : diferencia >= 0
              ? `${formatearDinero(
                  diferencia
                )} disponibles`
              : `${formatearDinero(
                  Math.abs(
                    diferencia
                  )
                )} excedidos`}
        </Typography>
      </CardContent>
    </Card>
  );
}

/*
========================================
RESULTADO
========================================
*/

function ResultadoCard({
  titulo,
  valor,
  icono,
  destacado = false,
}) {
  return (
    <Card
      sx={{
        borderRadius:
          "22px",

        height: "100%",

        background:
          destacado
            ? "linear-gradient(135deg, #FFFFFF 0%, #F2EFFF 100%)"
            : "#FFFFFF",

        border:
          destacado
            ? "1px solid #E5DFFF"
            : "1px solid rgba(0,0,0,.03)",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",

            justifyContent:
              "space-between",
          }}
        >
          <Typography
            color="text.secondary"
            fontWeight={700}
          >
            {titulo}
          </Typography>

          <Typography
            fontSize={22}
          >
            {icono}
          </Typography>
        </Box>

        <Typography
          sx={{
            mt: 3,

            fontSize: 28,

            fontWeight: 900,

            color:
              valor >= 0
                ? destacado
                  ? "#6D5DFB"
                  : "#10B981"
                : "#EF4444",
          }}
        >
          {formatearDinero(
            valor
          )}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 0.5,
          }}
        >
          ingresos menos gastos
        </Typography>
      </CardContent>
    </Card>
  );
}

/*
========================================
GRÁFICA
========================================
*/

function GraficaComparacion({
  titulo,
  descripcion,
  datos,
}) {
  return (
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
          fontWeight={800}
          fontSize={18}
        >
          {titulo}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={13}
          sx={{
            mt: 0.5,
            mb: 2,
          }}
        >
          {descripcion}
        </Typography>

        <Box
          sx={{
            height: 320,
            width: "100%",
          }}
        >
          <ResponsiveContainer>
            <BarChart
              data={datos}
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

              <Legend />

              <Bar
                dataKey="Planeado"
                fill="#C7C1FF"
                radius={[
                  8,
                  8,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="Real"
                fill="#6D5DFB"
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
  );
}

/*
========================================
TABLA
========================================
*/

function TablaComparacion({
  datos,
  campoNombre,
  tipo,
}) {
  return (
    <Card
      sx={{
        borderRadius:
          "24px",
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {tipo ===
                "ingreso"
                  ? "Fuente"
                  : "Categoría"}
              </TableCell>

              <TableCell>
                Planeado
              </TableCell>

              <TableCell>
                Real
              </TableCell>

              <TableCell>
                Diferencia
              </TableCell>

              <TableCell>
                Avance
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {datos.map(
              (item) => {
                const diferencia =
                  tipo ===
                  "gasto"
                    ? item.planeado -
                      item.real
                    : item.real -
                      item.planeado;

                const avance =
                  porcentaje(
                    item.real,
                    item.planeado
                  );

                const favorable =
                  diferencia >= 0;

                return (
                  <TableRow
                    key={
                      item[
                        campoNombre
                      ]
                    }
                    hover
                  >
                    <TableCell>
                      <Typography
                        fontWeight={
                          700
                        }
                      >
                        {
                          item[
                            campoNombre
                          ]
                        }
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {formatearDinero(
                        item.planeado
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={
                          700
                        }
                      >
                        {formatearDinero(
                          item.real
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight:
                            700,

                          color:
                            favorable
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      >
                        {favorable
                          ? "+"
                          : "-"}
                        {formatearDinero(
                          Math.abs(
                            diferencia
                          )
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {Math.round(
                        avance
                      )}
                      %
                    </TableCell>
                  </TableRow>
                );
              }
            )}

            {datos.length ===
              0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{
                    py: 5,
                  }}
                >
                  <Typography
                    color="text.secondary"
                  >
                    Aún no hay
                    información para
                    comparar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

/*
========================================
LÍNEA ESPACIO
========================================
*/

function Linea({
  titulo,
  valor,
  color,
  negrita = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",

        justifyContent:
          "space-between",

        gap: 2,

        mb: 1.3,
      }}
    >
      <Typography
        color="text.secondary"
        fontSize={13}
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