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

const frecuencias = [
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bimestral",
  "Semestral",
  "Anual",
];

const fuentes = [
  "Sueldo",
  "Consultas / Servicios",
  "Ventas",
  "Honorarios",
  "Comisiones",
  "Rentas",
  "Inversiones",
  "Transferencias / Apoyo",
  "Otros",
];

const formularioInicial = {
  lugar: "Casa",
  fuente: "Sueldo",
  nombre: "",
  monto: "",
  frecuencia: "Mensual",
};

export default function Ingresos() {
  const {
    user,
  } = useAuth();

  const [
    ingresos,
    setIngresos,
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
    filtroLugar,
    setFiltroLugar,
  ] = useState("");

  const [
    filtroFuente,
    setFiltroFuente,
  ] = useState("");

  const [
    filtroFrecuencia,
    setFiltroFrecuencia,
  ] = useState("");

  const cargarIngresos =
    useCallback(async () => {
      try {
        setLoading(true);

        const snapshot =
          await getDocs(
            userCollection(
              user.uid,
              "ingresos"
            )
          );

        const lista =
          snapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        setIngresos(lista);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible cargar los ingresos."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

  useEffect(() => {
    cargarIngresos();
  }, [cargarIngresos]);

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

  const guardarIngreso =
    async (event) => {
      event.preventDefault();

      const nombre =
        formulario.nombre.trim();

      const monto =
        Number(
          formulario.monto
        );

      if (!nombre) {
        setError(
          "Escribe el nombre del ingreso."
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
          lugar:
            formulario.lugar,

          fuente:
            formulario.fuente,

          nombre,

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
              "ingresos",
              editandoId
            ),
            datos
          );
        } else {
          await addDoc(
            userCollection(
              user.uid,
              "ingresos"
            ),
            {
              ...datos,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        limpiarFormulario();

        await cargarIngresos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible guardar el ingreso."
        );
      } finally {
        setGuardando(false);
      }
    };

  const editarIngreso = (
    ingreso
  ) => {
    setFormulario({
      lugar:
        ingreso.lugar ||
        "Casa",

      fuente:
        ingreso.fuente ||
        "Otros",

      nombre:
        ingreso.nombre ||
        "",

      monto:
        ingreso.monto ||
        "",

      frecuencia:
        ingreso.frecuencia ||
        "Mensual",
    });

    setEditandoId(
      ingreso.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarIngreso =
    async (ingreso) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${ingreso.nombre}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        await deleteDoc(
          userDoc(
            user.uid,
            "ingresos",
            ingreso.id
          )
        );

        await cargarIngresos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el ingreso."
        );
      }
    };

  const ingresosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return ingresos.filter(
        (ingreso) => {
          const fuente =
            ingreso.fuente ||
            "Sin clasificar";

          const nombre =
            ingreso.nombre ||
            "";

          const coincideBusqueda =
            !texto ||
            nombre
              .toLowerCase()
              .includes(texto) ||
            fuente
              .toLowerCase()
              .includes(texto);

          const coincideLugar =
            !filtroLugar ||
            ingreso.lugar ===
              filtroLugar;

          const coincideFuente =
            !filtroFuente ||
            fuente ===
              filtroFuente;

          const coincideFrecuencia =
            !filtroFrecuencia ||
            ingreso.frecuencia ===
              filtroFrecuencia;

          return (
            coincideBusqueda &&
            coincideLugar &&
            coincideFuente &&
            coincideFrecuencia
          );
        }
      );
    }, [
      ingresos,
      busqueda,
      filtroLugar,
      filtroFuente,
      filtroFrecuencia,
    ]);

  const resumen =
    useMemo(() => {
      const resultado = {
        total: 0,
        Casa: 0,
        Consultorio: 0,
        Extras: 0,
      };

      ingresosFiltrados.forEach(
        (ingreso) => {
          const semanal =
            calcularSemanal(
              ingreso.monto,
              ingreso.frecuencia
            );

          resultado.total +=
            semanal;

          if (
            Object.prototype.hasOwnProperty.call(
              resultado,
              ingreso.lugar
            )
          ) {
            resultado[
              ingreso.lugar
            ] += semanal;
          }
        }
      );

      return resultado;
    }, [ingresosFiltrados]);

  const limpiarFiltros =
    () => {
      setBusqueda("");
      setFiltroLugar("");
      setFiltroFuente("");
      setFiltroFrecuencia("");
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
          Ingresos
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Registra de dónde entra tu
          dinero y cuánto representa
          realmente cada semana.
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
              ? "1px solid #CDEFE3"
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
                  ? "Editar ingreso"
                  : "Nuevo ingreso"}
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
                color="success"
                size="small"
              />
            )}
          </Box>

          <Box
            component="form"
            onSubmit={
              guardarIngreso
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
                  Fuente
                </InputLabel>

                <Select
                  value={
                    formulario.fuente
                  }
                  label="Fuente"
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "fuente",
                      event.target.value
                    )
                  }
                >
                  {fuentes.map(
                    (fuente) => (
                      <MenuItem
                        key={fuente}
                        value={fuente}
                      >
                        {fuente}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Nombre"
                value={
                  formulario.nombre
                }
                onChange={(
                  event
                ) =>
                  manejarCambio(
                    "nombre",
                    event.target.value
                  )
                }
                placeholder="Ej. Consultas"
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
                color="success"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Agregar ingreso"}
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
              "repeat(2, 1fr)",
            lg:
              "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <MiniResumen
          titulo="Ingreso semanal"
          valor={resumen.total}
          icono="💰"
          color="#10B981"
        />

        <MiniResumen
          titulo="Casa"
          valor={resumen.Casa}
          icono="🏠"
        />

        <MiniResumen
          titulo="Consultorio"
          valor={
            resumen.Consultorio
          }
          icono="🩺"
        />

        <MiniResumen
          titulo="Extras"
          valor={resumen.Extras}
          icono="⭐"
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
              label="Buscar ingreso"
              placeholder="Ej. consultas, sueldo..."
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
                Fuente
              </InputLabel>

              <Select
                label="Fuente"
                value={
                  filtroFuente
                }
                onChange={(
                  event
                ) =>
                  setFiltroFuente(
                    event.target.value
                  )
                }
              >
                <MenuItem value="">
                  Todas
                </MenuItem>

                <MenuItem value="Sin clasificar">
                  Sin clasificar
                </MenuItem>

                {fuentes.map(
                  (fuente) => (
                    <MenuItem
                      key={fuente}
                      value={fuente}
                    >
                      {fuente}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>
                Frecuencia
              </InputLabel>

              <Select
                label="Frecuencia"
                value={
                  filtroFrecuencia
                }
                onChange={(
                  event
                ) =>
                  setFiltroFrecuencia(
                    event.target.value
                  )
                }
              >
                <MenuItem value="">
                  Todas
                </MenuItem>

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
                ingresosFiltrados.length
              }{" "}
              {ingresosFiltrados.length ===
              1
                ? "ingreso encontrado"
                : "ingresos encontrados"}
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
                  Nombre
                </TableCell>

                <TableCell>
                  Fuente
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
              {ingresosFiltrados.map(
                (ingreso) => (
                  <TableRow
                    key={ingreso.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        fontWeight={700}
                      >
                        {ingreso.nombre}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          ingreso.fuente ||
                          "Sin clasificar"
                        }
                      />
                    </TableCell>

                    <TableCell>
                      {ingreso.lugar}
                    </TableCell>

                    <TableCell>
                      {formatearDinero(
                        ingreso.monto
                      )}
                    </TableCell>

                    <TableCell>
                      {ingreso.frecuencia}
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={700}
                        color="success.main"
                      >
                        {formatearDinero(
                          calcularSemanal(
                            ingreso.monto,
                            ingreso.frecuencia
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
                          editarIngreso(
                            ingreso
                          )
                        }
                      >
                        Editar
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          eliminarIngreso(
                            ingreso
                          )
                        }
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}

              {ingresosFiltrados.length ===
                0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <Typography
                      color="text.secondary"
                    >
                      No encontramos
                      ingresos con esos
                      filtros.
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
        {ingresosFiltrados.map(
          (ingreso) => (
            <Card
              key={ingreso.id}
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
                    alignItems:
                      "flex-start",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={800}
                    >
                      {ingreso.nombre}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      fontSize={13}
                    >
                      {ingreso.lugar} ·{" "}
                      {ingreso.fuente ||
                        "Sin clasificar"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: "#10B981",
                    }}
                  >
                    {formatearDinero(
                      ingreso.monto
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
                      ingreso.frecuencia
                    }
                  />

                  <Chip
                    size="small"
                    label={
                      ingreso.fuente ||
                      "Sin clasificar"
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
                      color="success.main"
                    >
                      {formatearDinero(
                        calcularSemanal(
                          ingreso.monto,
                          ingreso.frecuencia
                        )
                      )}
                    </Typography>
                  </Box>

                  <Box>
                    <Button
                      size="small"
                      onClick={() =>
                        editarIngreso(
                          ingreso
                        )
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      onClick={() =>
                        eliminarIngreso(
                          ingreso
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

        {ingresosFiltrados.length ===
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