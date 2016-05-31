this.onfetch = function(event) {
  event.respondWith(new Response('Hello from ServiceWorker!'));
};
