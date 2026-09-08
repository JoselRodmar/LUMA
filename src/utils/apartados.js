export const obtenerFechaLocal = (fecha) => {
  if (!fecha) return null;

  return new Date(`${fecha}T12:00:00`);
};

export const calcularDiasRestantes = (fechaVencimiento) => {
  const vencimiento =
    obtenerFechaLocal(fechaVencimiento);

  if (!vencimiento) return 0;

  const hoy = new Date();

  hoy.setHours(12, 0, 0, 0);

  const diferencia =
    vencimiento.getTime() -
    hoy.getTime();

  return Math.ceil(
    diferencia /
      (1000 * 60 * 60 * 24)
  );
};

export const calcularSemanasRestantes = (
  fechaVencimiento
) => {
  const dias =
    calcularDiasRestantes(
      fechaVencimiento
    );

  if (dias <= 0) {
    return 1;
  }

  return Math.max(
    1,
    Math.ceil(dias / 7)
  );
};

export const calcularPendienteApartado = (
  montoObjetivo,
  ahorrado
) => {
  return Math.max(
    0,
    Number(montoObjetivo || 0) -
      Number(ahorrado || 0)
  );
};

export const calcularApartadoSemanal = (
  montoObjetivo,
  ahorrado,
  fechaVencimiento
) => {
  const pendiente =
    calcularPendienteApartado(
      montoObjetivo,
      ahorrado
    );

  if (pendiente <= 0) {
    return 0;
  }

  const semanas =
    calcularSemanasRestantes(
      fechaVencimiento
    );

  return pendiente / semanas;
};

export const calcularPorcentajeApartado = (
  montoObjetivo,
  ahorrado
) => {
  const objetivo =
    Number(montoObjetivo || 0);

  if (objetivo <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (Number(ahorrado || 0) /
        objetivo) *
        100
    )
  );
};