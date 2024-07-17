self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open("{VER}").then(function(cache) {
            return cache.addAll(
                [
                    '/css/mobile.css',
                    '/css/leaflet.css',
                    '/css/leaflet.fullscreen.css',
                    '/js/leaflet.js',
                    '/js/Leaflet.fullscreen.min.js',
                    '/js/L.Terminator.js',
                    '/js/mobile.js',
                    '/js/rbush.js',
                    '/js/pwa.js',
                    '/js/init_plot.js',
                    '/img/markers/balloon.svg',
                    '/img/markers/car.svg',
                    '/img/markers/parachute.svg',
                    '/img/markers/payload.svg',
                    '/img/markers/payload-not-recovered.png',
                    '/img/markers/payload-recovered.png',
                    '/img/markers/target.svg',
                    '/img/markers/shadow.png',
                    '/img/markers/balloon-pop.png',
                    '/img/hab-spinner.gif',
                    '/img/sondehub_logo.png',
                    '/favicon.ico',
                    '/font/HabitatFont.woff',
                    '/font/Roboto-regular.woff',
                    '/index.html'
                ]
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        }),
    );
});