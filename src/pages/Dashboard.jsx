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
  calcularApartadoSemanal,
} from "../utils/apartados";

import {
  calcularProyeccionSemanalIngreso,
} from "../utils/ingresos";

import {
  obtenerNombreEspacio,
} from "../utils/espacios";

const obtenerMesActual =
  () => {
    const hoy =
      new Date();

    return `${hoy.getFullYear()}-${String(
      hoy.getMonth() + 1
    ).padStart(2, "0")}`;
  };

export default function Dashboard() {
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
    apartados,
    setApartados,
  ] = useState([]);

  const [
    movimientos,
    setMovimientos,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setLoading(true);

          const [
            ingresosSnapshot,
            gastosSnapshot,
            apartadosSnapshot,
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
                  "apartados"
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

          setApartados(
            apartadosSnapshot.docs.map(
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
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible cargar tu panorama financiero."
          );
        } finally {
          setLoading(false);
        }
      };

    cargar();
  }, [user.uid]);

  const mesActual =
    obtenerMesActual();

  const movimientosMes =
    useMemo(
      () =>
        movimientos.filter(
          (movimiento) =>
            movimiento.fecha?.startsWith(
              mesActual
            )
        ),
      [
        movimientos,
        mesActual,
      ]
    );

  const ingresoSemanal =
    useMemo(
      () =>
        ingresos.reduce(
          (
            total,
            ingreso
          ) =>
            total +
            calcularProyeccionSemanalIngreso(
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

  const gastoSemanal =
    useMemo(
      () =>
        gastos.reduce(
          (
            total,
            gasto
          ) =>
            total +
            calcularSemanal(
              gasto.monto,
              gasto.frecuencia
            ),
          0
        ),
      [gastos]
    );

  const reservaSemanal =
    useMemo(
      () =>
        apartados.reduce(
          (
            total,
            apartado
          ) => {
            if (
              apartado.activo ===
              false
            ) {
              return total;
            }

            return (
              total +
              calcularApartadoSemanal(
                apartado.montoObjetivo,
                apartado.ahorrado,
                apartado.fechaVencimiento
              )
            );
          },
          0
        ),
      [apartados]
    );

  const disponibleProyectado =
    ingresoSemanal -
    gastoSemanal -
    reservaSemanal;

  const ingresoRealMes =
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
    );

  const egresoRealMes =
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
    );

  const balanceRealMes =
    ingresoRealMes -
    egresoRealMes;

  /*
    PROYECCIÓN POR ESPACIO
  */

  const espaciosProyectados =
    useMemo(() => {
      const mapa = {};

      ingresos.forEach(
        (ingreso) => {
          const nombre =
            ingreso.origenNombre ||
            ingreso.lugar ||
            "Sin espacio";

          if (!mapa[nombre]) {
            mapa[nombre] = {
              nombre,
              ingresos: 0,
              gastos: 0,
            };
          }

          mapa[
            nombre
          ].ingresos +=
            calcularProyeccionSemanalIngreso(
              ingreso,
              movimientos
            );
        }
      );

      gastos.forEach(
        (gasto) => {
          const nombre =
            obtenerNombreEspacio(
              gasto
            );

          if (!mapa[nombre]) {
            mapa[nombre] = {
              nombre,
              ingresos: 0,
              gastos: 0,
            };
          }

          mapa[
            nombre
          ].gastos +=
            calcularSemanal(
              gasto.monto,
              gasto.frecuencia
            );
        }
      );

      return Object.values(
        mapa
      ).map(
        (espacio) => ({
          ...espacio,

          resultado:
            espacio.ingresos -
            espacio.gastos,
        })
      );
    }, [
      ingresos,
      gastos,
      movimientos,
    ]);

  /*
    REAL POR ESPACIO
  */

  const espaciosReales =
    useMemo(() => {
      const mapa = {};

      movimientosMes.forEach(
        (movimiento) => {
          const nombre =
            movimiento.tipo ===
            "Ingreso"
              ? movimiento.origenNombre ||
                movimiento.lugar ||
                "Sin espacio"
              : obtenerNombreEspacio(
                  movimiento
                );

          if (!mapa[nombre]) {
            mapa[nombre] = {
              nombre,
              ingresos: 0,
              gastos: 0,
            };
          }

          if (
            movimiento.tipo ===
            "Ingreso"
          ) {
            mapa[
              nombre
            ].ingresos +=
              Number(
                movimiento.monto ||
                  0
              );
          } else {
            mapa[
              nombre
            ].gastos +=
              Number(
                movimiento.monto ||
                  0
              );
          }
        }
      );

      return Object.values(
        mapa
      ).map(
        (espacio) => ({
          ...espacio,

          resultado:
            espacio.ingresos -
            espacio.gastos,
        })
      );
    }, [movimientosMes]);

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
      <Typography
        sx={{
          fontSize: {
            xs: 29,
            md: 36,
          },

          fontWeight: 900,
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
        sx={{
          mt: 0.5,
          mb: 4,
        }}
      >
        Tu panorama financiero,
        separado entre proyección y
        realidad.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Typography
        fontWeight={900}
        fontSize={21}
        sx={{ mb: 2 }}
      >
        Proyección semanal
      </Typography>

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
        }}
      >
        <Resumen
          titulo="Ingreso proyectado"
          valor={
            ingresoSemanal
          }
          color="#10B981"
        />

        <Resumen
          titulo="Gastos planeados"
          valor={
            gastoSemanal
          }
          color="#EF4444"
        />

        <Resumen
          titulo="Reserva recomendada"
          valor={
            reservaSemanal
          }
          color="#F59E0B"
        />

        <Resumen
          titulo="Disponible proyectado"
          valor={
            disponibleProyectado
          }
          color={
            disponibleProyectado >=
            0
              ? "#6D5DFB"
              : "#EF4444"
          }
        />
      </Box>

      <Typography
        fontWeight={900}
        fontSize={21}
        sx={{
          mt: 4,
          mb: 2,
        }}
      >
        Real del mes
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
        <Resumen
          titulo="Ingresos registrados"
          valor={
            ingresoRealMes
          }
          color="#10B981"
        />

        <Resumen
          titulo="Egresos registrados"
          valor={
            egresoRealMes
          }
          color="#EF4444"
        />

        <Resumen
          titulo="Balance real"
          valor={
            balanceRealMes
          }
          color={
            balanceRealMes >=
            0
              ? "#6D5DFB"
              : "#EF4444"
          }
        />
      </Box>

      <Typography
        fontWeight={900}
        fontSize={21}
        sx={{
          mt: 4,
          mb: 2,
        }}
      >
        Proyección por espacio
      </Typography>

      <GraficaEspacios
        datos={
          espaciosProyectados
        }
      />

      <Typography
        fontWeight={900}
        fontSize={21}
        sx={{
          mt: 4,
          mb: 2,
        }}
      >
        Resultado real por espacio
      </Typography>

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
        {espaciosReales.map(
          (espacio) => (
            <CardEspacio
              key={
                espacio.nombre
              }
              espacio={
                espacio
              }
            />
          )
        )}

        {espaciosReales.length ===
          0 && (
          <Card
            sx={{
              borderRadius:
                "24px",
              gridColumn:
                "1 / -1",
            }}
          >
            <CardContent
              sx={{
                textAlign:
                  "center",
                py: 5,
              }}
            >
              <Typography
                color="text.secondary"
              >
                Registra movimientos
                para conocer el resultado
                real de cada espacio.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function Resumen({
  titulo,
  valor,
  color,
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
          fontSize={13}
        >
          {titulo}
        </Typography>

        <Typography
          sx={{
            mt: 0.7,
            fontSize: 23,
            fontWeight: 900,
            color,
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

function GraficaEspacios({
  datos,
}) {
  return (
    <Card
      sx={{
        borderRadius: "24px",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {datos.length >
        0 ? (
          <Box
            sx={{
              height: 350,
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
                  dataKey="resultado"
                  name="Resultado"
                  fill="#6D5DFB"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Typography
            color="text.secondary"
          >
            Todavía no hay información.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function CardEspacio({
  espacio,
}) {
  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          fontWeight={900}
          fontSize={18}
        >
          {espacio.nombre}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            mt: 2,
          }}
        >
          <Linea
            titulo="Ingresos"
            valor={
              espacio.ingresos
            }
            color="#10B981"
          />

          <Linea
            titulo="Gastos"
            valor={
              espacio.gastos
            }
            color="#EF4444"
          />

          <Box
            sx={{
              borderTop:
                "1px solid #EEE",
              pt: 1.5,
            }}
          >
            <Linea
              titulo="Resultado"
              valor={
                espacio.resultado
              }
              color={
                espacio.resultado >=
                0
                  ? "#6D5DFB"
                  : "#EF4444"
              }
              grande
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Linea({
  titulo,
  valor,
  color,
  grande = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 2,
      }}
    >
      <Typography
        color="text.secondary"
      >
        {titulo}
      </Typography>

      <Typography
        sx={{
          fontWeight: 900,
          fontSize:
            grande
              ? 18
              : 15,
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