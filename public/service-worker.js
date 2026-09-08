const CACHE_NAME =
  "luma-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-icon-512.png",
  "/apple-touch-icon.png",
];

/*
========================================
INSTALACIÓN
========================================
*/

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) =>
          cache.addAll(
            APP_SHELL
          )
        )
    );

    self.skipWaiting();
  }
);

/*
========================================
ACTIVACIÓN
========================================
*/

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then(
          (
            cacheNames
          ) =>
            Promise.all(
              cacheNames
                .filter(
                  (
                    cacheName
                  ) =>
                    cacheName !==
                    CACHE_NAME
                )
                .map(
                  (
                    cacheName
                  ) =>
                    caches.delete(
                      cacheName
                    )
                )
            )
        )
        .then(() =>
          self.clients.claim()
        )
    );
  }
);

/*
========================================
PETICIONES
========================================
*/

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    /*
    No interceptamos Firebase,
    Google ni servicios externos.
    */

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
    ========================================
    NAVEGACIÓN SPA
    ========================================
    */

    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        fetch(request)
          .then(
            (
              response
            ) => {
              const copia =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  (
                    cache
                  ) => {
                    cache.put(
                      "/index.html",
                      copia
                    );
                  }
                );

              return response;
            }
          )
          .catch(
            async () => {
              const cache =
                await caches.open(
                  CACHE_NAME
                );

              return (
                (await cache.match(
                  "/index.html"
                )) ||
                (await cache.match(
                  "/"
                ))
              );
            }
          )
      );

      return;
    }

    /*
    ========================================
    ARCHIVOS ESTÁTICOS
    ========================================
    */

    event.respondWith(
      caches
        .match(request)
        .then(
          (
            cachedResponse
          ) => {
            if (
              cachedResponse
            ) {
              return cachedResponse;
            }

            return fetch(
              request
            ).then(
              (
                response
              ) => {
                if (
                  !response ||
                  !response.ok
                ) {
                  return response;
                }

                const destination =
                  request.destination;

                const tiposCacheables =
                  [
                    "script",
                    "style",
                    "image",
                    "font",
                    "manifest",
                  ];

                if (
                  tiposCacheables.includes(
                    destination
                  )
                ) {
                  const copia =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(
                      (
                        cache
                      ) => {
                        cache.put(
                          request,
                          copia
                        );
                      }
                    );
                }

                return response;
              }
            );
          }
        )
    );
  }
);

/*
========================================
ACTUALIZACIÓN MANUAL
========================================
*/

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);