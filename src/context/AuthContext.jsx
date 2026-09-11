import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  auth,
  provider,
} from "../services/firebase";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(
            firebaseUser
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const registrar =
    async ({
      nombre,
      email,
      password,
    }) => {
      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (nombre?.trim()) {
        await updateProfile(
          credencial.user,
          {
            displayName:
              nombre.trim(),
          }
        );

        await credencial.user.reload();

        setUser(
          auth.currentUser
        );
      }

      return credencial;
    };

  const iniciarSesion =
    (
      email,
      password
    ) =>
      signInWithEmailAndPassword(
        auth,
        email,
        password
      );

  const iniciarConGoogle =
    () =>
      signInWithPopup(
        auth,
        provider
      );

  const recuperarPassword =
    (email) =>
      sendPasswordResetEmail(
        auth,
        email
      );

  const cerrarSesion =
    () =>
      signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registrar,
        iniciarSesion,
        iniciarConGoogle,
        recuperarPassword,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto =
    useContext(
      AuthContext
    );

  if (!contexto) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return contexto;
}