/* Neighbourhood overview map for the start page: pastel areas with names, tap for notes + a link to that area's places.
   Shapes are hand-drawn approximations from street knowledge, not official boundaries. Needs MapLibre GL. */
(function () {
  'use strict';
  // [name, colour, zone page, notes, ring of [lon, lat]]
  var A = [
    ['Gazi · Kerameikos', '#d9c6ec', 'gazi-kerameikos', ['Clubs & queer nightlife', 'Technopolis arts venue'],
      [[23.7080, 37.9790], [23.7160, 37.9800], [23.7213, 37.9779], [23.7165, 37.9752], [23.7095, 37.9760]]],
    ['Thiseio', '#f4e58a', 'psyri-monastiraki', ['Lookout points', 'Young locals'],
      [[23.7160, 37.9752], [23.7213, 37.9779], [23.7222, 37.9765], [23.7200, 37.9735], [23.7168, 37.9738]]],
    ['Psirri', '#f6c992', 'psyri-monastiraki', ['Artisans & street art', 'Nightlife'],
      [[23.7213, 37.9779], [23.7228, 37.9805], [23.7268, 37.9800], [23.7270, 37.9768], [23.7222, 37.9765]]],
    ['City Center', '#f3a99a', 'exarchia-omonia', ['Trendy bars & cafés', 'Central market & food hall'],
      [[23.7268, 37.9800], [23.7275, 37.9845], [23.7318, 37.9842], [23.7335, 37.9792], [23.7320, 37.9770], [23.7270, 37.9768]]],
    ['Exarchia', '#c6d8a6', 'exarchia-omonia', ['Alternative & student scene', 'Bookshops, rock bars'],
      [[23.7318, 37.9842], [23.7322, 37.9900], [23.7385, 37.9898], [23.7398, 37.9852], [23.7376, 37.9832]]],
    ['Akadimia', '#d6c8ea', 'kolonaki-lycabettus', ['Neoclassical buildings', 'High-end shopping'],
      [[23.7318, 37.9842], [23.7376, 37.9832], [23.7408, 37.9800], [23.7385, 37.9776], [23.7335, 37.9773], [23.7335, 37.9792]]],
    ['Kolonaki', '#f6d29e', 'kolonaki-lycabettus', ['Sidewalk cafés', 'Galleries & boutiques'],
      [[23.7385, 37.9776], [23.7408, 37.9800], [23.7470, 37.9812], [23.7502, 37.9786], [23.7482, 37.9746], [23.7402, 37.9741]]],
    ['Monastiraki', '#d6c8ea', 'psyri-monastiraki', ['Historic squares', 'Flea market'],
      [[23.7200, 37.9735], [23.7222, 37.9765], [23.7270, 37.9768], [23.7300, 37.9762], [23.7290, 37.9742], [23.7250, 37.9731]]],
    ['Syntagma', '#f2e98f', 'plaka-syntagma', ['Parliament & guard change', 'Business district'],
      [[23.7300, 37.9762], [23.7320, 37.9770], [23.7385, 37.9776], [23.7402, 37.9741], [23.7376, 37.9716], [23.7330, 37.9721], [23.7306, 37.9741]]],
    ['Plaka', '#f3a99a', 'plaka-syntagma', ['Oldest quarter', 'Pedestrian lanes'],
      [[23.7250, 37.9731], [23.7290, 37.9742], [23.7306, 37.9741], [23.7330, 37.9721], [23.7322, 37.9697], [23.7295, 37.9701], [23.7286, 37.9718]]],
    ['Acropolis', '#f1dc5c', 'acropolis-koukaki', ['Parthenon & ancient sites'],
      [[23.7232, 37.9718], [23.7250, 37.9731], [23.7286, 37.9718], [23.7293, 37.9706], [23.7262, 37.9699], [23.7236, 37.9705]]],
    ['Anafiotika', '#e8604c', 'plaka-syntagma', ['Island-style lanes', 'Cycladic houses'],
      [[23.7270, 37.9722], [23.7283, 37.9726], [23.7291, 37.9718], [23.7278, 37.9713]]],
    ['Makriyanni', '#d6c8ea', 'acropolis-koukaki', ['Acropolis Museum', 'Upscale & calm'],
      [[23.7262, 37.9699], [23.7295, 37.9701], [23.7322, 37.9697], [23.7320, 37.9666], [23.7286, 37.9656], [23.7262, 37.9671]]],
    ['Koukaki', '#f6c992', 'acropolis-koukaki', ['Relaxed, local vibe', 'Cafés & tavernas'],
      [[23.7190, 37.9690], [23.7262, 37.9699], [23.7262, 37.9671], [23.7286, 37.9656], [23.7260, 37.9615], [23.7200, 37.9626]]],
    ['Pangrati', '#c6d8a6', 'pangrati-ilisia', ['Neighbourhood tavernas', 'Wine bars'],
      [[23.7402, 37.9700], [23.7452, 37.9721], [23.7522, 37.9702], [23.7532, 37.9642], [23.7462, 37.9630], [23.7410, 37.9660]]]
  ];
  function centre(r) { var x = 0, y = 0; r.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / r.length, y / r.length]; }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  window.AthensAreas = function (id, opt) {
    opt = opt || {};
    var polys = { type: 'FeatureCollection', features: A.map(function (a, i) {
      return { type: 'Feature', id: i, properties: { name: a[0], col: a[1] }, geometry: { type: 'Polygon', coordinates: [a[4].concat([a[4][0]])] } };
    }) };
    var labels = { type: 'FeatureCollection', features: A.map(function (a, i) {
      return { type: 'Feature', properties: { name: a[0], small: a[0] === 'Anafiotika' ? 1 : 0 }, geometry: { type: 'Point', coordinates: centre(a[4]) } };
    }) };
    var b = new maplibregl.LngLatBounds();
    A.forEach(function (a) { a[4].forEach(function (p) { b.extend(p); }); });
    var map = new maplibregl.Map({ container: id, style: 'https://tiles.openfreemap.org/styles/positron', bounds: b, fitBoundsOptions: { padding: 12 },
      cooperativeGestures: true, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
    map.touchZoomRotate.disableRotation();
    map.on('load', function () {
      map.addSource('areas', { type: 'geojson', data: polys });
      map.addSource('labels', { type: 'geojson', data: labels });
      map.addLayer({ id: 'fill', type: 'fill', source: 'areas', paint: { 'fill-color': ['get', 'col'], 'fill-opacity': 0.62 } });
      map.addLayer({ id: 'line', type: 'line', source: 'areas', paint: { 'line-color': '#ffffff', 'line-width': 1.5 } });
      map.addLayer({ id: 'lbl', type: 'symbol', source: 'labels', layout: {
        'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': ['case', ['==', ['get', 'small'], 1], 10, 13],
        'text-max-width': 7, 'text-allow-overlap': false, 'text-padding': 1 },
        paint: { 'text-color': '#23303a', 'text-halo-color': 'rgba(255,255,255,.85)', 'text-halo-width': 1.4 } });
      map.on('click', 'fill', function (e) {
        var f = e.features[e.features.length - 1], a = A[f.id];   // last = topmost (Anafiotika sits on Plaka/Acropolis)
        var n = (opt.counts || {})[a[2]];
        new maplibregl.Popup({ closeButton: true, maxWidth: '240px' }).setLngLat(e.lngLat).setHTML(
          '<b>' + esc(a[0]) + '</b><ul class="apop">' + a[3].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<a href="' + a[2] + '.html">' + (n ? n + ' places in ' + esc(opt.zoneNames[a[2]]) : 'See this area') + ' →</a>').addTo(map);
      });
      map.on('mouseenter', 'fill', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'fill', function () { map.getCanvas().style.cursor = ''; });
    });
    return map;
  };
})();
