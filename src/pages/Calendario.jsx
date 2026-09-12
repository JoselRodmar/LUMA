import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import {
  db,
} from "../services/firebase";

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
} from "../utils/apartados";

import {
  construirEspacios,
  obtenerNombreEspacio,
} from "../utils/espacios";

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      `${fecha}T12:00:00`
    )
  );
};

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
      nombre:
        "Completado",

      color:
        "success",
    };
  }

  if (
    apartado.activo ===
    false
  ) {
    return {
      nombre:
        "Pausado",

      color:
        "default",
    };
  }

  if (dias < 0) {
    return {
      nombre:
        "Vencido",

      color:
        "error",
    };
  }

  if (dias <= 7) {
    return {
      nombre:
        "Esta semana",

      color:
        "warning",
    };
  }

  if (dias <= 30) {
    return {
      nombre:
        "Próximo",

      color:
        "info",
    };
  }

  return {
    nombre:
      "Planeado",

    color:
      "default",
  };
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
    origenes,
    setOrigenes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filtroEspacio,
    setFiltroEspacio,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  const cargarDatos =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const [
            apartadosSnapshot,
            perfilSnapshot,
          ] =
            await Promise.all([
              getDocs(
                userCollection(
                  user.uid,
                  "apartados"
                )
              ),

              getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              ),
            ]);

          const lista =
            apartadosSnapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );

          lista.sort(
            (a, b) =>
              (
                a.fechaVencimiento ||
                ""
              ).localeCompare(
                b.fechaVencimiento ||
                  ""
              )
          );

          const perfil =
            perfilSnapshot.exists()
              ? perfilSnapshot.data()
              : {};

          setApartados(
            lista
          );

          setOrigenes(
            Array.isArray(
              perfil.origenesIngreso
            )
              ? perfil.origenesIngreso
              : []
          );
        } catch (error) {
          console.error(
            "Error cargando calendario:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [user.uid]
    );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const espacios =
    useMemo(
      () =>
        construirEspacios(
          origenes
        ),
      [origenes]
    );

  const listaFiltrada =
    useMemo(
      () =>
        apartados.filter(
          (apartado) => {
            const espacioId =
              apartado.espacioId ||
              (
                apartado.lugar ===
                "Casa"
                  ? "personal"
                  : ""
              );

            const coincideEspacio =
              !filtroEspacio ||
              espacioId ===
                filtroEspacio;

            const estado =
              obtenerEstado(
                apartado
              );

            const coincideEstado =
              !filtroEstado ||
              estado.nombre ===
                filtroEstado;

            return (
              coincideEspacio &&
              coincideEstado
            );
          }
        ),
      [
        apartados,
        filtroEspacio,
        filtroEstado,
      ]
    );

  const resumen =
    useMemo(() => {
      let objetivo = 0;
      let reservado = 0;
      let pendiente = 0;
      let semanal = 0;

      listaFiltrada.forEach(
        (apartado) => {
          objetivo +=
            Number(
              apartado.montoObjetivo ||
                0
            );

          reservado +=
            Number(
              apartado.ahorrado ||
                0
            );

          pendiente +=
            calcularPendienteApartado(
              apartado.montoObjetivo,
              apartado.ahorrado
            );

          if (
            apartado.activo !==
              false &&
            calcularPendienteApartado(
              apartado.montoObjetivo,
              apartado.ahorrado
            ) > 0
          ) {
            semanal +=
              calcularApartadoSemanal(
                apartado.montoObjetivo,
                apartado.ahorrado,
                apartado.fechaVencimiento
              );
          }
        }
      );

      return {
        objetivo,
        reservado,
        pendiente,
        semanal,
      };
    }, [listaFiltrada]);

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

        maxWidth: 1250,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: {
            xs: 29,
            md: 34,
          },

          fontWeight: 900,
        }}
      >
        Calendario
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Visualiza cuándo necesitas
        tener listo el dinero de tus
        apartados.
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
          mb: 3,
        }}
      >
        <Resumen
          titulo="Objetivos"
          valor={
            resumen.objetivo
          }
        />

        <Resumen
          titulo="Reservado"
          valor={
            resumen.reservado
          }
        />

        <Resumen
          titulo="Pendiente"
          valor={
            resumen.pendiente
          }
        />

        <Resumen
          titulo="Reserva semanal"
          valor={
            resumen.semanal
          }
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 3,
        }}
      >
        <FormControl
          sx={{
            minWidth: 220,
          }}
        >
          <InputLabel>
            Espacio
          </InputLabel>

          <Select
            label="Espacio"
            value={
              filtroEspacio
            }
            onChange={(
              event
            ) =>
              setFiltroEspacio(
                event.target.value
              )
            }
          >
            <MenuItem value="">
              Todos
            </MenuItem>

            {espacios.map(
              (espacio) => (
                <MenuItem
                  key={
                    espacio.id
                  }
                  value={
                    espacio.id
                  }
                >
                  {
                    espacio.nombre
                  }
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>

        <FormControl
          sx={{
            minWidth: 180,
          }}
        >
          <InputLabel>
            Estado
          </InputLabel>

          <Select
            label="Estado"
            value={
              filtroEstado
            }
            onChange={(
              event
            ) =>
              setFiltroEstado(
                event.target.value
              )
            }
          >
            <MenuItem value="">
              Todos
            </MenuItem>

            <MenuItem value="Esta semana">
              Esta semana
            </MenuItem>

            <MenuItem value="Próximo">
              Próximo
            </MenuItem>

            <MenuItem value="Planeado">
              Planeado
            </MenuItem>

            <MenuItem value="Pausado">
              Pausado
            </MenuItem>

            <MenuItem value="Vencido">
              Vencido
            </MenuItem>

            <MenuItem value="Completado">
              Completado
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
        }}
      >
        {listaFiltrada.map(
          (apartado) => (
            <EventoApartado
              key={
                apartado.id
              }
              apartado={
                apartado
              }
            />
          )
        )}

        {listaFiltrada.length ===
          0 && (
          <Card
            sx={{
              borderRadius:
                "24px",
            }}
          >
            <CardContent
              sx={{
                textAlign:
                  "center",
                py: 6,
              }}
            >
              <Typography
                fontSize={38}
              >
                📅
              </Typography>

              <Typography
                fontWeight={900}
                fontSize={19}
                sx={{ mt: 1 }}
              >
                No hay compromisos
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Los apartados que
                crees aparecerán aquí.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function EventoApartado({
  apartado,
}) {
  const estado =
    obtenerEstado(
      apartado
    );

  const pendiente =
    calcularPendienteApartado(
      apartado.montoObjetivo,
      apartado.ahorrado
    );

  const porcentaje =
    calcularPorcentajeApartado(
      apartado.montoObjetivo,
      apartado.ahorrado
    );

  const semanal =
    calcularApartadoSemanal(
      apartado.montoObjetivo,
      apartado.ahorrado,
      apartado.fechaVencimiento
    );

  const dias =
    calcularDiasRestantes(
      apartado.fechaVencimiento
    );

  return (
    <Card
      sx={{
        borderRadius: "22px",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2.5,
            md: 3,
          },
        }}
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
          <Box
            sx={{
              flex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                fontWeight={900}
                fontSize={20}
              >
                {
                  apartado.concepto
                }
              </Typography>

              <Chip
                size="small"
                label={
                  estado.nombre
                }
                color={
                  estado.color
                }
              />
            </Box>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 0.5 }}
            >
              {obtenerNombreEspacio(
                apartado
              )}
            </Typography>

            <Typography
              fontWeight={700}
              sx={{ mt: 2 }}
            >
              {formatearFecha(
                apartado.fechaVencimiento
              )}
            </Typography>

            {pendiente > 0 && (
              <Typography
                color="text.secondary"
                fontSize={12}
              >
                {dias >= 0
                  ? `Faltan ${dias} días`
                  : `Vencido hace ${Math.abs(
                      dias
                    )} días`}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              minWidth: {
                md: 280,
              },
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
                fontSize={12}
              >
                Reservado
              </Typography>

              <Typography
                fontWeight={800}
                fontSize={12}
              >
                {Math.round(
                  porcentaje
                )}
                %
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={
                porcentaje
              }
              sx={{
                mt: 1,
                height: 9,
                borderRadius: 9,
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                mt: 1.5,
              }}
            >
              <Typography
                fontSize={12}
                color="text.secondary"
              >
                {formatearDinero(
                  apartado.ahorrado
                )}
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                {formatearDinero(
                  apartado.montoObjetivo
                )}
              </Typography>
            </Box>

            {pendiente > 0 &&
              apartado.activo !==
                false && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius:
                      "14px",
                    backgroundColor:
                      "#F7F6FF",
                  }}
                >
                  <Typography
                    color="text.secondary"
                    fontSize={11}
                  >
                    RESERVA SUGERIDA
                  </Typography>

                  <Typography
                    fontWeight={900}
                  >
                    {formatearDinero(
                      semanal
                    )}{" "}
                    / semana
                  </Typography>
                </Box>
              )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Resumen({
  titulo,
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

        <Typography
          sx={{
            mt: 0.7,
            fontSize: 21,
            fontWeight: 900,
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