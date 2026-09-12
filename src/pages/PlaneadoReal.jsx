import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDocs,
} from "firebase/firestore";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
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
  calcularProyeccionMensualIngreso,
} from "../utils/ingresos";

import {
  obtenerNombreEspacio,
} from "../utils/espacios";

const obtenerMesActual = () => {
  const fecha =
    new Date();

  return `${fecha.getFullYear()}-${String(
    fecha.getMonth() + 1
  ).padStart(2, "0")}`;
};

const calcularMensualGasto = (
  gasto
) =>
  calcularSemanal(
    gasto.monto,
    gasto.frecuencia
  ) * 4.333;

const calcularPorcentaje = (
  real,
  referencia
) => {
  if (
    referencia <= 0
  ) {
    return real > 0
      ? 100
      : 0;
  }

  return (
    (real /
      referencia) *
    100
  );
};

const nombreEspacioIngreso = (
  registro
) =>
  registro.origenNombre ||
  registro.lugar ||
  "Sin espacio";

export default function PlaneadoReal() {
  const {
    user,
  } = useAuth();

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
                  "movimientos"
                )
              ),
            ]);

          setIngresos(
            ingresosSnapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );

          setGastos(
            gastosSnapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            )
          );

          setMovimientos(
            movimientosSnapshot.docs.map(
              (documento) => ({
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
  }, [user.uid]);

  const movimientosMes =
    useMemo(
      () =>
        movimientos.filter(
          (movimiento) =>
            movimiento.fecha
              ?.startsWith(
                mesSeleccionado
              )
        ),
      [
        movimientos,
        mesSeleccionado,
      ]
    );

  /*
    ==============================
    TOTALES PROYECTADOS
    ==============================
  */

  const ingresoProyectado =
    useMemo(
      () =>
        ingresos.reduce(
          (
            total,
            ingreso
          ) =>
            total +
            calcularProyeccionMensualIngreso(
              ingreso,
              movimientos
            ),
          0
        ),
      [
        ingresos,
        movimientos,
      ]
    );

  const gastoPlaneado =
    useMemo(
      () =>
        gastos.reduce(
          (
            total,
            gasto
          ) =>
            total +
            calcularMensualGasto(
              gasto
            ),
          0
        ),
      [gastos]
    );

  /*
    ==============================
    TOTALES REALES
    ==============================
  */

  const ingresoReal =
    useMemo(
      () =>
        movimientosMes.reduce(
          (
            total,
            movimiento
          ) =>
            movimiento.tipo ===
            "Ingreso"
              ? total +
                Number(
                  movimiento.monto ||
                    0
                )
              : total,
          0
        ),
      [movimientosMes]
    );

  const gastoReal =
    useMemo(
      () =>
        movimientosMes.reduce(
          (
            total,
            movimiento
          ) =>
            movimiento.tipo ===
            "Egreso"
              ? total +
                Number(
                  movimiento.monto ||
                    0
                )
              : total,
          0
        ),
      [movimientosMes]
    );

  const resultadoProyectado =
    ingresoProyectado -
    gastoPlaneado;

  const resultadoReal =
    ingresoReal -
    gastoReal;

  const diferenciaIngreso =
    ingresoReal -
    ingresoProyectado;

  const diferenciaGasto =
    gastoPlaneado -
    gastoReal;

  const porcentajeIngreso =
    calcularPorcentaje(
      ingresoReal,
      ingresoProyectado
    );

  const porcentajeGasto =
    calcularPorcentaje(
      gastoReal,
      gastoPlaneado
    );

  /*
    ==============================
    ESPACIOS
    ==============================
  */

  const espacios =
    useMemo(() => {
      const mapa = {};

      const asegurarEspacio =
        (nombre) => {
          if (!mapa[nombre]) {
            mapa[nombre] = {
              nombre,

              ingresoProyectado:
                0,

              ingresoReal:
                0,

              gastoPlaneado:
                0,

              gastoReal:
                0,
            };
          }

          return mapa[nombre];
        };

      /*
        INGRESOS PROYECTADOS
      */

      ingresos.forEach(
        (ingreso) => {
          const nombre =
            nombreEspacioIngreso(
              ingreso
            );

          const espacio =
            asegurarEspacio(
              nombre
            );

          espacio.ingresoProyectado +=
            calcularProyeccionMensualIngreso(
              ingreso,
              movimientos
            );
        }
      );

      /*
        GASTOS PLANEADOS
      */

      gastos.forEach(
        (gasto) => {
          const nombre =
            obtenerNombreEspacio(
              gasto
            );

          const espacio =
            asegurarEspacio(
              nombre
            );

          espacio.gastoPlaneado +=
            calcularMensualGasto(
              gasto
            );
        }
      );

      /*
        MOVIMIENTOS REALES
      */

      movimientosMes.forEach(
        (movimiento) => {
          const nombre =
            movimiento.tipo ===
            "Ingreso"
              ? nombreEspacioIngreso(
                  movimiento
                )
              : obtenerNombreEspacio(
                  movimiento
                );

          const espacio =
            asegurarEspacio(
              nombre
            );

          if (
            movimiento.tipo ===
            "Ingreso"
          ) {
            espacio.ingresoReal +=
              Number(
                movimiento.monto ||
                  0
              );
          } else {
            espacio.gastoReal +=
              Number(
                movimiento.monto ||
                  0
              );
          }
        }
      );

      return Object.values(
        mapa
      )
        .map(
          (espacio) => ({
            ...espacio,

            resultadoProyectado:
              espacio.ingresoProyectado -
              espacio.gastoPlaneado,

            resultadoReal:
              espacio.ingresoReal -
              espacio.gastoReal,
          })
        )
        .sort(
          (a, b) =>
            Math.abs(
              b.resultadoReal
            ) -
            Math.abs(
              a.resultadoReal
            )
        );
    }, [
      ingresos,
      gastos,
      movimientos,
      movimientosMes,
    ]);

  const datosGrafica =
    useMemo(
      () =>
        espacios.map(
          (espacio) => ({
            nombre:
              espacio.nombre,

            Proyectado:
              Math.round(
                espacio.resultadoProyectado
              ),

            Real:
              Math.round(
                espacio.resultadoReal
              ),
          })
        ),
      [espacios]
    );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",

          display: "grid",

          placeItems: "center",
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
      <Box
        sx={{
          display: "flex",

          flexDirection: {
            xs: "column",
            sm: "row",
          },

          justifyContent:
            "space-between",

          alignItems: {
            xs: "stretch",
            sm: "flex-start",
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

              fontWeight: 900,
            }}
          >
            Proyectado vs. real
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Compara lo que esperabas
            generar y gastar con lo que
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
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "16px",
          }}
        >
          {error}
        </Alert>
      )}

      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: "18px",
        }}
      >
        La proyección utiliza tu
        configuración financiera actual.
        Los ingresos variables e
        irregulares utilizan su historial
        reciente cuando está disponible.
        Por ahora LUMA todavía no conserva
        versiones históricas del
        presupuesto de cada mes.
      </Alert>

      {/* RESUMEN GENERAL */}

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

          gap: 2,

          mb: 3,
        }}
      >
        <ComparacionCard
          titulo="Ingresos"
          referencia={
            ingresoProyectado
          }
          real={
            ingresoReal
          }
          diferencia={
            diferenciaIngreso
          }
          ingresos
        />

        <ComparacionCard
          titulo="Gastos"
          referencia={
            gastoPlaneado
          }
          real={
            gastoReal
          }
          diferencia={
            diferenciaGasto
          }
        />

        <ResultadoCard
          titulo="Resultado proyectado"
          valor={
            resultadoProyectado
          }
        />

        <ResultadoCard
          titulo="Resultado real"
          valor={
            resultadoReal
          }
        />
      </Box>

      {/* PROGRESO */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            lg:
              "repeat(2, 1fr)",
          },

          gap: 2,

          mb: 4,
        }}
      >
        <Progreso
          titulo="Ingreso registrado respecto a proyección"
          valor={
            porcentajeIngreso
          }
          texto={
            diferenciaIngreso >=
            0
              ? `Has registrado ${formatearDinero(
                  diferenciaIngreso
                )} por encima de la proyección actual.`
              : `Faltan ${formatearDinero(
                  Math.abs(
                    diferenciaIngreso
                  )
                )} para alcanzar la proyección actual.`
          }
        />

        <Progreso
          titulo="Gasto utilizado respecto a lo planeado"
          valor={
            porcentajeGasto
          }
          texto={
            diferenciaGasto >=
            0
              ? `Has gastado ${formatearDinero(
                  diferenciaGasto
                )} menos de lo planeado.`
              : `Superaste lo planeado por ${formatearDinero(
                  Math.abs(
                    diferenciaGasto
                  )
                )}.`
          }
        />
      </Box>

      {/* COMPARACIÓN POR ESPACIO */}

      <Typography
        sx={{
          fontWeight: 900,

          fontSize: 21,

          mb: 2,
        }}
      >
        Resultado por espacio
      </Typography>

      <Card
        sx={{
          borderRadius: "24px",

          mb: 3,
        }}
      >
        <CardContent
          sx={{
            p: 3,
          }}
        >
          {datosGrafica.length >
          0 ? (
            <Box
              sx={{
                height: 360,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={
                    datosGrafica
                  }
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={
                      false
                    }
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
                    dataKey="Proyectado"
                    fill="#C7C1FF"
                  />

                  <Bar
                    dataKey="Real"
                    fill="#6D5DFB"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                py: 7,
                textAlign:
                  "center",
              }}
            >
              <Typography
                color="text.secondary"
              >
                Todavía no hay
                información para
                comparar.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* DETALLE */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            md:
              "repeat(2, 1fr)",

            xl:
              "repeat(3, 1fr)",
          },

          gap: 2,
        }}
      >
        {espacios.map(
          (espacio) => (
            <EspacioCard
              key={
                espacio.nombre
              }
              espacio={
                espacio
              }
            />
          )
        )}
      </Box>
    </Box>
  );
}

function ComparacionCard({
  titulo,
  referencia,
  real,
  diferencia,
  ingresos = false,
}) {
  let texto;

  if (ingresos) {
    texto =
      diferencia >= 0
        ? `${formatearDinero(
            diferencia
          )} por encima`
        : `${formatearDinero(
            Math.abs(
              diferencia
            )
          )} por debajo`;
  } else {
    texto =
      diferencia >= 0
        ? `${formatearDinero(
            diferencia
          )} sin gastar`
        : `${formatearDinero(
            Math.abs(
              diferencia
            )
          )} excedido`;
  }

  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Typography
          fontWeight={900}
        >
          {titulo}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 2,
          }}
        >
          {ingresos
            ? "Proyectado"
            : "Planeado"}
        </Typography>

        <Typography
          fontWeight={800}
        >
          {formatearDinero(
            referencia
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
          }}
        >
          {formatearDinero(
            real
          )}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 1,
          }}
        >
          {texto}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ResultadoCard({
  titulo,
  valor,
}) {
  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Typography
          color="text.secondary"
        >
          {titulo}
        </Typography>

        <Typography
          sx={{
            mt: 3,

            fontSize: 28,

            fontWeight: 900,

            color:
              valor >= 0
                ? "#6D5DFB"
                : "#EF4444",
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

function Progreso({
  titulo,
  valor,
  texto,
}) {
  const visual =
    Math.min(
      100,
      Math.max(
        0,
        valor
      )
    );

  return (
    <Card
      sx={{
        borderRadius: "24px",
      }}
    >
      <CardContent
        sx={{
          p: 3,
        }}
      >
        <Typography
          fontWeight={900}
        >
          {titulo}
        </Typography>

        <Typography
          sx={{
            fontSize: 28,

            fontWeight: 900,

            mt: 2,
          }}
        >
          {Math.round(
            valor
          )}
          %
        </Typography>

        <LinearProgress
          variant="determinate"
          value={visual}
          sx={{
            height: 10,

            borderRadius: 10,

            my: 1.5,
          }}
        />

        <Typography
          color="text.secondary"
          fontSize={12}
        >
          {texto}
        </Typography>
      </CardContent>
    </Card>
  );
}

function EspacioCard({
  espacio,
}) {
  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        <Typography
          fontWeight={900}
          fontSize={19}
        >
          {espacio.nombre}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{
            mt: 2,
          }}
        >
          PROYECTADO
        </Typography>

        <Fila
          titulo="Ingresos"
          valor={
            espacio.ingresoProyectado
          }
          color="#10B981"
        />

        <Fila
          titulo="Gastos"
          valor={
            espacio.gastoPlaneado
          }
          color="#EF4444"
        />

        <Fila
          titulo="Resultado"
          valor={
            espacio.resultadoProyectado
          }
          color={
            espacio.resultadoProyectado >=
            0
              ? "#6D5DFB"
              : "#EF4444"
          }
          fuerte
        />

        <Box
          sx={{
            borderTop:
              "1px solid #EEEEEE",

            mt: 2,

            pt: 2,
          }}
        >
          <Typography
            color="text.secondary"
            fontSize={12}
          >
            REAL
          </Typography>

          <Fila
            titulo="Ingresos"
            valor={
              espacio.ingresoReal
            }
            color="#10B981"
          />

          <Fila
            titulo="Gastos"
            valor={
              espacio.gastoReal
            }
            color="#EF4444"
          />

          <Fila
            titulo="Resultado"
            valor={
              espacio.resultadoReal
            }
            color={
              espacio.resultadoReal >=
              0
                ? "#6D5DFB"
                : "#EF4444"
            }
            fuerte
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function Fila({
  titulo,
  valor,
  color,
  fuerte = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",

        justifyContent:
          "space-between",

        gap: 2,

        mt: 1,
      }}
    >
      <Typography
        color="text.secondary"
      >
        {titulo}
      </Typography>

      <Typography
        sx={{
          fontWeight:
            fuerte
              ? 900
              : 700,

          fontSize:
            fuerte
              ? 17
              : 14,

          color,
        }}
      >
        {formatearDinero(
          valor
        )}
      </Typography>
    </Box>
  );
}