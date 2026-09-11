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
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
  useAuth,
} from "../context/AuthContext";

import {
  userCollection,
  userDoc,
} from "../services/userData";

import {
  formatearDinero,
} from "../utils/frecuencia";

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const categoriasIngreso = [
  "Sueldo",
  "Consultas / Servicios",
  "Ventas",
  "Honorarios",
  "Comisiones",
  "Rentas",
  "Inversiones",
  "Transferencias / Apoyo",
  "Otros ingresos",
];

const categoriasEgreso = [
  "Vivienda",
  "Servicios",
  "Alimentación",
  "Transporte",
  "Salud",
  "Educación",
  "Consultorio / Negocio",
  "Suscripciones",
  "Impuestos",
  "Ocio",
  "Compras",
  "Mascotas",
  "Seguros",
  "Deudas",
  "Otros gastos",
];

const obtenerHoy = () => {
  const fecha = new Date();

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      fecha.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "-";
  }

  const valor =
    new Date(
      `${fecha}T12:00:00`
    );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(valor);
};

const crearFormularioInicial =
  () => ({
    tipo: "Egreso",
    fecha: obtenerHoy(),
    lugar: "Casa",
    categoria:
      "Alimentación",
    concepto: "",
    monto: "",
  });

export default function Movimientos() {
  const {
    user,
  } = useAuth();

  const [
    movimientos,
    setMovimientos,
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
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState("");

  const [
    filtroLugar,
    setFiltroLugar,
  ] = useState("");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("");

  const [
    fechaDesde,
    setFechaDesde,
  ] = useState("");

  const [
    fechaHasta,
    setFechaHasta,
  ] = useState("");

  const cargarMovimientos =
    useCallback(async () => {
      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            userCollection(
              user.uid,
              "movimientos"
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
              b.fecha || ""
            ).localeCompare(
              a.fecha || ""
            )
        );

        setMovimientos(lista);
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
    cargarMovimientos();
  }, [cargarMovimientos]);

  const categoriasFormulario =
    formulario.tipo ===
    "Ingreso"
      ? categoriasIngreso
      : categoriasEgreso;

  const manejarCambio = (
    campo,
    valor
  ) => {
    if (
      campo === "tipo"
    ) {
      const nuevasCategorias =
        valor === "Ingreso"
          ? categoriasIngreso
          : categoriasEgreso;

      setFormulario(
        (anterior) => ({
          ...anterior,
          tipo: valor,
          categoria:
            nuevasCategorias[0],
        })
      );

      return;
    }

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
    };

  const guardarMovimiento =
    async (event) => {
      event.preventDefault();

      const concepto =
        formulario.concepto.trim();

      const monto =
        Number(
          formulario.monto
        );

      if (!concepto) {
        setError(
          "Escribe el concepto del movimiento."
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
        !formulario.fecha
      ) {
        setError(
          "Selecciona la fecha del movimiento."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        const datos = {
          tipo:
            formulario.tipo,

          fecha:
            formulario.fecha,

          lugar:
            formulario.lugar,

          categoria:
            formulario.categoria,

          concepto,

          monto,

          updatedAt:
            serverTimestamp(),
        };

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

        limpiarFormulario();

        await cargarMovimientos();
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
      const categoriaFallback =
        movimiento.tipo ===
        "Ingreso"
          ? categoriasIngreso[0]
          : categoriasEgreso[0];

      setFormulario({
        tipo:
          movimiento.tipo ||
          "Egreso",

        fecha:
          movimiento.fecha ||
          obtenerHoy(),

        lugar:
          movimiento.lugar ||
          "Casa",

        categoria:
          movimiento.categoria ||
          categoriaFallback,

        concepto:
          movimiento.concepto ||
          "",

        monto:
          movimiento.monto ||
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
      const confirmar =
        window.confirm(
          `¿Eliminar "${movimiento.concepto}"?`
        );

      if (!confirmar) {
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

        await cargarMovimientos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el movimiento."
        );
      }
    };

  const todasCategorias =
    useMemo(() => {
      return [
        ...new Set([
          ...categoriasIngreso,
          ...categoriasEgreso,
        ]),
      ];
    }, []);

  const movimientosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return movimientos.filter(
        (movimiento) => {
          const concepto =
            movimiento.concepto ||
            "";

          const categoria =
            movimiento.categoria ||
            "";

          const coincideBusqueda =
            !texto ||
            concepto
              .toLowerCase()
              .includes(texto) ||
            categoria
              .toLowerCase()
              .includes(texto);

          const coincideTipo =
            !filtroTipo ||
            movimiento.tipo ===
              filtroTipo;

          const coincideLugar =
            !filtroLugar ||
            movimiento.lugar ===
              filtroLugar;

          const coincideCategoria =
            !filtroCategoria ||
            movimiento.categoria ===
              filtroCategoria;

          const coincideDesde =
            !fechaDesde ||
            movimiento.fecha >=
              fechaDesde;

          const coincideHasta =
            !fechaHasta ||
            movimiento.fecha <=
              fechaHasta;

          return (
            coincideBusqueda &&
            coincideTipo &&
            coincideLugar &&
            coincideCategoria &&
            coincideDesde &&
            coincideHasta
          );
        }
      );
    }, [
      movimientos,
      busqueda,
      filtroTipo,
      filtroLugar,
      filtroCategoria,
      fechaDesde,
      fechaHasta,
    ]);

  const resumen =
    useMemo(() => {
      let ingresos = 0;
      let egresos = 0;

      movimientosFiltrados.forEach(
        (movimiento) => {
          const monto =
            Number(
              movimiento.monto ||
                0
            );

          if (
            movimiento.tipo ===
            "Ingreso"
          ) {
            ingresos += monto;
          } else {
            egresos += monto;
          }
        }
      );

      return {
        ingresos,
        egresos,
        balance:
          ingresos - egresos,
        cantidad:
          movimientosFiltrados.length,
      };
    }, [
      movimientosFiltrados,
    ]);

  const limpiarFiltros =
    () => {
      setBusqueda("");
      setFiltroTipo("");
      setFiltroLugar("");
      setFiltroCategoria("");
      setFechaDesde("");
      setFechaHasta("");
    };

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
        maxWidth: 1450,
        mx: "auto",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: {
              xs: 29,
              md: 34,
            },
            fontWeight: 800,
          }}
        >
          Movimientos
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Registra el dinero que
          realmente entró y salió.
        </Typography>
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
        <ResumenCard
          titulo="Ingresos reales"
          valor={resumen.ingresos}
          icono="💰"
          color="#10B981"
        />

        <ResumenCard
          titulo="Egresos reales"
          valor={resumen.egresos}
          icono="🧾"
          color="#EF4444"
        />

        <ResumenCard
          titulo="Balance"
          valor={resumen.balance}
          icono="⚖️"
          color={
            resumen.balance >=
            0
              ? "#6D5DFB"
              : "#EF4444"
          }
        />

        <Card
          sx={{
            borderRadius: "20px",
          }}
        >
          <CardContent>
            <Typography
              sx={{ fontSize: 24 }}
            >
              🔄
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 1 }}
            >
              Movimientos
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {resumen.cantidad}
            </Typography>
          </CardContent>
        </Card>
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
            {editandoId
              ? "Editar movimiento"
              : "Nuevo movimiento"}
          </Typography>

          <Box
            component="form"
            onSubmit={
              guardarMovimiento
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
                    "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
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
                    manejarCambio(
                      "tipo",
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
                  manejarCambio(
                    "fecha",
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>
                  Espacio
                </InputLabel>

                <Select
                  value={
                    formulario.lugar
                  }
                  label="Espacio"
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

              <FormControl fullWidth>
                <InputLabel>
                  Categoría
                </InputLabel>

                <Select
                  value={
                    formulario.categoria
                  }
                  label="Categoría"
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "categoria",
                      event.target.value
                    )
                  }
                >
                  {categoriasFormulario.map(
                    (categoria) => (
                      <MenuItem
                        key={categoria}
                        value={categoria}
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
                  manejarCambio(
                    "concepto",
                    event.target.value
                  )
                }
                fullWidth
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
                  manejarCambio(
                    "monto",
                    event.target.value
                  )
                }
                inputProps={{
                  min: 0,
                  step: "0.01",
                }}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                mt: 2.5,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Registrar movimiento"}
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

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Typography
            fontWeight={800}
            sx={{ mb: 2 }}
          >
            Buscar y filtrar
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm:
                  "repeat(2, 1fr)",
                lg:
                  "2fr repeat(5, 1fr)",
              },
              gap: 1.5,
            }}
          >
            <TextField
              label="Buscar movimiento"
              value={busqueda}
              onChange={(
                event
              ) =>
                setBusqueda(
                  event.target.value
                )
              }
            />

            <FormControl>
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
                  Ingresos
                </MenuItem>

                <MenuItem value="Egreso">
                  Egresos
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>
                Espacio
              </InputLabel>

              <Select
                label="Espacio"
                value={
                  filtroLugar
                }
                onChange={(
                  event
                ) =>
                  setFiltroLugar(
                    event.target.value
                  )
                }
              >
                <MenuItem value="">
                  Todos
                </MenuItem>

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

            <FormControl>
              <InputLabel>
                Categoría
              </InputLabel>

              <Select
                label="Categoría"
                value={
                  filtroCategoria
                }
                onChange={(
                  event
                ) =>
                  setFiltroCategoria(
                    event.target.value
                  )
                }
              >
                <MenuItem value="">
                  Todas
                </MenuItem>

                {todasCategorias.map(
                  (categoria) => (
                    <MenuItem
                      key={categoria}
                      value={categoria}
                    >
                      {categoria}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <TextField
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(
                event
              ) =>
                setFechaDesde(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(
                event
              ) =>
                setFechaHasta(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

          <Button
            size="small"
            onClick={
              limpiarFiltros
            }
            sx={{ mt: 2 }}
          >
            Limpiar filtros
          </Button>
        </CardContent>
      </Card>

      <Card
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          borderRadius: "24px",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Fecha
                </TableCell>
                <TableCell>
                  Concepto
                </TableCell>
                <TableCell>
                  Tipo
                </TableCell>
                <TableCell>
                  Categoría
                </TableCell>
                <TableCell>
                  Espacio
                </TableCell>
                <TableCell>
                  Monto
                </TableCell>
                <TableCell align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {movimientosFiltrados.map(
                (movimiento) => (
                  <TableRow
                    key={
                      movimiento.id
                    }
                    hover
                  >
                    <TableCell>
                      {formatearFecha(
                        movimiento.fecha
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={700}
                      >
                        {
                          movimiento.concepto
                        }
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          movimiento.tipo
                        }
                        color={
                          movimiento.tipo ===
                          "Ingreso"
                            ? "success"
                            : "error"
                        }
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {
                        movimiento.categoria
                      }
                    </TableCell>

                    <TableCell>
                      {movimiento.lugar}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 800,
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
                    </TableCell>

                    <TableCell
                      align="right"
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
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box
        sx={{
          display: {
            xs: "grid",
            md: "none",
          },
          gap: 1.5,
        }}
      >
        {movimientosFiltrados.map(
          (movimiento) => (
            <Card
              key={movimiento.id}
              sx={{
                borderRadius: "20px",
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
                      fontWeight={800}
                    >
                      {
                        movimiento.concepto
                      }
                    </Typography>

                    <Typography
                      color="text.secondary"
                      fontSize={13}
                    >
                      {formatearFecha(
                        movimiento.fecha
                      )}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 900,
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
                      movimiento.lugar
                    }
                  />

                  <Chip
                    size="small"
                    label={
                      movimiento.categoria
                    }
                  />
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent:
                      "flex-end",
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
          )
        )}
      </Box>
    </Box>
  );
}

function ResumenCard({
  titulo,
  valor,
  icono,
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
          sx={{ fontSize: 24 }}
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
            fontSize: 22,
            fontWeight: 900,
            color:
              color ||
              "text.primary",
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