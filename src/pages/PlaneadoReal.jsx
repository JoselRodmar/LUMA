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
  useAuth,
} from "../context/AuthContext";

import {
  userCollection,
} from "../services/userData";

import {
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const obtenerMesActual = () => {
  const fecha = new Date();

  return `${fecha.getFullYear()}-${String(
    fecha.getMonth() + 1
  ).padStart(2, "0")}`;
};

const calcularMensual = (
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
                id: documento.id,
                ...documento.data(),
              })
            )
          );

          setGastos(
            gastosSnapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            )
          );

          setMovimientos(
            movimientosSnapshot.docs.map(
              (documento) => ({
                id: documento.id,
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

  const ingresoPlaneado =
    useMemo(
      () =>
        ingresos.reduce(
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
        ),
      [ingresos]
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
            calcularMensual(
              gasto.monto,
              gasto.frecuencia
            ),
          0
        ),
      [gastos]
    );

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

  const resumenEspacios =
    useMemo(() => {
      const resumen =
        crearResumenEspacios();

      ingresos.forEach(
        (ingreso) => {
          if (
            resumen[
              ingreso.lugar
            ]
          ) {
            resumen[
              ingreso.lugar
            ].ingresoPlaneado +=
              calcularMensual(
                ingreso.monto,
                ingreso.frecuencia
              );
          }
        }
      );

      gastos.forEach(
        (gasto) => {
          if (
            resumen[
              gasto.lugar
            ]
          ) {
            resumen[
              gasto.lugar
            ].gastoPlaneado +=
              calcularMensual(
                gasto.monto,
                gasto.frecuencia
              );
          }
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
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          justifyContent:
            "space-between",
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
              fontWeight: 800,
            }}
          >
            Planeado vs. real
          </Typography>

          <Typography
            color="text.secondary"
          >
            Compara lo que esperabas
            con lo que realmente
            ocurrió.
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
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
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
        />

        <ResultadoCard
          titulo="Resultado planeado"
          valor={
            resultadoPlaneado
          }
        />

        <ResultadoCard
          titulo="Resultado real"
          valor={
            resultadoReal
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg:
              "repeat(2, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Progreso
          titulo="Ingresos recibidos"
          porcentajeValor={
            avanceIngresos
          }
          texto={
            diferenciaIngreso <
            0
              ? `Faltan ${formatearDinero(
                  Math.abs(
                    diferenciaIngreso
                  )
                )} por recibir.`
              : "Has alcanzado o superado lo planeado."
          }
        />

        <Progreso
          titulo="Presupuesto utilizado"
          porcentajeValor={
            avanceGastos
          }
          texto={
            diferenciaGasto >=
            0
              ? `Quedan ${formatearDinero(
                  diferenciaGasto
                )} del presupuesto.`
              : `Excediste por ${formatearDinero(
                  Math.abs(
                    diferenciaGasto
                  )
                )}.`
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl:
              "repeat(2, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Grafica
          titulo="Ingresos por espacio"
          datos={datosIngresos}
        />

        <Grafica
          titulo="Gastos por espacio"
          datos={datosGastos}
        />
      </Box>

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
          gap: 2,
        }}
      >
        {lugares.map(
          (lugar) => {
            const info =
              resumenEspacios[
                lugar
              ];

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
                      titulo="Resultado real"
                      valor={
                        info.ingresoReal -
                        info.gastoReal
                      }
                      fuerte
                    />
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

function ComparacionCard({
  titulo,
  planeado,
  real,
  diferencia,
  tipo,
}) {
  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent>
        <Typography
          color="text.secondary"
          fontWeight={700}
        >
          {titulo}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{ mt: 2 }}
        >
          Planeado
        </Typography>

        <Typography
          fontWeight={800}
        >
          {formatearDinero(
            planeado
          )}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={12}
          sx={{ mt: 1.5 }}
        >
          Real
        </Typography>

        <Typography
          fontWeight={900}
          fontSize={25}
        >
          {formatearDinero(
            real
          )}
        </Typography>

        <Typography
          fontSize={12}
          sx={{ mt: 1 }}
        >
          {tipo === "ingreso"
            ? diferencia >= 0
              ? `+${formatearDinero(
                  diferencia
                )}`
              : `${formatearDinero(
                  Math.abs(
                    diferencia
                  )
                )} pendiente`
            : diferencia >= 0
              ? `${formatearDinero(
                  diferencia
                )} disponible`
              : `${formatearDinero(
                  Math.abs(
                    diferencia
                  )
                )} excedido`}
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
      <CardContent>
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
  porcentajeValor,
  texto,
}) {
  return (
    <Card
      sx={{
        borderRadius: "24px",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          fontWeight={800}
        >
          {titulo}
        </Typography>

        <Typography
          fontSize={28}
          fontWeight={900}
          sx={{ mt: 2 }}
        >
          {Math.round(
            porcentajeValor
          )}
          %
        </Typography>

        <LinearProgress
          variant="determinate"
          value={Math.min(
            100,
            porcentajeValor
          )}
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

function Grafica({
  titulo,
  datos,
}) {
  return (
    <Card
      sx={{
        borderRadius: "24px",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          fontWeight={800}
          fontSize={18}
        >
          {titulo}
        </Typography>

        <Box
          sx={{
            height: 320,
            mt: 2,
          }}
        >
          <ResponsiveContainer>
            <BarChart
              data={datos}
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
              />

              <Bar
                dataKey="Real"
                fill="#6D5DFB"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

function Linea({
  titulo,
  valor,
  fuerte = false,
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
      >
        {titulo}
      </Typography>

      <Typography
        fontWeight={
          fuerte
            ? 900
            : 700
        }
      >
        {formatearDinero(
          valor
        )}
      </Typography>
    </Box>
  );
}