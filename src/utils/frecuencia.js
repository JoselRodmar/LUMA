export const calcularSemanal = (
  monto,
  frecuencia
) => {
  const cantidad =
    Number(monto) || 0;

  switch (frecuencia) {
    case "Semanal":
      return cantidad;

    case "Quincenal":
      return cantidad / 2;

    case "Mensual":
      return cantidad / 4.333;

    case "Bimestral":
      return cantidad / 8.666;

    case "Semestral":
      return cantidad / 26;

    case "Anual":
      return cantidad / 52;

    default:
      return cantidad;
  }
};

export const formatearDinero = (
  cantidad
) =>
  new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(cantidad) || 0
  );
