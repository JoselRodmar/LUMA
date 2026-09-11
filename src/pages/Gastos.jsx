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
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

const lugares = [
  "Casa",
  "Consultorio",
  "Extras",
];

const tipos = [
  "Fijo",
  "Variable",
];

const frecuencias = [
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bimestral",
  "Semestral",
  "Anual",
];

const categorias = [
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
  "Otros",
];

const formularioInicial = {
  tipo: "Fijo",
  lugar: "Casa",
  categoria: "Vivienda",
  concepto: "",
  monto: "",
  frecuencia: "Mensual",
};

export default function Gastos() {
  const {
    user,
  } = useAuth();

  const [
    gastos,
    setGastos,
  ] = useState([]);

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
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

  const cargarGastos =
    useCallback(async () => {
      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            userCollection(
              user.uid,
              "gastos"
            )
          );

        const lista =
          snapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        setGastos(lista);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible cargar los gastos."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

  useEffect(() => {
    cargarGastos();
  }, [cargarGastos]);

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
        formularioInicial
      );

      setEditandoId(null);
    };

  const guardarGasto =
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
          "Escribe el concepto del gasto."
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

      try {
        setGuardando(true);
        setError("");

        const datos = {
          tipo:
            formulario.tipo,

          lugar:
            formulario.lugar,

          categoria:
            formulario.categoria,

          concepto,

          monto,

          frecuencia:
            formulario.frecuencia,

          updatedAt:
            serverTimestamp(),
        };

        if (editandoId) {
          await updateDoc(
            userDoc(
              user.uid,
              "gastos",
              editandoId
            ),
            datos
          );
        } else {
          await addDoc(
            userCollection(
              user.uid,
              "gastos"
            ),
            {
              ...datos,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        limpiarFormulario();

        await cargarGastos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar el gasto."
        );
      } finally {
        setGuardando(false);
      }
    };

  const editarGasto = (
    gasto
  ) => {
    setFormulario({
      tipo:
        gasto.tipo ||
        "Fijo",

      lugar:
        gasto.lugar ||
        "Casa",

      categoria:
        gasto.categoria ||
        "Otros",

      concepto:
        gasto.concepto ||
        "",

      monto:
        gasto.monto ||
        "",

      frecuencia:
        gasto.frecuencia ||
        "Mensual",
    });

    setEditandoId(
      gasto.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarGasto =
    async (gasto) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${gasto.concepto}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        await deleteDoc(
          userDoc(
            user.uid,
            "gastos",
            gasto.id
          )
        );

        await cargarGastos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el gasto."
        );
      }
    };

  const gastosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return gastos.filter(
        (gasto) => {
          const categoria =
            gasto.categoria ||
            "Sin categoría";

          const concepto =
            gasto.concepto ||
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
            gasto.tipo ===
              filtroTipo;

          const coincideLugar =
            !filtroLugar ||
            gasto.lugar ===
              filtroLugar;

          const coincideCategoria =
            !filtroCategoria ||
            categoria ===
              filtroCategoria;

          return (
            coincideBusqueda &&
            coincideTipo &&
            coincideLugar &&
            coincideCategoria
          );
        }
      );
    }, [
      gastos,
      busqueda,
      filtroTipo,
      filtroLugar,
      filtroCategoria,
    ]);

  const resumen =
    useMemo(() => {
      let total = 0;
      let fijos = 0;
      let variables = 0;

      gastosFiltrados.forEach(
        (gasto) => {
          const semanal =
            calcularSemanal(
              gasto.monto,
              gasto.frecuencia
            );

          total += semanal;

          if (
            gasto.tipo ===
            "Fijo"
          ) {
            fijos += semanal;
          } else {
            variables +=
              semanal;
          }
        }
      );

      return {
        total,
        fijos,
        variables,
      };
    }, [gastosFiltrados]);

  const limpiarFiltros =
    () => {
      setBusqueda("");
      setFiltroTipo("");
      setFiltroLugar("");
      setFiltroCategoria("");
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
          Gastos
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Organiza lo que sale de tu
          dinero y entiende exactamente
          en qué se está utilizando.
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

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
          border:
            editandoId
              ? "1px solid #DCD5FF"
              : "1px solid rgba(0,0,0,.03)",
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
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography
                fontWeight={800}
                fontSize={19}
              >
                {editandoId
                  ? "Editar gasto"
                  : "Nuevo gasto"}
              </Typography>

              {editandoId && (
                <Typography
                  color="text.secondary"
                  fontSize={13}
                >
                  Estás modificando un
                  registro existente.
                </Typography>
              )}
            </Box>

            {editandoId && (
              <Chip
                label="Modo edición"
                color="primary"
                size="small"
              />
            )}
          </Box>

          <Box
            component="form"
            onSubmit={
              guardarGasto
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
                  {tipos.map(
                    (tipo) => (
                      <MenuItem
                        key={tipo}
                        value={tipo}
                      >
                        {tipo}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>
                  Lugar
                </InputLabel>

                <Select
                  value={
                    formulario.lugar
                  }
                  label="Lugar"
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
                  {categorias.map(
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
                placeholder="Ej. Internet"
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

              <FormControl fullWidth>
                <InputLabel>
                  Frecuencia
                </InputLabel>

                <Select
                  value={
                    formulario.frecuencia
                  }
                  label="Frecuencia"
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "frecuencia",
                      event.target.value
                    )
                  }
                >
                  {frecuencias.map(
                    (frecuencia) => (
                      <MenuItem
                        key={frecuencia}
                        value={frecuencia}
                      >
                        {frecuencia}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
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
                    : "Agregar gasto"}
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
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm:
              "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <MiniResumen
          titulo="Gasto semanal"
          valor={resumen.total}
          icono="🧾"
          color="#EF4444"
        />

        <MiniResumen
          titulo="Gastos fijos"
          valor={resumen.fijos}
          icono="📌"
        />

        <MiniResumen
          titulo="Gastos variables"
          valor={
            resumen.variables
          }
          icono="🔄"
        />
      </Box>

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
                md:
                  "2fr repeat(3, 1fr)",
              },
              gap: 1.5,
            }}
          >
            <TextField
              label="Buscar gasto"
              placeholder="Ej. Internet, gasolina..."
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

                {tipos.map(
                  (tipo) => (
                    <MenuItem
                      key={tipo}
                      value={tipo}
                    >
                      {tipo}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>
                Lugar
              </InputLabel>

              <Select
                label="Lugar"
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

                <MenuItem value="Sin categoría">
                  Sin categoría
                </MenuItem>

                {categorias.map(
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
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 2,
            }}
          >
            <Typography
              color="text.secondary"
              fontSize={13}
            >
              {
                gastosFiltrados.length
              }{" "}
              {gastosFiltrados.length ===
              1
                ? "gasto encontrado"
                : "gastos encontrados"}
            </Typography>

            <Button
              size="small"
              onClick={
                limpiarFiltros
              }
            >
              Limpiar filtros
            </Button>
          </Box>
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
                  Concepto
                </TableCell>

                <TableCell>
                  Categoría
                </TableCell>

                <TableCell>
                  Tipo
                </TableCell>

                <TableCell>
                  Lugar
                </TableCell>

                <TableCell>
                  Monto
                </TableCell>

                <TableCell>
                  Frecuencia
                </TableCell>

                <TableCell>
                  Semanal
                </TableCell>

                <TableCell align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {gastosFiltrados.map(
                (gasto) => (
                  <TableRow
                    key={gasto.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        fontWeight={700}
                      >
                        {gasto.concepto}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          gasto.categoria ||
                          "Sin categoría"
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={gasto.tipo}
                        color={
                          gasto.tipo ===
                          "Fijo"
                            ? "default"
                            : "warning"
                        }
                      />
                    </TableCell>

                    <TableCell>
                      {gasto.lugar}
                    </TableCell>

                    <TableCell>
                      {formatearDinero(
                        gasto.monto
                      )}
                    </TableCell>

                    <TableCell>
                      {gasto.frecuencia}
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={700}
                        color="error"
                      >
                        {formatearDinero(
                          calcularSemanal(
                            gasto.monto,
                            gasto.frecuencia
                          )
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell
                      align="right"
                    >
                      <Button
                        size="small"
                        onClick={() =>
                          editarGasto(
                            gasto
                          )
                        }
                      >
                        Editar
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          eliminarGasto(
                            gasto
                          )
                        }
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}

              {gastosFiltrados.length ===
                0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      No encontramos gastos
                      con esos filtros.
                    </Typography>
                  </TableCell>
                </TableRow>
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
        {gastosFiltrados.map(
          (gasto) => (
            <Card
              key={gasto.id}
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
                      {gasto.concepto}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      fontSize={13}
                    >
                      {gasto.lugar} ·{" "}
                      {gasto.categoria ||
                        "Sin categoría"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: "#EF4444",
                    }}
                  >
                    {formatearDinero(
                      gasto.monto
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
                    label={gasto.tipo}
                  />

                  <Chip
                    size="small"
                    label={
                      gasto.frecuencia
                    }
                  />
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop:
                      "1px solid #EEEFF3",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography
                      color="text.secondary"
                      fontSize={11}
                    >
                      Equivalente semanal
                    </Typography>

                    <Typography
                      fontWeight={800}
                    >
                      {formatearDinero(
                        calcularSemanal(
                          gasto.monto,
                          gasto.frecuencia
                        )
                      )}
                    </Typography>
                  </Box>

                  <Box>
                    <Button
                      size="small"
                      onClick={() =>
                        editarGasto(
                          gasto
                        )
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        eliminarGasto(
                          gasto
                        )
                      }
                    >
                      Eliminar
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )
        )}

        {gastosFiltrados.length ===
          0 && (
          <Card
            sx={{
              borderRadius: "20px",
            }}
          >
            <CardContent
              sx={{
                py: 5,
                textAlign: "center",
              }}
            >
              <Typography
                fontSize={28}
              >
                🔎
              </Typography>

              <Typography
                fontWeight={800}
                sx={{ mt: 1 }}
              >
                Sin resultados
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function MiniResumen({
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
        <Box
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              color="text.secondary"
              fontSize={13}
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

            <Typography
              color="text.secondary"
              fontSize={11}
            >
              equivalente semanal
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 24,
            }}
          >
            {icono}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}