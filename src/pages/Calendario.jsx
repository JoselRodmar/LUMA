import {
  useCallback,
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
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  useAuth,
} from "../context/AuthContext";

import {
  userCollection,
} from "../services/userData";

import {
  formatearDinero,
} from "../utils/frecuencia";

import {
  calcularApartadoSemanal,
  calcularDiasRestantes,
  calcularPendienteApartado,
  calcularPorcentajeApartado,
  obtenerFechaLocal,
} from "../utils/apartados";

const obtenerEstado = (
  apartado
) => {
  const pendiente =
    calcularPendienteApartado(
      apartado.montoObjetivo,
      apartado.ahorrado
    );

  const dias =
    calcularDiasRestantes(
      apartado.fechaVencimiento
    );

  if (pendiente <= 0) {
    return {
      texto: "Completo",
      color: "success",
    };
  }

  if (dias < 0) {
    return {
      texto: "Vencido",
      color: "error",
    };
  }

  if (dias <= 7) {
    return {
      texto: "Esta semana",
      color: "warning",
    };
  }

  if (dias <= 30) {
    return {
      texto: "Próximo",
      color: "primary",
    };
  }

  return {
    texto: "Planeado",
    color: "default",
  };
};

const formatearFecha = (
  fecha
) => {
  const valor =
    obtenerFechaLocal(fecha);

  if (!valor) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(valor);
};

export default function Calendario() {
  const {
    user,
  } = useAuth();

  const [
    apartados,
    setApartados,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const cargarApartados =
    useCallback(async () => {
      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            userCollection(
              user.uid,
              "apartados"
            )
          );

        const lista =
          snapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        setApartados(lista);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible cargar el calendario financiero."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

  useEffect(() => {
    cargarApartados();
  }, [cargarApartados]);

  const apartadosOrdenados =
    useMemo(() => {
      return [...apartados].sort(
        (a, b) => {
          const fechaA =
            obtenerFechaLocal(
              a.fechaVencimiento
            );

          const fechaB =
            obtenerFechaLocal(
              b.fechaVencimiento
            );

          if (
            !fechaA &&
            !fechaB
          ) {
            return 0;
          }

          if (!fechaA) {
            return 1;
          }

          if (!fechaB) {
            return -1;
          }

          return (
            fechaA.getTime() -
            fechaB.getTime()
          );
        }
      );
    }, [apartados]);

  const resumen =
    useMemo(() => {
      let totalObjetivo = 0;
      let totalReservado = 0;
      let totalPendiente = 0;
      let reservaSemanal = 0;

      apartados.forEach(
        (apartado) => {
          const objetivo =
            Number(
              apartado.montoObjetivo ||
                0
            );

          const reservado =
            Number(
              apartado.ahorrado ||
                0
            );

          totalObjetivo +=
            objetivo;

          totalReservado +=
            reservado;

          totalPendiente +=
            calcularPendienteApartado(
              objetivo,
              reservado
            );

          if (
            apartado.activo !==
            false
          ) {
            reservaSemanal +=
              calcularApartadoSemanal(
                objetivo,
                reservado,
                apartado.fechaVencimiento
              );
          }
        }
      );

      return {
        totalObjetivo,
        totalReservado,
        totalPendiente,
        reservaSemanal,
      };
    }, [apartados]);

  const proximos30Dias =
    useMemo(() => {
      return apartados.filter(
        (apartado) => {
          const dias =
            calcularDiasRestantes(
              apartado.fechaVencimiento
            );

          const pendiente =
            calcularPendienteApartado(
              apartado.montoObjetivo,
              apartado.ahorrado
            );

          return (
            dias >= 0 &&
            dias <= 30 &&
            pendiente > 0
          );
        }
      ).length;
    }, [apartados]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: {
            xs: 29,
            md: 34,
          },
          fontWeight: 800,
        }}
      >
        Calendario financiero
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Visualiza tus próximos
        compromisos y cuánto
        necesitas preparar.
      </Typography>

      {error && (
        <Card
          sx={{
            mb: 3,
            borderRadius: "20px",
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
        <ResumenCard
          titulo="Objetivo total"
          valor={
            resumen.totalObjetivo
          }
          icono="🎯"
        />

        <ResumenCard
          titulo="Ya reservado"
          valor={
            resumen.totalReservado
          }
          icono="💰"
        />

        <ResumenCard
          titulo="Pendiente"
          valor={
            resumen.totalPendiente
          }
          icono="📌"
        />

        <ResumenCard
          titulo="Reserva semanal"
          valor={
            resumen.reservaSemanal
          }
          icono="📅"
        />
      </Box>

      <Card
        sx={{
          mt: 3,
          borderRadius: "24px",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            color="text.secondary"
            fontSize={12}
            fontWeight={800}
          >
            PRÓXIMOS 30 DÍAS
          </Typography>

          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 900,
              mt: 0.5,
            }}
          >
            {proximos30Dias}
          </Typography>
        </CardContent>
      </Card>

      <Typography
        sx={{
          mt: 4,
          mb: 2,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        Próximos compromisos
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
        }}
      >
        {apartadosOrdenados.map(
          (apartado) => {
            const objetivo =
              Number(
                apartado.montoObjetivo ||
                  0
              );

            const reservado =
              Number(
                apartado.ahorrado ||
                  0
              );

            const pendiente =
              calcularPendienteApartado(
                objetivo,
                reservado
              );

            const semanal =
              calcularApartadoSemanal(
                objetivo,
                reservado,
                apartado.fechaVencimiento
              );

            const porcentaje =
              calcularPorcentajeApartado(
                objetivo,
                reservado
              );

            const dias =
              calcularDiasRestantes(
                apartado.fechaVencimiento
              );

            const estado =
              obtenerEstado(
                apartado
              );

            return (
              <Card
                key={apartado.id}
                sx={{
                  borderRadius: "24px",
                }}
              >
                <CardContent
                  sx={{ p: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: {
                        xs: "column",
                        md: "row",
                      },
                      justifyContent:
                        "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 21,
                            fontWeight:
                              800,
                          }}
                        >
                          {
                            apartado.concepto
                          }
                        </Typography>

                        <Chip
                          label={
                            estado.texto
                          }
                          color={
                            estado.color
                          }
                          size="small"
                        />
                      </Box>

                      <Typography
                        color="text.secondary"
                        fontSize={13}
                      >
                        {apartado.lugar} ·{" "}
                        {formatearFecha(
                          apartado.fechaVencimiento
                        )}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Reserva semanal
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 24,
                          color:
                            pendiente > 0
                              ? "#6D5DFB"
                              : "#10B981",
                        }}
                      >
                        {pendiente > 0
                          ? formatearDinero(
                              semanal
                            )
                          : "Completo"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      height: 10,
                      borderRadius: 10,
                      overflow: "hidden",
                      backgroundColor:
                        "#ECEEF3",
                    }}
                  >
                    <Box
                      sx={{
                        width:
                          `${porcentaje}%`,
                        height: "100%",
                        backgroundColor:
                          pendiente <= 0
                            ? "#10B981"
                            : "#6D5DFB",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs:
                          "repeat(2, 1fr)",
                        md:
                          "repeat(5, 1fr)",
                      },
                      gap: 2,
                      mt: 2.5,
                    }}
                  >
                    <Dato
                      titulo="Objetivo"
                      valor={formatearDinero(
                        objetivo
                      )}
                    />

                    <Dato
                      titulo="Reservado"
                      valor={formatearDinero(
                        reservado
                      )}
                    />

                    <Dato
                      titulo="Pendiente"
                      valor={formatearDinero(
                        pendiente
                      )}
                    />

                    <Dato
                      titulo="Avance"
                      valor={`${Math.round(
                        porcentaje
                      )}%`}
                    />

                    <Dato
                      titulo="Tiempo"
                      valor={
                        pendiente <= 0
                          ? "Listo"
                          : dias < 0
                            ? `${Math.abs(
                                dias
                              )} días vencido`
                            : dias ===
                                0
                              ? "Hoy"
                              : `${dias} días`
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}

        {apartadosOrdenados.length ===
          0 && (
          <Card
            sx={{
              borderRadius: "24px",
            }}
          >
            <CardContent
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 34,
                }}
              >
                📅
              </Typography>

              <Typography
                fontWeight={800}
                fontSize={18}
              >
                Tu calendario está vacío
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function ResumenCard({
  titulo,
  valor,
  icono,
}) {
  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          sx={{ fontSize: 22 }}
        >
          {icono}
        </Typography>

        <Typography
          color="text.secondary"
          fontSize={13}
          sx={{ mt: 1 }}
        >
          {titulo}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontWeight: 900,
            fontSize: 23,
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

function Dato({
  titulo,
  valor,
}) {
  return (
    <Box>
      <Typography
        color="text.secondary"
        fontSize={12}
      >
        {titulo}
      </Typography>

      <Typography
        fontWeight={700}
      >
        {valor}
      </Typography>
    </Box>
  );
}