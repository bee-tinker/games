// 짐코치 오프라인 동작
// 화면(HTML)은 인터넷이 되면 항상 새로 받아오고, 안 될 때만 저장본을 씀 → 업데이트가 바로 보임
// 아이콘·글꼴 등은 저장본을 먼저 쓰고 뒤에서 새로 받아둠
var CACHE='gymcoach-v0.1.6';
var FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var isPage=req.mode==='navigate'||req.destination==='document';
  if(isPage){
    e.respondWith(fetch(req,{cache:'no-store'}).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)});return r}).catch(function(){return caches.match(req).then(function(hit){return hit||caches.match('./index.html')})}));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque')){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)})}return r}).catch(function(){return hit});
    return hit||net;
  }));
});
