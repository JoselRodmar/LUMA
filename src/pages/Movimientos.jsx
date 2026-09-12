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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
  FUENTES_INGRESO,
  obtenerHoy,
} from "../utils/ingresos";

import {
  construirEspacios,
  obtenerNombreEspacio,
} from "../utils/espacios";

const categoriasEgreso = [
  "Vivienda",
  "Servicios",
  "Alimentación",
  "Transporte",
  "Salud",
  "Educación",
  "Negocio",
  "Personal",
  "Suscripciones",
  "Impuestos",
  "Ocio",
  "Compras",
  "Mascotas",
  "Seguros",
  "Deudas",
  "Mantenimiento",
  "Insumos",
  "Publicidad",
  "Nómina",
  "Otros",
];

const formularioInicial =
  () => ({
    tipo: "Egreso",

    fecha:
      obtenerHoy(),

    origenId: "",

    espacioId:
      "personal",

    categoria:
      "Alimentación",

    concepto: "",

    monto: "",
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
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(
      `${fecha}T12:00:00`
    )
  );
};

export default function Movimientos() {
  const {
    user,
  } = useAuth();

  const [
    movimientos,
    setMovimientos,
  ] = useState([]);

  const [
    origenes,
    setOrigenes,
  ] = useState([]);

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial()
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
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState("");

  const cargarDatos =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          movimientosSnapshot,
          perfilSnapshot,
        ] =
          await Promise.all([
            getDocs(
              userCollection(
                user.uid,
                "movimientos"
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
          movimientosSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        lista.sort(
          (a, b) =>
            (
              b.fecha || ""
            ).localeCompare(
              a.fecha || ""
            )
        );

        const perfil =
          perfilSnapshot.exists()
            ? perfilSnapshot.data()
            : {};

        setMovimientos(
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
          "No fue posible cargar los movimientos."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

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

  const origenSeleccionado =
    useMemo(
      () =>
        origenes.find(
          (origen) =>
            origen.id ===
            formulario.origenId
        ) || null,
      [
        origenes,
        formulario.origenId,
      ]
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

  const manejarTipo = (
    tipo
  ) => {
    setFormulario(
      (anterior) => ({
        ...anterior,

        tipo,

        categoria:
          tipo ===
          "Ingreso"
            ? FUENTES_INGRESO[0]
            : categoriasEgreso[0],
      })
    );
  };

  const guardarMovimiento =
    async (event) => {
      event.preventDefault();

      const monto =
        Number(
          formulario.monto
        );

      if (
        !formulario.concepto.trim()
      ) {
        setError(
          "Escribe el concepto."
        );

        return;
      }

      if (
        !monto ||
        monto <= 0
      ) {
        setError(
          "Ingresa un monto válido."
        );

        return;
      }

      if (
        formulario.tipo ===
          "Ingreso" &&
        !origenSeleccionado
      ) {
        setError(
          "Selecciona el origen del ingreso."
        );

        return;
      }

      if (
        formulario.tipo ===
          "Egreso" &&
        !espacioSeleccionado
      ) {
        setError(
          "Selecciona el espacio del gasto."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        let datos;

        if (
          formulario.tipo ===
          "Ingreso"
        ) {
          datos = {
            tipo: "Ingreso",

            fecha:
              formulario.fecha,

            categoria:
              formulario.categoria,

            concepto:
              formulario.concepto.trim(),

            monto,

            origenId:
              origenSeleccionado.id,

            origenTipo:
              origenSeleccionado.tipo,

            origenNombre:
              origenSeleccionado.nombre,

            lugar:
              origenSeleccionado.nombre,

            updatedAt:
              serverTimestamp(),
          };
        } else {
          datos = {
            tipo: "Egreso",

            fecha:
              formulario.fecha,

            categoria:
              formulario.categoria,

            concepto:
              formulario.concepto.trim(),

            monto,

            espacioId:
              espacioSeleccionado.id,

            espacioTipo:
              espacioSeleccionado.tipo,

            espacioNombre:
              espacioSeleccionado.nombre,

            lugar:
              espacioSeleccionado.nombre,

            updatedAt:
              serverTimestamp(),
          };
        }

        if (editandoId) {
          await updateDoc(
            userDoc(
              user.uid,
              "movimientos",
              editandoId
            ),
            datos
          );
        } else {
          await addDoc(
            userCollection(
              user.uid,
              "movimientos"
            ),
            {
              ...datos,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        setFormulario(
          formularioInicial()
        );

        setEditandoId(null);

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar el movimiento."
        );
      } finally {
        setGuardando(false);
      }
    };

  const editarMovimiento =
    (movimiento) => {
      let espacioId =
        movimiento.espacioId ||
        "";

      if (
        movimiento.tipo ===
          "Egreso" &&
        !espacioId &&
        movimiento.lugar ===
          "Casa"
      ) {
        espacioId =
          "personal";
      }

      if (
        movimiento.tipo ===
          "Egreso" &&
        !espacioId
      ) {
        const coincidencia =
          espacios.find(
            (espacio) =>
              espacio.nombre ===
              movimiento.lugar
          );

        if (coincidencia) {
          espacioId =
            coincidencia.id;
        }
      }

      setFormulario({
        tipo:
          movimiento.tipo ||
          "Egreso",

        fecha:
          movimiento.fecha ||
          obtenerHoy(),

        origenId:
          movimiento.origenId ||
          "",

        espacioId,

        categoria:
          movimiento.categoria ||
          "Otros",

        concepto:
          movimiento.concepto ||
          "",

        monto:
          movimiento.monto ??
          "",
      });

      setEditandoId(
        movimiento.id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const eliminarMovimiento =
    async (movimiento) => {
      if (
        !window.confirm(
          `¿Eliminar "${movimiento.concepto}"?`
        )
      ) {
        return;
      }

      try {
        await deleteDoc(
          userDoc(
            user.uid,
            "movimientos",
            movimiento.id
          )
        );

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el movimiento."
        );
      }
    };

  const movimientosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return movimientos.filter(
        (movimiento) => {
          const ubicacion =
            movimiento.tipo ===
            "Ingreso"
              ? movimiento.origenNombre ||
                movimiento.lugar ||
                ""
              : obtenerNombreEspacio(
                  movimiento
                );

          const coincideTexto =
            !texto ||
            (
              movimiento.concepto ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              movimiento.categoria ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            ubicacion
              .toLowerCase()
              .includes(texto);

          const coincideTipo =
            !filtroTipo ||
            movimiento.tipo ===
              filtroTipo;

          return (
            coincideTexto &&
            coincideTipo
          );
        }
      );
    }, [
      movimientos,
      busqueda,
      filtroTipo,
    ]);

  const resumen =
    useMemo(() => {
      let ingresos = 0;
      let egresos = 0;

      movimientosFiltrados.forEach(
        (movimiento) => {
          if (
            movimiento.tipo ===
            "Ingreso"
          ) {
            ingresos +=
              Number(
                movimiento.monto ||
                  0
              );
          } else {
            egresos +=
              Number(
                movimiento.monto ||
                  0
              );
          }
        }
      );

      return {
        ingresos,
        egresos,
        balance:
          ingresos -
          egresos,
      };
    }, [
      movimientosFiltrados,
    ]);

  const categoriasFormulario =
    formulario.tipo ===
    "Ingreso"
      ? FUENTES_INGRESO
      : categoriasEgreso;

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
        Movimientos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Registra lo que realmente
        entra y sale de cada espacio.
      </Typography>

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
            md:
              "repeat(3, 1fr)",
          },

          gap: 2,
          mb: 3,
        }}
      >
        <Resumen
          titulo="Ingresos reales"
          valor={
            resumen.ingresos
          }
          color="#10B981"
        />

        <Resumen
          titulo="Egresos reales"
          valor={
            resumen.egresos
          }
          color="#EF4444"
        />

        <Resumen
          titulo="Balance"
          valor={
            resumen.balance
          }
          color={
            resumen.balance >=
            0
              ? "#6D5DFB"
              : "#EF4444"
          }
        />
      </Box>

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            fontWeight={900}
            fontSize={20}
          >
            {editandoId
              ? "Editar movimiento"
              : "Nuevo movimiento"}
          </Typography>

          <Box
            component="form"
            onSubmit={
              guardarMovimiento
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
                Tipo
              </InputLabel>

              <Select
                value={
                  formulario.tipo
                }
                label="Tipo"
                onChange={(
                  event
                ) =>
                  manejarTipo(
                    event.target.value
                  )
                }
              >
                <MenuItem value="Ingreso">
                  Ingreso
                </MenuItem>

                <MenuItem value="Egreso">
                  Egreso
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              type="date"
              value={
                formulario.fecha
              }
              onChange={(
                event
              ) =>
                setFormulario(
                  (anterior) => ({
                    ...anterior,
                    fecha:
                      event.target.value,
                  })
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            {formulario.tipo ===
            "Ingreso" ? (
              <FormControl>
                <InputLabel>
                  Origen
                </InputLabel>

                <Select
                  label="Origen"
                  value={
                    formulario.origenId
                  }
                  onChange={(
                    event
                  ) =>
                    setFormulario(
                      (anterior) => ({
                        ...anterior,

                        origenId:
                          event.target.value,
                      })
                    )
                  }
                >
                  {origenes.map(
                    (origen) => (
                      <MenuItem
                        key={
                          origen.id
                        }
                        value={
                          origen.id
                        }
                      >
                        {origen.tipo} ·{" "}
                        {origen.nombre}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            ) : (
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
                    setFormulario(
                      (anterior) => ({
                        ...anterior,

                        espacioId:
                          event.target.value,
                      })
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
                        {espacio.tipo} ·{" "}
                        {espacio.nombre}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            )}

            <FormControl>
              <InputLabel>
                Categoría
              </InputLabel>

              <Select
                label="Categoría"
                value={
                  formulario.categoria
                }
                onChange={(
                  event
                ) =>
                  setFormulario(
                    (anterior) => ({
                      ...anterior,

                      categoria:
                        event.target.value,
                    })
                  )
                }
              >
                {categoriasFormulario.map(
                  (categoria) => (
                    <MenuItem
                      key={
                        categoria
                      }
                      value={
                        categoria
                      }
                    >
                      {categoria}
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
                setFormulario(
                  (anterior) => ({
                    ...anterior,

                    concepto:
                      event.target.value,
                  })
                )
              }
            />

            <TextField
              label="Monto"
              type="number"
              value={
                formulario.monto
              }
              onChange={(
                event
              ) =>
                setFormulario(
                  (anterior) => ({
                    ...anterior,

                    monto:
                      event.target.value,
                  })
                )
              }
            />

            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  xl:
                    "1 / -1",
                },

                display: "flex",
                gap: 1.5,
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
                    : "Registrar movimiento"}
              </Button>

              {editandoId && (
                <Button
                  onClick={() => {
                    setFormulario(
                      formularioInicial()
                    );

                    setEditandoId(
                      null
                    );
                  }}
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
        <TextField
          label="Buscar"
          value={busqueda}
          onChange={(
            event
          ) =>
            setBusqueda(
              event.target.value
            )
          }
          sx={{
            flex: 1,
            minWidth: 240,
          }}
        />

        <FormControl
          sx={{
            minWidth: 180,
          }}
        >
          <InputLabel>
            Tipo
          </InputLabel>

          <Select
            label="Tipo"
            value={
              filtroTipo
            }
            onChange={(
              event
            ) =>
              setFiltroTipo(
                event.target.value
              )
            }
          >
            <MenuItem value="">
              Todos
            </MenuItem>

            <MenuItem value="Ingreso">
              Ingreso
            </MenuItem>

            <MenuItem value="Egreso">
              Egreso
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
        }}
      >
        {movimientosFiltrados.map(
          (movimiento) => {
            const ubicacion =
              movimiento.tipo ===
              "Ingreso"
                ? movimiento.origenNombre ||
                  movimiento.lugar ||
                  "Sin origen"
                : obtenerNombreEspacio(
                    movimiento
                  );

            return (
              <Card
                key={
                  movimiento.id
                }
                sx={{
                  borderRadius:
                    "20px",
                }}
              >
                <CardContent>
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
                      >
                        {
                          movimiento.concepto
                        }
                      </Typography>

                      <Typography
                        color="text.secondary"
                        fontSize={12}
                      >
                        {formatearFecha(
                          movimiento.fecha
                        )}
                        {" · "}
                        {ubicacion}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 18,

                        color:
                          movimiento.tipo ===
                          "Ingreso"
                            ? "#10B981"
                            : "#EF4444",
                      }}
                    >
                      {movimiento.tipo ===
                      "Ingreso"
                        ? "+"
                        : "-"}

                      {formatearDinero(
                        movimiento.monto
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      size="small"
                      label={
                        movimiento.tipo
                      }
                    />

                    <Chip
                      size="small"
                      label={
                        movimiento.categoria
                      }
                    />
                  </Box>

                  {movimiento.cantidadUnidades && (
                    <Typography
                      color="text.secondary"
                      fontSize={12}
                      sx={{ mt: 2 }}
                    >
                      {
                        movimiento.cantidadUnidades
                      }{" "}
                      {movimiento.unidad ||
                        "unidades"}{" "}
                      ×{" "}
                      {formatearDinero(
                        movimiento.valorUnidad
                      )}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "flex-end",
                      mt: 2,
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() =>
                        editarMovimiento(
                          movimiento
                        )
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        eliminarMovimiento(
                          movimiento
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
            mt: 0.8,
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