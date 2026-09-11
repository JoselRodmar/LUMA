import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  useAuth,
} from "../context/AuthContext";

import {
  userCollection,
  userDoc,
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

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const formularioInicial = {
  lugar: "Casa",
  concepto: "",
  montoObjetivo: "",
  ahorrado: "",
  fechaVencimiento: "",
};

export default function Apartados() {
  const {
    user,
  } = useAuth();

  const [
    apartados,
    setApartados,
  ] = useState([]);

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

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

        setApartados(lista);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible cargar los apartados."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

  useEffect(() => {
    cargarApartados();
  }, [cargarApartados]);

  const manejarCambio = (
    campo,
    valor
  ) => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        [campo]: valor,
      })
    );
  };

  const guardarApartado =
    async (event) => {
      event.preventDefault();

      const concepto =
        formulario.concepto.trim();

      const objetivo =
        Number(
          formulario.montoObjetivo
        );

      const ahorrado =
        Number(
          formulario.ahorrado ||
            0
        );

      if (!concepto) {
        setError(
          "Escribe el concepto del apartado."
        );

        return;
      }

      if (
        !objetivo ||
        objetivo <= 0
      ) {
        setError(
          "Ingresa un objetivo válido."
        );

        return;
      }

      if (
        !formulario.fechaVencimiento
      ) {
        setError(
          "Selecciona una fecha objetivo."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        await addDoc(
          userCollection(
            user.uid,
            "apartados"
          ),
          {
            lugar:
              formulario.lugar,

            concepto,

            montoObjetivo:
              objetivo,

            ahorrado,

            fechaVencimiento:
              formulario.fechaVencimiento,

            activo: true,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        setFormulario(
          formularioInicial
        );

        await cargarApartados();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar el apartado."
        );
      } finally {
        setGuardando(false);
      }
    };

  const actualizarAhorrado =
    async (
      apartado,
      nuevoAhorrado
    ) => {
      const objetivo =
        Number(
          apartado.montoObjetivo ||
            0
        );

      const valor =
        Math.min(
          objetivo,
          Math.max(
            0,
            Number(
              nuevoAhorrado ||
                0
            )
          )
        );

      try {
        await updateDoc(
          userDoc(
            user.uid,
            "apartados",
            apartado.id
          ),
          {
            ahorrado: valor,
            updatedAt:
              serverTimestamp(),
          }
        );

        await cargarApartados();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible actualizar el apartado."
        );
      }
    };

  const agregarSemanal =
    async (apartado) => {
      const semanal =
        calcularApartadoSemanal(
          apartado.montoObjetivo,
          apartado.ahorrado,
          apartado.fechaVencimiento
        );

      const actual =
        Number(
          apartado.ahorrado ||
            0
        );

      await actualizarAhorrado(
        apartado,
        actual + semanal
      );
    };

  const agregarOtraCantidad =
    async (apartado) => {
      const entrada =
        window.prompt(
          "¿Cuánto deseas agregar al apartado?"
        );

      if (
        entrada === null
      ) {
        return;
      }

      const cantidad =
        Number(entrada);

      if (
        !cantidad ||
        cantidad <= 0
      ) {
        window.alert(
          "Ingresa una cantidad válida."
        );

        return;
      }

      const actual =
        Number(
          apartado.ahorrado ||
            0
        );

      await actualizarAhorrado(
        apartado,
        actual + cantidad
      );
    };

  const eliminarApartado =
    async (apartado) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${apartado.concepto}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        await deleteDoc(
          userDoc(
            user.uid,
            "apartados",
            apartado.id
          )
        );

        await cargarApartados();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el apartado."
        );
      }
    };

  const resumen =
    useMemo(() => {
      let objetivo = 0;
      let reservado = 0;
      let pendiente = 0;
      let semanal = 0;

      apartados.forEach(
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
            false
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
    }, [apartados]);

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
        Apartados
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Prepárate para gastos
        futuros sin comprometer tu
        dinero disponible.
      </Typography>

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
          mb: 3,
        }}
      >
        <Resumen
          titulo="Objetivo"
          valor={resumen.objetivo}
        />

        <Resumen
          titulo="Ya reservado"
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
          valor={resumen.semanal}
        />
      </Box>

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
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
          <Typography
            fontWeight={800}
            fontSize={19}
            sx={{ mb: 2.5 }}
          >
            Nuevo apartado
          </Typography>

          <Box
            component="form"
            onSubmit={
              guardarApartado
            }
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm:
                    "repeat(2, 1fr)",
                  lg:
                    "repeat(5, 1fr)",
                },
                gap: 2,
              }}
            >
              <FormControl>
                <InputLabel>
                  Lugar
                </InputLabel>

                <Select
                  label="Lugar"
                  value={
                    formulario.lugar
                  }
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "lugar",
                      event.target.value
                    )
                  }
                >
                  {lugares.map(
                    (lugar) => (
                      <MenuItem
                        key={lugar}
                        value={lugar}
                      >
                        {lugar}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Concepto"
                value={
                  formulario.concepto
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "concepto",
                    event.target.value
                  )
                }
              />

              <TextField
                label="Monto objetivo"
                type="number"
                value={
                  formulario.montoObjetivo
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "montoObjetivo",
                    event.target.value
                  )
                }
              />

              <TextField
                label="Ya reservado"
                type="number"
                value={
                  formulario.ahorrado
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "ahorrado",
                    event.target.value
                  )
                }
              />

              <TextField
                label="Fecha objetivo"
                type="date"
                value={
                  formulario.fechaVencimiento
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "fechaVencimiento",
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={guardando}
              sx={{
                mt: 2.5,
              }}
            >
              {guardando
                ? "Guardando..."
                : "Crear apartado"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 2,
        }}
      >
        {apartados.map(
          (apartado) => {
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

            const completo =
              pendiente <= 0;

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
                      <Typography
                        fontSize={20}
                        fontWeight={800}
                      >
                        {
                          apartado.concepto
                        }
                      </Typography>

                      <Typography
                        color="text.secondary"
                        fontSize={13}
                      >
                        {apartado.lugar} ·{" "}
                        {dias < 0 &&
                        !completo
                          ? "Vencido"
                          : completo
                            ? "Completo"
                            : `${dias} días restantes`}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        Reserva recomendada
                        semanal
                      </Typography>

                      <Typography
                        fontWeight={900}
                        fontSize={22}
                        color={
                          completo
                            ? "success.main"
                            : "primary.main"
                        }
                      >
                        {completo
                          ? "Completo"
                          : formatearDinero(
                              semanal
                            )}
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={porcentaje}
                    sx={{
                      mt: 3,
                      mb: 2,
                      height: 10,
                      borderRadius: 10,
                    }}
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs:
                          "repeat(2, 1fr)",
                        md:
                          "repeat(4, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    <Dato
                      titulo="Objetivo"
                      valor={formatearDinero(
                        apartado.montoObjetivo
                      )}
                    />

                    <Dato
                      titulo="Ya reservado"
                      valor={formatearDinero(
                        apartado.ahorrado
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
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 2.5,
                    }}
                  >
                    {!completo && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            agregarSemanal(
                              apartado
                            )
                          }
                        >
                          + Apartado semanal
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            agregarOtraCantidad(
                              apartado
                            )
                          }
                        >
                          + Otra cantidad
                        </Button>
                      </>
                    )}

                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        eliminarApartado(
                          apartado
                        )
                      }
                    >
                      Eliminar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          }
        )}

        {apartados.length ===
          0 && (
          <Card
            sx={{
              borderRadius: "24px",
            }}
          >
            <CardContent
              sx={{
                py: 6,
                textAlign: "center",
              }}
            >
              <Typography
                fontSize={30}
              >
                🎯
              </Typography>

              <Typography
                fontWeight={800}
                sx={{ mt: 1 }}
              >
                Todavía no tienes
                apartados
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
            mt: 0.5,
            fontWeight: 900,
            fontSize: 22,
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