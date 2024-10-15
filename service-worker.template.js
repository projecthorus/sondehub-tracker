self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open("{VER}").then(function(cache) {
            return cache.addAll(
                [
                    '/css/base.css',
                    '/css/skeleton.css',
                    '/css/layout.css',
                    '/css/habitat-font.css',
                    '/css/main.css',
                    '/css/leaflet.css',
                    '/css/leaflet.fullscreen.css',
                    '/css/skewt.css',
                    '/js/skewt.js',
                    '/js/aws-sdk-2.1029.0.min.js',
                    '/js/leaflet.js',
                    '/js/Leaflet.fullscreen.min.js',
                    '/js/L.Terminator.js',
                    '/js/L.TileLayer.NoGap.js',
                    '/js/paho-mqtt.js',
                    '/js/jquery-1.12.4-min.js',
                    '/js/iscroll.js',
                    '/js/chasecar.lib.js',
                    '/js/sondehub.js',
                    '/js/app.js',
                    '/js/colour-map.js',
                    '/js/xdata.js',
                    '/js/station.js',
                    '/js/format.js',
                    '/js/rbush.js',
                    '/js/pwa.js',
                    '/js/_jquery.flot.js',
                    '/js/plot_config.js',
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