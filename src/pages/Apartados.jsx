import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
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
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
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

import {
  construirEspacios,
  iconoEspacio,
  obtenerNombreEspacio,
} from "../utils/espacios";

const obtenerFechaInicial =
  () => {
    const fecha =
      new Date();

    fecha.setDate(
      fecha.getDate() + 30
    );

    return fecha
      .toISOString()
      .slice(0, 10);
  };

const crearFormularioInicial =
  () => ({
    espacioId:
      "personal",

    concepto: "",

    montoObjetivo:
      "",

    ahorrado:
      "",

    fechaVencimiento:
      obtenerFechaInicial(),

    activo: true,
  });

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

export default function Apartados() {
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
    formulario,
    setFormulario,
  ] = useState(
    crearFormularioInicial()
  );

  const [
    editandoId,
    setEditandoId,
  ] = useState(null);

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

  const [
    filtroEspacio,
    setFiltroEspacio,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  /*
    DIÁLOGO PARA AGREGAR AHORRO
  */

  const [
    apartadoAhorro,
    setApartadoAhorro,
  ] = useState(null);

  const [
    cantidadAhorro,
    setCantidadAhorro,
  ] = useState("");

  const [
    guardandoAhorro,
    setGuardandoAhorro,
  ] = useState(false);

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

          setError("");
        } catch (err) {
          console.error(err);

          setError(
            "No fue posible cargar tus apartados."
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

  const espacioSeleccionado =
    useMemo(
      () =>
        espacios.find(
          (espacio) =>
            espacio.id ===
            formulario.espacioId
        ) || null,
      [
        espacios,
        formulario.espacioId,
      ]
    );

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

  const limpiarFormulario =
    () => {
      setFormulario(
        crearFormularioInicial()
      );

      setEditandoId(null);
      setError("");
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
          "Escribe el nombre del apartado."
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

      if (ahorrado < 0) {
        setError(
          "El monto reservado no puede ser negativo."
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

      if (
        !espacioSeleccionado
      ) {
        setError(
          "Selecciona un espacio financiero."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        const ahorradoFinal =
          Math.min(
            objetivo,
            ahorrado
          );

        const completado =
          ahorradoFinal >=
          objetivo;

        const datos = {
          espacioId:
            espacioSeleccionado.id,

          espacioTipo:
            espacioSeleccionado.tipo,

          espacioNombre:
            espacioSeleccionado.nombre,

          /*
            Compatibilidad temporal
            con apartados anteriores.
          */

          lugar:
            espacioSeleccionado.nombre,

          concepto,

          montoObjetivo:
            objetivo,

          ahorrado:
            ahorradoFinal,

          fechaVencimiento:
            formulario.fechaVencimiento,

          activo:
            completado
              ? false
              : formulario.activo,

          updatedAt:
            serverTimestamp(),
        };

        if (editandoId) {
          await updateDoc(
            userDoc(
              user.uid,
              "apartados",
              editandoId
            ),
            datos
          );
        } else {
          await addDoc(
            userCollection(
              user.uid,
              "apartados"
            ),
            {
              ...datos,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        limpiarFormulario();

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar el apartado."
        );
      } finally {
        setGuardando(false);
      }
    };

  const editarApartado =
    (apartado) => {
      let espacioId =
        apartado.espacioId ||
        "";

      /*
        Compatibilidad con datos
        antiguos.
      */

      if (
        !espacioId &&
        apartado.lugar ===
          "Casa"
      ) {
        espacioId =
          "personal";
      }

      if (!espacioId) {
        const coincidencia =
          espacios.find(
            (espacio) =>
              espacio.nombre ===
              apartado.lugar
          );

        if (coincidencia) {
          espacioId =
            coincidencia.id;
        }
      }

      setFormulario({
        espacioId,

        concepto:
          apartado.concepto ||
          "",

        montoObjetivo:
          apartado.montoObjetivo ??
          "",

        ahorrado:
          apartado.ahorrado ??
          "",

        fechaVencimiento:
          apartado.fechaVencimiento ||
          obtenerFechaInicial(),

        activo:
          apartado.activo !==
          false,
      });

      setEditandoId(
        apartado.id
      );

      setError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el apartado."
        );
      }
    };

  const cambiarActivo =
    async (
      apartado,
      activo
    ) => {
      try {
        await updateDoc(
          userDoc(
            user.uid,
            "apartados",
            apartado.id
          ),
          {
            activo,

            updatedAt:
              serverTimestamp(),
          }
        );

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible actualizar el apartado."
        );
      }
    };

  /*
    ============================
    AGREGAR AHORRO
    ============================
  */

  const abrirAhorro =
    (apartado) => {
      setApartadoAhorro(
        apartado
      );

      setCantidadAhorro(
        ""
      );

      setError("");
    };

  const cerrarAhorro =
    () => {
      if (
        guardandoAhorro
      ) {
        return;
      }

      setApartadoAhorro(
        null
      );

      setCantidadAhorro(
        ""
      );
    };

  const registrarAhorro =
    async () => {
      if (
        !apartadoAhorro
      ) {
        return;
      }

      const cantidad =
        Number(
          cantidadAhorro
        );

      if (
        !cantidad ||
        cantidad <= 0
      ) {
        setError(
          "Ingresa una cantidad válida."
        );

        return;
      }

      try {
        setGuardandoAhorro(
          true
        );

        setError("");

        const objetivo =
          Number(
            apartadoAhorro.montoObjetivo ||
              0
          );

        const actual =
          Number(
            apartadoAhorro.ahorrado ||
              0
          );

        const nuevo =
          Math.min(
            objetivo,
            actual +
              cantidad
          );

        const completado =
          nuevo >=
          objetivo;

        await updateDoc(
          userDoc(
            user.uid,
            "apartados",
            apartadoAhorro.id
          ),
          {
            ahorrado:
              nuevo,

            activo:
              !completado,

            updatedAt:
              serverTimestamp(),
          }
        );

        cerrarAhorro();

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible registrar el ahorro."
        );
      } finally {
        setGuardandoAhorro(
          false
        );
      }
    };

  /*
    ============================
    FILTROS
    ============================
  */

  const apartadosFiltrados =
    useMemo(
      () =>
        apartados.filter(
          (apartado) => {
            const espacioRegistro =
              apartado.espacioId ||
              (
                apartado.lugar ===
                "Casa"
                  ? "personal"
                  : ""
              );

            const coincideEspacio =
              !filtroEspacio ||
              espacioRegistro ===
                filtroEspacio;

            const pendiente =
              calcularPendienteApartado(
                apartado.montoObjetivo,
                apartado.ahorrado
              );

            let estado =
              "activo";

            if (
              pendiente <= 0
            ) {
              estado =
                "completo";
            } else if (
              apartado.activo ===
              false
            ) {
              estado =
                "pausado";
            }

            const coincideEstado =
              !filtroEstado ||
              estado ===
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
      let ahorrado = 0;
      let pendiente = 0;
      let semanal = 0;

      apartados.forEach(
        (apartado) => {
          objetivo +=
            Number(
              apartado.montoObjetivo ||
                0
            );

          ahorrado +=
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
        ahorrado,
        pendiente,
        semanal,
      };
    }, [apartados]);

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
            md: 34,
          },

          fontWeight: 900,
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
        Reserva dinero para metas,
        compromisos y gastos futuros
        de cada espacio financiero.
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
            xl:
              "repeat(4, 1fr)",
          },

          gap: 2,
          mb: 3,
        }}
      >
        <ResumenCard
          titulo="Objetivo total"
          valor={
            resumen.objetivo
          }
          icono="🎯"
        />

        <ResumenCard
          titulo="Reservado"
          valor={
            resumen.ahorrado
          }
          icono="💰"
        />

        <ResumenCard
          titulo="Pendiente"
          valor={
            resumen.pendiente
          }
          icono="⏳"
        />

        <ResumenCard
          titulo="Reserva semanal"
          valor={
            resumen.semanal
          }
          icono="📅"
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
            fontWeight={900}
            fontSize={20}
          >
            {editandoId
              ? "Editar apartado"
              : "Nuevo apartado"}
          </Typography>

          <Box
            component="form"
            onSubmit={
              guardarApartado
            }
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
              mt: 3,
            }}
          >
            <FormControl>
              <InputLabel>
                Espacio
              </InputLabel>

              <Select
                label="Espacio"
                value={
                  formulario.espacioId
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "espacioId",
                    event.target.value
                  )
                }
              >
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
                      {iconoEspacio(
                        espacio.tipo
                      )}{" "}
                      {espacio.tipo} ·{" "}
                      {espacio.nombre}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <TextField
              label="Apartado"
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
              placeholder="Ej. Vacaciones, equipo nuevo..."
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

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Switch
                checked={
                  formulario.activo
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "activo",
                    event.target.checked
                  )
                }
              />

              <Typography>
                Apartado activo
              </Typography>
            </Box>

            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  xl: "1 / -1",
                },

                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Crear apartado"}
              </Button>

              {editandoId && (
                <Button
                  variant="outlined"
                  onClick={
                    limpiarFormulario
                  }
                >
                  Cancelar
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
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

            <MenuItem value="activo">
              Activos
            </MenuItem>

            <MenuItem value="pausado">
              Pausados
            </MenuItem>

            <MenuItem value="completo">
              Completados
            </MenuItem>
          </Select>
        </FormControl>
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
        }}
      >
        {apartadosFiltrados.map(
          (apartado) => (
            <ApartadoCard
              key={
                apartado.id
              }
              apartado={
                apartado
              }
              onEditar={() =>
                editarApartado(
                  apartado
                )
              }
              onEliminar={() =>
                eliminarApartado(
                  apartado
                )
              }
              onAgregar={() =>
                abrirAhorro(
                  apartado
                )
              }
              onActivo={(
                activo
              ) =>
                cambiarActivo(
                  apartado,
                  activo
                )
              }
            />
          )
        )}

        {apartadosFiltrados.length ===
          0 && (
          <Card
            sx={{
              gridColumn:
                "1 / -1",

              borderRadius:
                "24px",
            }}
          >
            <CardContent
              sx={{
                py: 6,
                textAlign:
                  "center",
              }}
            >
              <Typography
                fontSize={36}
              >
                🎯
              </Typography>

              <Typography
                fontWeight={900}
                fontSize={19}
                sx={{ mt: 1 }}
              >
                No hay apartados
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Crea una meta para
                empezar a reservar
                dinero.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Dialog
        open={
          Boolean(
            apartadoAhorro
          )
        }
        onClose={
          cerrarAhorro
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Agregar ahorro
        </DialogTitle>

        {apartadoAhorro && (
          <>
            <DialogContent>
              <Typography
                fontWeight={800}
              >
                {
                  apartadoAhorro.concepto
                }
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
                sx={{
                  mt: 0.5,
                  mb: 3,
                }}
              >
                Pendiente:{" "}
                {formatearDinero(
                  calcularPendienteApartado(
                    apartadoAhorro.montoObjetivo,
                    apartadoAhorro.ahorrado
                  )
                )}
              </Typography>

              <TextField
                fullWidth
                autoFocus
                label="Cantidad a agregar"
                type="number"
                value={
                  cantidadAhorro
                }
                onChange={(
                  event
                ) =>
                  setCantidadAhorro(
                    event.target.value
                  )
                }
              />
            </DialogContent>

            <DialogActions
              sx={{ p: 3 }}
            >
              <Button
                onClick={
                  cerrarAhorro
                }
                disabled={
                  guardandoAhorro
                }
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                onClick={
                  registrarAhorro
                }
                disabled={
                  guardandoAhorro
                }
              >
                {guardandoAhorro
                  ? "Guardando..."
                  : "Agregar"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

function ApartadoCard({
  apartado,
  onEditar,
  onEliminar,
  onAgregar,
  onActivo,
}) {
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

  const esAnterior =
    !apartado.espacioId;

  let estado =
    "Activo";

  let colorEstado =
    "primary";

  if (completo) {
    estado =
      "Completado";

    colorEstado =
      "success";
  } else if (
    apartado.activo ===
    false
  ) {
    estado =
      "Pausado";

    colorEstado =
      "default";
  } else if (
    dias < 0
  ) {
    estado =
      "Vencido";

    colorEstado =
      "error";
  }

  return (
    <Card
      sx={{
        borderRadius: "24px",

        border:
          esAnterior
            ? "1px solid #F59E0B"
            : "1px solid rgba(0,0,0,.03)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              fontWeight={900}
              fontSize={20}
            >
              {
                apartado.concepto
              }
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
            >
              {obtenerNombreEspacio(
                apartado
              )}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={estado}
            color={colorEstado}
            variant={
              completo
                ? "filled"
                : "outlined"
            }
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 2,
          }}
        >
          {esAnterior && (
            <Chip
              size="small"
              color="warning"
              label="Actualizar espacio"
            />
          )}

          <Chip
            size="small"
            label={formatearFecha(
              apartado.fechaVencimiento
            )}
          />
        </Box>

        <Box
          sx={{ mt: 3 }}
        >
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
              fontSize={12}
            >
              Progreso
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
            value={porcentaje}
            sx={{
              height: 10,
              borderRadius: 10,
              mt: 1,
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns:
              "repeat(2, 1fr)",

            gap: 2,

            mt: 3,
          }}
        >
          <Dato
            titulo="Objetivo"
            valor={formatearDinero(
              apartado.montoObjetivo
            )}
          />

          <Dato
            titulo="Reservado"
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
            titulo="Reserva semanal"
            valor={
              completo
                ? formatearDinero(
                    0
                  )
                : formatearDinero(
                    semanal
                  )
            }
          />
        </Box>

        {!completo && (
          <Typography
            color="text.secondary"
            fontSize={12}
            sx={{ mt: 2 }}
          >
            {dias >= 0
              ? `${dias} días restantes`
              : `${Math.abs(
                  dias
                )} días vencido`}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mt: 3,
          }}
        >
          {!completo && (
            <Button
              variant="contained"
              size="small"
              onClick={
                onAgregar
              }
            >
              + Agregar ahorro
            </Button>
          )}

          <Button
            size="small"
            onClick={onEditar}
          >
            Editar
          </Button>

          {!completo && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Switch
                size="small"
                checked={
                  apartado.activo !==
                  false
                }
                onChange={(
                  event
                ) =>
                  onActivo(
                    event.target.checked
                  )
                }
              />

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Activo
              </Typography>
            </Box>
          )}

          <Button
            size="small"
            color="error"
            onClick={
              onEliminar
            }
          >
            Eliminar
          </Button>
        </Box>
      </CardContent>
    </Card>
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
        borderRadius: "20px",
      }}
    >
      <CardContent>
        <Typography
          fontSize={23}
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
          fontWeight={900}
          fontSize={22}
          sx={{ mt: 0.5 }}
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
        fontWeight={900}
      >
        {valor}
      </Typography>
    </Box>
  );
}