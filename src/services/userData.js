import {
  collection,
  doc,
} from "firebase/firestore";

import {
  db,
} from "./firebase";

export const userCollection = (
  uid,
  nombreColeccion
) => {
  if (!uid) {
    throw new Error(
      "Se requiere un usuario autenticado."
    );
  }

  return collection(
    db,
    "users",
    uid,
    nombreColeccion
  );
};

export const userDoc = (
  uid,
  nombreColeccion,
  id
) => {
  if (!uid) {
    throw new Error(
      "Se requiere un usuario autenticado."
    );
  }

  return doc(
    db,
    "users",
    uid,
    nombreColeccion,
    id
  );
};