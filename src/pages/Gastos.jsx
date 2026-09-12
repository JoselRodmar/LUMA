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
  calcularSemanal,
  formatearDinero,
} from "../utils/frecuencia";

import {
  construirEspacios,
  iconoEspacio,
  obtenerNombreEspacio,
} from "../utils/espacios";

const tiposGasto = [
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

const formularioInicial = {
  tipo: "Fijo",

  espacioId:
    "personal",

  categoria:
    "Vivienda",

  concepto: "",

  monto: "",

  frecuencia:
    "Mensual",
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
    origenes,
    setOrigenes,
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
    filtroEspacio,
    setFiltroEspacio,
  ] = useState("");

  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState("");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("");

  const cargarDatos =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          gastosSnapshot,
          perfilSnapshot,
        ] =
          await Promise.all([
            getDocs(
              userCollection(
                user.uid,
                "gastos"
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

        const listaGastos =
          gastosSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        const perfil =
          perfilSnapshot.exists()
            ? perfilSnapshot.data()
            : {};

        setGastos(
          listaGastos
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
          "No fue posible cargar tus gastos."
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
        formularioInicial
      );

      setEditandoId(null);
      setError("");
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

        const datos = {
          tipo:
            formulario.tipo,

          espacioId:
            espacioSeleccionado.id,

          espacioTipo:
            espacioSeleccionado.tipo,

          espacioNombre:
            espacioSeleccionado.nombre,

          /*
            Conservamos lugar por
            compatibilidad temporal
            con datos/componentes
            anteriores.
          */

          lugar:
            espacioSeleccionado.nombre,

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

        await cargarDatos();
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
    /*
      Los gastos antiguos todavía
      pueden tener Casa /
      Consultorio / Extras.

      Casa se migra visualmente a
      Personal / Hogar.

      Los demás necesitan que el
      usuario seleccione su nuevo
      espacio antes de guardar.
    */

    let espacioId =
      gasto.espacioId ||
      "";

    if (
      !espacioId &&
      gasto.lugar ===
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
            gasto.lugar
        );

      if (coincidencia) {
        espacioId =
          coincidencia.id;
      }
    }

    setFormulario({
      tipo:
        gasto.tipo ||
        "Fijo",

      espacioId,

      categoria:
        gasto.categoria ||
        "Otros",

      concepto:
        gasto.concepto ||
        "",

      monto:
        gasto.monto ??
        "",

      frecuencia:
        gasto.frecuencia ||
        "Mensual",
    });

    setEditandoId(
      gasto.id
    );

    setError("");

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

        await cargarDatos();
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
          const nombreEspacio =
            obtenerNombreEspacio(
              gasto
            );

          const coincideTexto =
            !texto ||
            (
              gasto.concepto ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            (
              gasto.categoria ||
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            nombreEspacio
              .toLowerCase()
              .includes(texto);

          const espacioRegistro =
            gasto.espacioId ||
            (
              gasto.lugar ===
              "Casa"
                ? "personal"
                : ""
            );

          const coincideEspacio =
            !filtroEspacio ||
            espacioRegistro ===
              filtroEspacio;

          const coincideTipo =
            !filtroTipo ||
            gasto.tipo ===
              filtroTipo;

          const coincideCategoria =
            !filtroCategoria ||
            gasto.categoria ===
              filtroCategoria;

          return (
            coincideTexto &&
            coincideEspacio &&
            coincideTipo &&
            coincideCategoria
          );
        }
      );
    }, [
      gastos,
      busqueda,
      filtroEspacio,
      filtroTipo,
      filtroCategoria,
    ]);

  const resumen =
    useMemo(() => {
      let totalSemanal = 0;
      let fijos = 0;
      let variables = 0;

      gastos.forEach(
        (gasto) => {
          const semanal =
            calcularSemanal(
              gasto.monto,
              gasto.frecuencia
            );

          totalSemanal +=
            semanal;

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
        semanal:
          totalSemanal,

        mensual:
          totalSemanal *
          4.333,

        fijos,

        variables,
      };
    }, [gastos]);

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
      <Typography
        sx={{
          fontSize: {
            xs: 29,
            md: 34,
          },

          fontWeight: 900,
        }}
      >
        Gastos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Organiza tus gastos personales
        y los de cada trabajo, negocio
        o fuente financiera.
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
        <ResumenCard
          titulo="Planeado semanal"
          valor={
            resumen.semanal
          }
          icono="📅"
        />

        <ResumenCard
          titulo="Planeado mensual"
          valor={
            resumen.mensual
          }
          icono="🗓️"
        />

        <ResumenCard
          titulo="Gastos fijos"
          valor={
            resumen.fijos
          }
          icono="📌"
        />

        <ResumenCard
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
              ? "Editar gasto"
              : "Nuevo gasto"}
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{
              mt: 0.5,
              mb: 3,
            }}
          >
            Selecciona a qué parte de
            tus finanzas pertenece.
          </Typography>

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
                  md:
                    "repeat(2, 1fr)",
                  xl:
                    "repeat(3, 1fr)",
                },

                gap: 2,
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

              <FormControl>
                <InputLabel>
                  Tipo
                </InputLabel>

                <Select
                  label="Tipo"
                  value={
                    formulario.tipo
                  }
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "tipo",
                      event.target.value
                    )
                  }
                >
                  {tiposGasto.map(
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
                    manejarCambio(
                      "categoria",
                      event.target.value
                    )
                  }
                >
                  {categorias.map(
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
                  manejarCambio(
                    "concepto",
                    event.target.value
                  )
                }
                placeholder="Ej. Internet, renta del local..."
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
              />

              <FormControl>
                <InputLabel>
                  Frecuencia
                </InputLabel>

                <Select
                  label="Frecuencia"
                  value={
                    formulario.frecuencia
                  }
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
                        key={
                          frecuencia
                        }
                        value={
                          frecuencia
                        }
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
                flexWrap: "wrap",
                gap: 1.5,
                mt: 3,
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
            md:
              "2fr 1fr 1fr 1fr",
          },

          gap: 1.5,
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
        />

        <FormControl>
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

            {tiposGasto.map(
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

            {categorias.map(
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
        {gastosFiltrados.map(
          (gasto) => (
            <GastoCard
              key={gasto.id}
              gasto={gasto}
              onEditar={() =>
                editarGasto(
                  gasto
                )
              }
              onEliminar={() =>
                eliminarGasto(
                  gasto
                )
              }
            />
          )
        )}

        {gastosFiltrados.length ===
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
                fontSize={34}
              >
                🧾
              </Typography>

              <Typography
                fontWeight={900}
                fontSize={19}
                sx={{ mt: 1 }}
              >
                No hay gastos
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Agrega tu primer gasto
                planeado.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function GastoCard({
  gasto,
  onEditar,
  onEliminar,
}) {
  const nombre =
    obtenerNombreEspacio(
      gasto
    );

  const esAnterior =
    !gasto.espacioId;

  const semanal =
    calcularSemanal(
      gasto.monto,
      gasto.frecuencia
    );

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
              {gasto.concepto}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
            >
              {nombre}
            </Typography>
          </Box>

          <Typography
            fontSize={26}
          >
            {iconoEspacio(
              gasto.espacioTipo ||
              (
                gasto.lugar ===
                "Casa"
                  ? "Personal"
                  : ""
              )
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 2,
          }}
        >
          <Chip
            size="small"
            label={
              gasto.tipo ||
              "Sin tipo"
            }
          />

          <Chip
            size="small"
            label={
              gasto.categoria ||
              "Otros"
            }
          />

          {esAnterior && (
            <Chip
              size="small"
              color="warning"
              label="Actualizar espacio"
            />
          )}
        </Box>

        <Box
          sx={{
            mt: 3,

            display: "grid",

            gridTemplateColumns:
              "repeat(2, 1fr)",

            gap: 2,
          }}
        >
          <Dato
            titulo="Monto"
            valor={formatearDinero(
              gasto.monto
            )}
            detalle={
              gasto.frecuencia
            }
          />

          <Dato
            titulo="Equivalente semanal"
            valor={formatearDinero(
              semanal
            )}
          />
        </Box>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            size="small"
            onClick={onEditar}
          >
            Editar
          </Button>

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
  detalle,
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
        fontSize={18}
      >
        {valor}
      </Typography>

      {detalle && (
        <Typography
          color="text.secondary"
          fontSize={11}
        >
          {detalle}
        </Typography>
      )}
    </Box>
  );
}