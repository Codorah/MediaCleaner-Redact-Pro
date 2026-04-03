self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    const registrations = await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.navigate(client.url));
    return registrations;
  })());
});

self.addEventListener("fetch", () => {
  // Intentionally left blank. This worker only exists to clean up legacy cached builds.
});
