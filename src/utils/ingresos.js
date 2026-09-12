import {
  calcularSemanal,
} from "./frecuencia";

export const TIPOS_ORIGEN = [
  "Trabajo",
  "Negocio",
  "Renta",
  "Inversión",
  "Otro",
];

export const MODALIDADES_INGRESO = [
  "Fijo",
  "Variable por actividad",
  "Irregular",
];

export const FUENTES_INGRESO = [
  "Sueldo",
  "Honorarios",
  "Consultas / Servicios",
  "Ventas",
  "Comisiones",
  "Renta",
  "Dividendos / Rendimientos",
  "Transferencias / Apoyo",
  "Otros",
];

export const obtenerHoy = () => {
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

const convertirFecha = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const resultado =
    new Date(
      `${fecha}T12:00:00`
    );

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return null;
  }

  return resultado;
};

const inicioDeSemana = (
  fecha
) => {
  const resultado =
    new Date(fecha);

  resultado.setHours(
    12,
    0,
    0,
    0
  );

  /*
    Convertimos:
    lunes = 0
    martes = 1
    ...
    domingo = 6
  */

  const desplazamiento =
    (
      resultado.getDay() +
      6
    ) %
    7;

  resultado.setDate(
    resultado.getDate() -
      desplazamiento
  );

  return resultado;
};

const claveFecha = (
  fecha
) => {
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

export const obtenerSemanasHistorialIngreso = (
  ingresoId,
  movimientos = [],
  semanas = 8
) => {
  if (!ingresoId) {
    return [];
  }

  const hoy =
    new Date();

  hoy.setHours(
    12,
    0,
    0,
    0
  );

  const semanaActual =
    inicioDeSemana(hoy);

  const desde =
    new Date(
      semanaActual
    );

  desde.setDate(
    desde.getDate() -
      (semanas - 1) * 7
  );

  const acumulado =
    {};

  movimientos.forEach(
    (movimiento) => {
      if (
        movimiento.tipo !==
        "Ingreso"
      ) {
        return;
      }

      if (
        movimiento.ingresoId !==
        ingresoId
      ) {
        return;
      }

      const fecha =
        convertirFecha(
          movimiento.fecha
        );

      if (!fecha) {
        return;
      }

      if (
        fecha < desde ||
        fecha > hoy
      ) {
        return;
      }

      const semana =
        inicioDeSemana(
          fecha
        );

      const clave =
        claveFecha(
          semana
        );

      if (
        !acumulado[clave]
      ) {
        acumulado[clave] =
          {
            semana: clave,
            monto: 0,
            movimientos: 0,
          };
      }

      acumulado[
        clave
      ].monto +=
        Number(
          movimiento.monto ||
            0
        );

      acumulado[
        clave
      ].movimientos +=
        1;
    }
  );

  return Object.values(
    acumulado
  ).sort(
    (a, b) =>
      a.semana.localeCompare(
        b.semana
      )
  );
};

export const contarSemanasConHistorialIngreso = (
  ingresoId,
  movimientos = [],
  semanas = 8
) =>
  obtenerSemanasHistorialIngreso(
    ingresoId,
    movimientos,
    semanas
  ).length;

export const calcularPromedioSemanalReal = (
  ingresoId,
  movimientos = [],
  semanas = 8
) => {
  const historial =
    obtenerSemanasHistorialIngreso(
      ingresoId,
      movimientos,
      semanas
    );

  if (
    historial.length ===
    0
  ) {
    return 0;
  }

  const total =
    historial.reduce(
      (
        acumulado,
        semana
      ) =>
        acumulado +
        Number(
          semana.monto ||
            0
        ),
      0
    );

  return (
    total /
    historial.length
  );
};

export const calcularProyeccionSemanalIngreso = (
  ingreso,
  movimientos = []
) => {
  const modalidad =
    ingreso.modalidad ||
    "Fijo";

  if (
    modalidad === "Fijo"
  ) {
    return calcularSemanal(
      ingreso.monto,
      ingreso.frecuencia
    );
  }

  const promedioReal =
    calcularPromedioSemanalReal(
      ingreso.id,
      movimientos
    );

  /*
    Si ya existe historial real,
    esa información tiene prioridad.
  */

  if (promedioReal > 0) {
    return promedioReal;
  }

  /*
    Mientras un ingreso variable
    todavía no tenga historial usamos
    exclusivamente la estimación
    inicial del usuario.
  */

  if (
    modalidad ===
    "Variable por actividad"
  ) {
    return (
      Number(
        ingreso.valorUnidad ||
          0
      ) *
      Number(
        ingreso.unidadesEstimadasSemana ||
          0
      )
    );
  }

  /*
    Los ingresos irregulares sin
    historial no reciben una proyección
    inventada.
  */

  return 0;
};

export const calcularProyeccionMensualIngreso = (
  ingreso,
  movimientos = []
) =>
  calcularProyeccionSemanalIngreso(
    ingreso,
    movimientos
  ) * 4.333;

export const obtenerDescripcionModalidad = (
  ingreso
) => {
  const modalidad =
    ingreso.modalidad ||
    "Fijo";

  if (
    modalidad === "Fijo"
  ) {
    return (
      ingreso.frecuencia ||
      "Sin frecuencia"
    );
  }

  if (
    modalidad ===
    "Variable por actividad"
  ) {
    const unidad =
      ingreso.unidad ||
      "unidad";

    return `${formatearNumero(
      ingreso.valorUnidad
    )} por ${unidad}`;
  }

  return "Sin frecuencia fija";
};

const formatearNumero = (
  cantidad
) =>
  new Intl.NumberFormat(
    "es-MX",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      cantidad || 0
    )
  );