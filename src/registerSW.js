export const registerServiceWorker =
  () => {
    if (
      !(
        "serviceWorker" in
        navigator
      )
    ) {
      return;
    }

    /*
    Solo lo registramos
    en producción.

    Esto evita problemas
    de caché mientras usamos:

    npm run dev
    */

    if (
      !import.meta.env.PROD
    ) {
      return;
    }

    window.addEventListener(
      "load",
      async () => {
        try {
          const registration =
            await navigator.serviceWorker.register(
              "/service-worker.js"
            );

          console.log(
            "LUMA PWA activa:",
            registration.scope
          );
        } catch (error) {
          console.error(
            "No fue posible registrar la PWA:",
            error
          );
        }
      }
    );
  };