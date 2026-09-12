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
  setDoc,
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
  Divider,
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
  MODALIDADES_INGRESO,
  TIPOS_ORIGEN,
  calcularPromedioSemanalReal,
  calcularProyeccionMensualIngreso,
  calcularProyeccionSemanalIngreso,
  obtenerHoy,
} from "../utils/ingresos";

const frecuencias = [
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bimestral",
  "Semestral",
  "Anual",
];

const formularioInicial = {
  origenId: "",
  fuente: "Sueldo",
  nombre: "",
  modalidad: "Fijo",

  monto: "",
  frecuencia: "Mensual",

  unidad: "Consulta",
  valorUnidad: "",
  unidadesEstimadasSemana:
    "",
};

const crearIdOrigen =
  () => {
    if (
      typeof crypto !==
        "undefined" &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
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
    filtroOrigen,
    setFiltroOrigen,
  ] = useState("");

  const [
    filtroModalidad,
    setFiltroModalidad,
  ] = useState("");

  /*
    NUEVO ORIGEN
  */

  const [
    dialogoOrigen,
    setDialogoOrigen,
  ] = useState(false);

  const [
    tipoNuevoOrigen,
    setTipoNuevoOrigen,
  ] = useState(
    "Trabajo"
  );

  const [
    nombreNuevoOrigen,
    setNombreNuevoOrigen,
  ] = useState("");

  const [
    guardandoOrigen,
    setGuardandoOrigen,
  ] = useState(false);

  /*
    REGISTRO REAL
  */

  const [
    ingresoRegistro,
    setIngresoRegistro,
  ] = useState(null);

  const [
    fechaRegistro,
    setFechaRegistro,
  ] = useState(
    obtenerHoy()
  );

  const [
    cantidadUnidades,
    setCantidadUnidades,
  ] = useState("");

  const [
    valorUnidadReal,
    setValorUnidadReal,
  ] = useState("");

  const [
    montoReal,
    setMontoReal,
  ] = useState("");

  const [
    registrandoReal,
    setRegistrandoReal,
  ] = useState(false);

  const cargarDatos =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          ingresosSnapshot,
          movimientosSnapshot,
          perfilSnapshot,
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

        const listaIngresos =
          ingresosSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        const listaMovimientos =
          movimientosSnapshot.docs.map(
            (documento) => ({
              id: documento.id,
              ...documento.data(),
            })
          );

        const datosPerfil =
          perfilSnapshot.exists()
            ? perfilSnapshot.data()
            : {};

        const listaOrigenes =
          Array.isArray(
            datosPerfil.origenesIngreso
          )
            ? datosPerfil.origenesIngreso
            : [];

        listaOrigenes.sort(
          (a, b) =>
            `${a.tipo}${a.nombre}`.localeCompare(
              `${b.tipo}${b.nombre}`,
              "es"
            )
        );

        setIngresos(
          listaIngresos
        );

        setMovimientos(
          listaMovimientos
        );

        setOrigenes(
          listaOrigenes
        );

        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible cargar tus ingresos."
        );
      } finally {
        setLoading(false);
      }
    }, [user.uid]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

  /*
    ======================================
    ORÍGENES
    ======================================
  */

  const guardarOrigen =
    async () => {
      const nombre =
        nombreNuevoOrigen.trim();

      if (!nombre) {
        setError(
          "Escribe el nombre del origen."
        );

        return;
      }

      const duplicado =
        origenes.some(
          (origen) =>
            origen.nombre
              .trim()
              .toLowerCase() ===
              nombre.toLowerCase() &&
            origen.tipo ===
              tipoNuevoOrigen
        );

      if (duplicado) {
        setError(
          "Ya existe un origen con ese nombre."
        );

        return;
      }

      try {
        setGuardandoOrigen(
          true
        );

        setError("");

        const nuevoOrigen = {
          id:
            crearIdOrigen(),

          tipo:
            tipoNuevoOrigen,

          nombre,
        };

        const nuevosOrigenes =
          [
            ...origenes,
            nuevoOrigen,
          ];

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            origenesIngreso:
              nuevosOrigenes,

            perfilActualizado:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setOrigenes(
          nuevosOrigenes
        );

        setFormulario(
          (anterior) => ({
            ...anterior,

            origenId:
              nuevoOrigen.id,
          })
        );

        setNombreNuevoOrigen(
          ""
        );

        setTipoNuevoOrigen(
          "Trabajo"
        );

        setDialogoOrigen(
          false
        );
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible crear el origen."
        );
      } finally {
        setGuardandoOrigen(
          false
        );
      }
    };

  const eliminarOrigen =
    async (origen) => {
      const enUso =
        ingresos.some(
          (ingreso) =>
            ingreso.origenId ===
            origen.id
        );

      if (enUso) {
        window.alert(
          "Este origen está siendo utilizado por una o más fuentes de ingreso. Cambia primero esas fuentes antes de eliminarlo."
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Eliminar "${origen.nombre}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        const nuevosOrigenes =
          origenes.filter(
            (item) =>
              item.id !==
              origen.id
          );

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            origenesIngreso:
              nuevosOrigenes,

            perfilActualizado:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        setOrigenes(
          nuevosOrigenes
        );
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el origen."
        );
      }
    };

  /*
    ======================================
    FUENTES DE INGRESO
    ======================================
  */

  const guardarIngreso =
    async (event) => {
      event.preventDefault();

      const nombre =
        formulario.nombre.trim();

      if (
        !formulario.origenId
      ) {
        setError(
          "Selecciona o crea un origen de ingreso."
        );

        return;
      }

      if (!nombre) {
        setError(
          "Escribe el nombre del ingreso."
        );

        return;
      }

      const origen =
        origenSeleccionado;

      if (!origen) {
        setError(
          "El origen seleccionado no es válido."
        );

        return;
      }

      if (
        formulario.modalidad ===
        "Fijo"
      ) {
        const monto =
          Number(
            formulario.monto
          );

        if (
          !monto ||
          monto <= 0
        ) {
          setError(
            "Ingresa un monto válido."
          );

          return;
        }
      }

      if (
        formulario.modalidad ===
        "Variable por actividad"
      ) {
        const valor =
          Number(
            formulario.valorUnidad
          );

        if (
          !formulario.unidad.trim()
        ) {
          setError(
            "Escribe el nombre de la unidad, por ejemplo Consulta, Venta u Hora."
          );

          return;
        }

        if (
          !valor ||
          valor <= 0
        ) {
          setError(
            "Ingresa un valor válido por unidad."
          );

          return;
        }
      }

      try {
        setGuardando(true);
        setError("");

        const datosBase = {
          origenId:
            origen.id,

          origenTipo:
            origen.tipo,

          origenNombre:
            origen.nombre,

          fuente:
            formulario.fuente,

          nombre,

          modalidad:
            formulario.modalidad,

          updatedAt:
            serverTimestamp(),
        };

        let datosModalidad =
          {};

        if (
          formulario.modalidad ===
          "Fijo"
        ) {
          datosModalidad = {
            monto:
              Number(
                formulario.monto
              ),

            frecuencia:
              formulario.frecuencia,
          };
        }

        if (
          formulario.modalidad ===
          "Variable por actividad"
        ) {
          datosModalidad = {
            unidad:
              formulario.unidad.trim(),

            valorUnidad:
              Number(
                formulario.valorUnidad
              ),

            unidadesEstimadasSemana:
              Number(
                formulario.unidadesEstimadasSemana ||
                  0
              ),
          };
        }

        const datos = {
          ...datosBase,
          ...datosModalidad,
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

        await cargarDatos();
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
      origenId:
        ingreso.origenId ||
        "",

      fuente:
        ingreso.fuente ||
        "Otros",

      nombre:
        ingreso.nombre ||
        "",

      modalidad:
        ingreso.modalidad ||
        "Fijo",

      monto:
        ingreso.monto ??
        "",

      frecuencia:
        ingreso.frecuencia ||
        "Mensual",

      unidad:
        ingreso.unidad ||
        "Consulta",

      valorUnidad:
        ingreso.valorUnidad ??
        "",

      unidadesEstimadasSemana:
        ingreso.unidadesEstimadasSemana ??
        "",
    });

    setEditandoId(
      ingreso.id
    );

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarIngreso =
    async (ingreso) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${ingreso.nombre}"? Los movimientos reales ya registrados no serán eliminados.`
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

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible eliminar el ingreso."
        );
      }
    };

  /*
    ======================================
    REGISTRO DE INGRESO REAL
    ======================================
  */

  const abrirRegistroReal =
    (ingreso) => {
      setIngresoRegistro(
        ingreso
      );

      setFechaRegistro(
        obtenerHoy()
      );

      setCantidadUnidades(
        ""
      );

      setValorUnidadReal(
        ingreso.valorUnidad ??
          ""
      );

      if (
        (ingreso.modalidad ||
          "Fijo") ===
        "Fijo"
      ) {
        setMontoReal(
          ingreso.monto ??
            ""
        );
      } else {
        setMontoReal("");
      }
    };

  const cerrarRegistroReal =
    () => {
      if (
        registrandoReal
      ) {
        return;
      }

      setIngresoRegistro(
        null
      );

      setCantidadUnidades(
        ""
      );

      setMontoReal("");
    };

  const totalVariable =
    useMemo(() => {
      return (
        Number(
          cantidadUnidades ||
            0
        ) *
        Number(
          valorUnidadReal ||
            0
        )
      );
    }, [
      cantidadUnidades,
      valorUnidadReal,
    ]);

  const guardarIngresoReal =
    async () => {
      if (
        !ingresoRegistro
      ) {
        return;
      }

      if (!fechaRegistro) {
        setError(
          "Selecciona la fecha del ingreso."
        );

        return;
      }

      const modalidad =
        ingresoRegistro.modalidad ||
        "Fijo";

      let total = 0;

      if (
        modalidad ===
        "Variable por actividad"
      ) {
        if (
          Number(
            cantidadUnidades
          ) <= 0
        ) {
          setError(
            "Ingresa la cantidad de unidades realizadas."
          );

          return;
        }

        if (
          Number(
            valorUnidadReal
          ) <= 0
        ) {
          setError(
            "Ingresa un valor válido por unidad."
          );

          return;
        }

        total =
          totalVariable;
      } else {
        total =
          Number(
            montoReal
          );

        if (
          !total ||
          total <= 0
        ) {
          setError(
            "Ingresa el monto realmente recibido."
          );

          return;
        }
      }

      try {
        setRegistrandoReal(
          true
        );

        setError("");

        await addDoc(
          userCollection(
            user.uid,
            "movimientos"
          ),
          {
            tipo:
              "Ingreso",

            fecha:
              fechaRegistro,

            /*
              Dejamos lugar temporalmente
              para mantener compatibilidad
              con Movimientos actual.

              En la segunda etapa
              eliminaremos esta dependencia.
            */

            lugar:
              ingresoRegistro.origenNombre ||
              ingresoRegistro.lugar ||
              "Otros",

            origenId:
              ingresoRegistro.origenId ||
              null,

            origenTipo:
              ingresoRegistro.origenTipo ||
              "Otro",

            origenNombre:
              ingresoRegistro.origenNombre ||
              ingresoRegistro.lugar ||
              "Otros",

            categoria:
              ingresoRegistro.fuente ||
              "Otros",

            concepto:
              ingresoRegistro.nombre,

            monto:
              total,

            ingresoId:
              ingresoRegistro.id,

            modalidadIngreso:
              modalidad,

            ...(modalidad ===
            "Variable por actividad"
              ? {
                  unidad:
                    ingresoRegistro.unidad ||
                    "Unidad",

                  cantidadUnidades:
                    Number(
                      cantidadUnidades
                    ),

                  valorUnidad:
                    Number(
                      valorUnidadReal
                    ),
                }
              : {}),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        cerrarRegistroReal();

        await cargarDatos();
      } catch (err) {
        console.error(err);

        setError(
          "No fue posible registrar el ingreso real."
        );
      } finally {
        setRegistrandoReal(
          false
        );
      }
    };

  /*
    ======================================
    FILTROS Y RESUMEN
    ======================================
  */

  const ingresosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return ingresos.filter(
        (ingreso) => {
          const origen =
            ingreso.origenNombre ||
            ingreso.lugar ||
            "";

          const nombre =
            ingreso.nombre ||
            "";

          const fuente =
            ingreso.fuente ||
            "";

          const coincideTexto =
            !texto ||
            nombre
              .toLowerCase()
              .includes(texto) ||
            origen
              .toLowerCase()
              .includes(texto) ||
            fuente
              .toLowerCase()
              .includes(texto);

          const coincideOrigen =
            !filtroOrigen ||
            ingreso.origenId ===
              filtroOrigen;

          const modalidad =
            ingreso.modalidad ||
            "Fijo";

          const coincideModalidad =
            !filtroModalidad ||
            modalidad ===
              filtroModalidad;

          return (
            coincideTexto &&
            coincideOrigen &&
            coincideModalidad
          );
        }
      );
    }, [
      ingresos,
      busqueda,
      filtroOrigen,
      filtroModalidad,
    ]);

  const resumen =
    useMemo(() => {
      let semanal = 0;
      let mensual = 0;
      let fijos = 0;
      let variables = 0;
      let irregulares = 0;

      ingresos.forEach(
        (ingreso) => {
          semanal +=
            calcularProyeccionSemanalIngreso(
              ingreso,
              movimientos
            );

          mensual +=
            calcularProyeccionMensualIngreso(
              ingreso,
              movimientos
            );

          const modalidad =
            ingreso.modalidad ||
            "Fijo";

          if (
            modalidad ===
            "Fijo"
          ) {
            fijos += 1;
          } else if (
            modalidad ===
            "Variable por actividad"
          ) {
            variables += 1;
          } else {
            irregulares += 1;
          }
        }
      );

      return {
        semanal,
        mensual,
        fijos,
        variables,
        irregulares,
      };
    }, [
      ingresos,
      movimientos,
    ]);

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
        sx={{
          mt: 0.5,
          mb: 3,
        }}
      >
        Define de dónde viene tu
        dinero y registra lo que
        realmente recibes.
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

      {/* RESUMEN */}

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
          titulo="Proyección semanal"
          valor={formatearDinero(
            resumen.semanal
          )}
          icono="📅"
        />

        <Resumen
          titulo="Proyección mensual"
          valor={formatearDinero(
            resumen.mensual
          )}
          icono="📈"
        />

        <Resumen
          titulo="Ingresos fijos"
          valor={
            resumen.fijos
          }
          icono="💼"
          dinero={false}
        />

        <Resumen
          titulo="Variables / irregulares"
          valor={
            resumen.variables +
            resumen.irregulares
          }
          icono="🔄"
          dinero={false}
        />
      </Box>

      {/* ORÍGENES */}

      <Card
        sx={{
          borderRadius: "24px",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                fontWeight={900}
                fontSize={20}
              >
                Tus orígenes de ingreso
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
                sx={{ mt: 0.5 }}
              >
                Puedes tener varios
                trabajos, negocios,
                rentas u otras fuentes.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() =>
                setDialogoOrigen(
                  true
                )
              }
            >
              + Agregar origen
            </Button>
          </Box>

          {origenes.length >
          0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.2,
                mt: 3,
              }}
            >
              {origenes.map(
                (origen) => (
                  <Chip
                    key={
                      origen.id
                    }
                    label={`${iconoOrigen(
                      origen.tipo
                    )} ${
                      origen.tipo
                    } · ${
                      origen.nombre
                    }`}
                    onDelete={() =>
                      eliminarOrigen(
                        origen
                      )
                    }
                    sx={{
                      px: 0.7,
                    }}
                  />
                )
              )}
            </Box>
          ) : (
            <Box
              sx={{
                mt: 3,
                p: 3,
                textAlign: "center",
                backgroundColor:
                  "#F7F6FF",
                borderRadius: "18px",
              }}
            >
              <Typography
                fontWeight={800}
              >
                Primero crea de dónde
                proviene tu dinero
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
                sx={{ mt: 0.5 }}
              >
                Por ejemplo: Trabajo ·
                Empresa ABC, Negocio ·
                Consultorio o Renta ·
                Departamento Centro.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* NUEVA FUENTE */}

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
              ? "Editar fuente de ingreso"
              : "Nueva fuente de ingreso"}
          </Typography>

          <Box
            component="form"
            onSubmit={
              guardarIngreso
            }
            sx={{
              mt: 3,
            }}
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
              <FormControl fullWidth>
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
                    manejarCambio(
                      "origenId",
                      event.target.value
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
              />

              <FormControl fullWidth>
                <InputLabel>
                  Fuente
                </InputLabel>

                <Select
                  label="Fuente"
                  value={
                    formulario.fuente
                  }
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "fuente",
                      event.target.value
                    )
                  }
                >
                  {FUENTES_INGRESO.map(
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

              <FormControl fullWidth>
                <InputLabel>
                  Tipo de ingreso
                </InputLabel>

                <Select
                  label="Tipo de ingreso"
                  value={
                    formulario.modalidad
                  }
                  onChange={(
                    event
                  ) =>
                    manejarCambio(
                      "modalidad",
                      event.target.value
                    )
                  }
                >
                  {MODALIDADES_INGRESO.map(
                    (modalidad) => (
                      <MenuItem
                        key={
                          modalidad
                        }
                        value={
                          modalidad
                        }
                      >
                        {modalidad}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              {formulario.modalidad ===
                "Fijo" && (
                <>
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

                  <FormControl fullWidth>
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
                        (
                          frecuencia
                        ) => (
                          <MenuItem
                            key={
                              frecuencia
                            }
                            value={
                              frecuencia
                            }
                          >
                            {
                              frecuencia
                            }
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </>
              )}

              {formulario.modalidad ===
                "Variable por actividad" && (
                <>
                  <TextField
                    label="Nombre de la unidad"
                    value={
                      formulario.unidad
                    }
                    onChange={(
                      event
                    ) =>
                      manejarCambio(
                        "unidad",
                        event.target.value
                      )
                    }
                    placeholder="Consulta, venta, hora..."
                  />

                  <TextField
                    label="Valor por unidad"
                    type="number"
                    value={
                      formulario.valorUnidad
                    }
                    onChange={(
                      event
                    ) =>
                      manejarCambio(
                        "valorUnidad",
                        event.target.value
                      )
                    }
                  />

                  <TextField
                    label="Estimación semanal inicial"
                    type="number"
                    value={
                      formulario.unidadesEstimadasSemana
                    }
                    onChange={(
                      event
                    ) =>
                      manejarCambio(
                        "unidadesEstimadasSemana",
                        event.target.value
                      )
                    }
                    helperText="Opcional. LUMA reemplazará esta estimación por tu promedio real cuando exista historial."
                  />
                </>
              )}
            </Box>

            {formulario.modalidad ===
              "Irregular" && (
              <Alert
                severity="info"
                sx={{
                  mt: 2,
                  borderRadius: "16px",
                }}
              >
                No necesitamos inventar
                un monto recurrente. LUMA
                construirá una referencia
                a partir de tus ingresos
                reales registrados.
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
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
                    : "Crear fuente"}
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

      {/* FILTROS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md:
              "2fr 1fr 1fr",
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
          placeholder="Consulta, sueldo, negocio..."
        />

        <FormControl>
          <InputLabel>
            Origen
          </InputLabel>

          <Select
            label="Origen"
            value={
              filtroOrigen
            }
            onChange={(
              event
            ) =>
              setFiltroOrigen(
                event.target.value
              )
            }
          >
            <MenuItem value="">
              Todos
            </MenuItem>

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

        <FormControl>
          <InputLabel>
            Modalidad
          </InputLabel>

          <Select
            label="Modalidad"
            value={
              filtroModalidad
            }
            onChange={(
              event
            ) =>
              setFiltroModalidad(
                event.target.value
              )
            }
          >
            <MenuItem value="">
              Todas
            </MenuItem>

            {MODALIDADES_INGRESO.map(
              (modalidad) => (
                <MenuItem
                  key={
                    modalidad
                  }
                  value={
                    modalidad
                  }
                >
                  {modalidad}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>

      {/* FUENTES */}

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
        {ingresosFiltrados.map(
          (ingreso) => (
            <IngresoCard
              key={ingreso.id}
              ingreso={ingreso}
              movimientos={
                movimientos
              }
              onEditar={() =>
                editarIngreso(
                  ingreso
                )
              }
              onEliminar={() =>
                eliminarIngreso(
                  ingreso
                )
              }
              onRegistrar={() =>
                abrirRegistroReal(
                  ingreso
                )
              }
            />
          )
        )}

        {ingresosFiltrados.length ===
          0 && (
          <Card
            sx={{
              borderRadius: "24px",
              gridColumn: "1 / -1",
            }}
          >
            <CardContent
              sx={{
                py: 6,
                textAlign: "center",
              }}
            >
              <Typography
                fontSize={32}
              >
                💰
              </Typography>

              <Typography
                fontWeight={900}
                fontSize={19}
                sx={{ mt: 1 }}
              >
                No hay fuentes de ingreso
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={13}
                sx={{ mt: 0.5 }}
              >
                Crea tu primer origen y
                después agrega una fuente
                de ingreso.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* DIALOG ORIGEN */}

      <Dialog
        open={dialogoOrigen}
        onClose={() =>
          setDialogoOrigen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Agregar origen
        </DialogTitle>

        <DialogContent>
          <Typography
            color="text.secondary"
            fontSize={13}
            sx={{ mb: 3 }}
          >
            Un origen identifica de
            dónde proviene el dinero.
          </Typography>

          <FormControl
            fullWidth
            sx={{ mb: 2 }}
          >
            <InputLabel>
              Tipo
            </InputLabel>

            <Select
              label="Tipo"
              value={
                tipoNuevoOrigen
              }
              onChange={(
                event
              ) =>
                setTipoNuevoOrigen(
                  event.target.value
                )
              }
            >
              {TIPOS_ORIGEN.map(
                (tipo) => (
                  <MenuItem
                    key={tipo}
                    value={tipo}
                  >
                    {iconoOrigen(
                      tipo
                    )}{" "}
                    {tipo}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={
              etiquetaOrigen(
                tipoNuevoOrigen
              )
            }
            value={
              nombreNuevoOrigen
            }
            onChange={(
              event
            ) =>
              setNombreNuevoOrigen(
                event.target.value
              )
            }
            placeholder={
              ejemploOrigen(
                tipoNuevoOrigen
              )
            }
          />
        </DialogContent>

        <DialogActions
          sx={{ p: 3 }}
        >
          <Button
            onClick={() =>
              setDialogoOrigen(
                false
              )
            }
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={
              guardarOrigen
            }
            disabled={
              guardandoOrigen
            }
          >
            {guardandoOrigen
              ? "Guardando..."
              : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG REGISTRO REAL */}

      <Dialog
        open={
          Boolean(
            ingresoRegistro
          )
        }
        onClose={
          cerrarRegistroReal
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Registrar ingreso real
        </DialogTitle>

        {ingresoRegistro && (
          <>
            <DialogContent>
              <Box
                sx={{
                  p: 2,
                  backgroundColor:
                    "#F7F6FF",
                  borderRadius: "16px",
                  mb: 3,
                }}
              >
                <Typography
                  fontWeight={900}
                >
                  {
                    ingresoRegistro.nombre
                  }
                </Typography>

                <Typography
                  color="text.secondary"
                  fontSize={13}
                >
                  {ingresoRegistro.origenNombre ||
                    ingresoRegistro.lugar ||
                    "Origen anterior"}
                  {" · "}
                  {ingresoRegistro.modalidad ||
                    "Fijo"}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={
                  fechaRegistro
                }
                onChange={(
                  event
                ) =>
                  setFechaRegistro(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />

              {(ingresoRegistro.modalidad ||
                "Fijo") ===
              "Variable por actividad" ? (
                <>
                  <TextField
                    fullWidth
                    label={`Cantidad de ${
                      ingresoRegistro.unidad ||
                      "unidades"
                    }`}
                    type="number"
                    value={
                      cantidadUnidades
                    }
                    onChange={(
                      event
                    ) =>
                      setCantidadUnidades(
                        event.target.value
                      )
                    }
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label={`Valor por ${
                      ingresoRegistro.unidad ||
                      "unidad"
                    }`}
                    type="number"
                    value={
                      valorUnidadReal
                    }
                    onChange={(
                      event
                    ) =>
                      setValorUnidadReal(
                        event.target.value
                      )
                    }
                  />

                  <Box
                    sx={{
                      mt: 3,
                      p: 2.5,
                      borderRadius: "18px",
                      backgroundColor:
                        "#ECFDF5",
                    }}
                  >
                    <Typography
                      color="text.secondary"
                      fontSize={12}
                    >
                      INGRESO GENERADO
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 28,
                        color: "#10B981",
                      }}
                    >
                      {formatearDinero(
                        totalVariable
                      )}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      fontSize={12}
                    >
                      {Number(
                        cantidadUnidades ||
                          0
                      )}{" "}
                      ×{" "}
                      {formatearDinero(
                        Number(
                          valorUnidadReal ||
                            0
                        )
                      )}
                    </Typography>
                  </Box>
                </>
              ) : (
                <TextField
                  fullWidth
                  label="Monto realmente recibido"
                  type="number"
                  value={
                    montoReal
                  }
                  onChange={(
                    event
                  ) =>
                    setMontoReal(
                      event.target.value
                    )
                  }
                />
              )}

              <Alert
                severity="info"
                sx={{
                  mt: 3,
                  borderRadius: "16px",
                }}
              >
                Este registro se
                guardará automáticamente
                como un movimiento real.
                No tendrás que capturarlo
                nuevamente.
              </Alert>
            </DialogContent>

            <DialogActions
              sx={{ p: 3 }}
            >
              <Button
                onClick={
                  cerrarRegistroReal
                }
                disabled={
                  registrandoReal
                }
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                onClick={
                  guardarIngresoReal
                }
                disabled={
                  registrandoReal
                }
              >
                {registrandoReal
                  ? "Registrando..."
                  : "Registrar ingreso"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

function IngresoCard({
  ingreso,
  movimientos,
  onEditar,
  onEliminar,
  onRegistrar,
}) {
  const modalidad =
    ingreso.modalidad ||
    "Fijo";

  const semanal =
    calcularProyeccionSemanalIngreso(
      ingreso,
      movimientos
    );

  const mensual =
    calcularProyeccionMensualIngreso(
      ingreso,
      movimientos
    );

  const promedioReal =
    calcularPromedioSemanalReal(
      ingreso.id,
      movimientos
    );

  const legacy =
    !ingreso.origenId;

  return (
    <Card
      sx={{
        borderRadius: "24px",
        border:
          legacy
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
            alignItems:
              "flex-start",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              fontWeight={900}
              fontSize={20}
            >
              {ingreso.nombre}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              sx={{ mt: 0.3 }}
            >
              {ingreso.origenTipo ||
                "Origen anterior"}
              {" · "}
              {ingreso.origenNombre ||
                ingreso.lugar ||
                "Sin origen"}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 26,
            }}
          >
            {iconoOrigen(
              ingreso.origenTipo
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
            label={modalidad}
            color={
              modalidad ===
              "Fijo"
                ? "success"
                : modalidad ===
                    "Variable por actividad"
                  ? "primary"
                  : "warning"
            }
            variant="outlined"
          />

          <Chip
            size="small"
            label={
              ingreso.fuente ||
              "Sin clasificar"
            }
          />

          {legacy && (
            <Chip
              size="small"
              label="Actualizar origen"
              color="warning"
            />
          )}
        </Box>

        {modalidad ===
          "Variable por actividad" && (
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: "16px",
              backgroundColor:
                "#F7F6FF",
            }}
          >
            <Typography
              fontWeight={800}
            >
              {formatearDinero(
                ingreso.valorUnidad ||
                  0
              )}{" "}
              por{" "}
              {ingreso.unidad ||
                "unidad"}
            </Typography>

            {Number(
              ingreso.unidadesEstimadasSemana ||
                0
            ) > 0 &&
              promedioReal ===
                0 && (
                <Typography
                  color="text.secondary"
                  fontSize={12}
                >
                  Estimación inicial:{" "}
                  {
                    ingreso.unidadesEstimadasSemana
                  }{" "}
                  por semana
                </Typography>
              )}
          </Box>
        )}

        <Divider
          sx={{ my: 2.5 }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, 1fr)",
            gap: 2,
          }}
        >
          <Dato
            titulo={
              promedioReal > 0
                ? "Promedio real semanal"
                : "Proyección semanal"
            }
            valor={formatearDinero(
              semanal
            )}
          />

          <Dato
            titulo="Proyección mensual"
            valor={formatearDinero(
              mensual
            )}
          />
        </Box>

        {promedioReal >
          0 && (
          <Typography
            color="text.secondary"
            fontSize={11}
            sx={{ mt: 1 }}
          >
            La proyección utiliza el
            promedio registrado durante
            las últimas 8 semanas.
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 3,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={
              onRegistrar
            }
          >
            + Registrar ingreso real
          </Button>

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

function Resumen({
  titulo,
  valor,
  icono,
  dinero = true,
}) {
  return (
    <Card
      sx={{
        borderRadius: "20px",
      }}
    >
      <CardContent>
        <Typography
          sx={{ fontSize: 23 }}
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
          }}
        >
          {valor}
        </Typography>

        {!dinero && (
          <Typography
            color="text.secondary"
            fontSize={11}
          >
            fuentes configuradas
          </Typography>
        )}
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
        fontSize={18}
      >
        {valor}
      </Typography>
    </Box>
  );
}

function iconoOrigen(
  tipo
) {
  switch (tipo) {
    case "Trabajo":
      return "💼";

    case "Negocio":
      return "🏪";

    case "Renta":
      return "🏠";

    case "Inversión":
      return "📈";

    default:
      return "➕";
  }
}

function etiquetaOrigen(
  tipo
) {
  switch (tipo) {
    case "Trabajo":
      return "Trabajo / empresa";

    case "Negocio":
      return "Nombre del negocio";

    case "Renta":
      return "Propiedad / renta";

    case "Inversión":
      return "Nombre de la inversión";

    default:
      return "Nombre del origen";
  }
}

function ejemploOrigen(
  tipo
) {
  switch (tipo) {
    case "Trabajo":
      return "Ej. Empresa ABC";

    case "Negocio":
      return "Ej. Consultorio";

    case "Renta":
      return "Ej. Departamento Centro";

    case "Inversión":
      return "Ej. Portafolio principal";

    default:
      return "Ej. Otros ingresos";
  }
}