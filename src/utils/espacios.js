export const ESPACIO_PERSONAL = {
  id: "personal",
  tipo: "Personal",
  nombre: "Personal / Hogar",
  permanente: true,
};

export const construirEspacios = (
  origenes = []
) => {
  const dinamicos =
    origenes.map(
      (origen) => ({
        id: origen.id,
        tipo: origen.tipo,
        nombre: origen.nombre,
        permanente: false,
      })
    );

  return [
    ESPACIO_PERSONAL,
    ...dinamicos,
  ];
};

export const obtenerNombreEspacio = (
  registro
) => {
  if (
    registro.espacioNombre
  ) {
    return registro.espacioNombre;
  }

  if (
    registro.origenNombre
  ) {
    return registro.origenNombre;
  }

  if (registro.lugar) {
    if (
      registro.lugar ===
      "Casa"
    ) {
      return "Personal / Hogar";
    }

    return registro.lugar;
  }

  return "Sin espacio";
};

export const obtenerTipoEspacio = (
  registro
) => {
  if (
    registro.espacioTipo
  ) {
    return registro.espacioTipo;
  }

  if (
    registro.origenTipo
  ) {
    return registro.origenTipo;
  }

  if (
    registro.lugar ===
    "Casa"
  ) {
    return "Personal";
  }

  return "Anterior";
};

export const iconoEspacio = (
  tipo
) => {
  switch (tipo) {
    case "Personal":
      return "🏠";

    case "Trabajo":
      return "💼";

    case "Negocio":
      return "🏪";

    case "Renta":
      return "🏘️";

    case "Inversión":
      return "📈";

    default:
      return "📁";
  }
};