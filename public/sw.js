const CACHE = 'cronograma-v2';

// Arquivos para cachear imediatamente
const PRECACHE = [
  '/',
  '/index.html',
];

// Estratégia: cache-first para assets estáticos, network-first para API
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  
  // Ignora requisições não-GET
  if (request.method !== 'GET') return;
  
  // Ignora arquivos de extensão que não são assets
  if (request.url.includes('/firebase/') || request.url.includes('googleapis') || request.url.includes('gstatic')) {
    return;
  }
  
  e.respondWith(
    fetch(request)
      .then(response => {
        // Cacheia apenas respostas válidas
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta buscar no cache
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Se for uma página, retorna o index.html para SPA
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
