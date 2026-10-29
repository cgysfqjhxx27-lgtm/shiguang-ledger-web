/* Generated release ID changes whenever an application file changes. */
const CACHE_PREFIX='shiguang-shell-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE_NAME=CACHE_PREFIX+'__BUILD_ID__';
const SHELL=['./','./styles.css','./app.mjs','./core.mjs','./db.mjs','./symbols.mjs','./category-ui.mjs','./category-drag.mjs','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png'];
const urls=SHELL.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>{
  // addAll is atomic: failed downloads never replace an existing working release.
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX));
    // Keep one previous shell for tabs still completing an edit during a manual update.
    const old=names.filter(name=>name!==CACHE_NAME);
    await Promise.all(old.slice(0,-1).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  // Pages redirects /index.html to /. Return the non-redirected root response;
  // cached redirected responses can be rejected for navigation requests.
  const indexURL=new URL('./',self.registration.scope).href;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);return await cache.match(indexURL)||fetch(event.request);})());return;
  }
  if(!urls.includes(url.href))return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);const cached=await cache.match(event.request);return cached||fetch(event.request);})());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='STATUS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME),responses=await Promise.all(urls.map(url=>cache.match(url)));
    event.ports[0]?.postMessage({ready:responses.every(Boolean),build:'__BUILD_ID__'});
  })());
});
