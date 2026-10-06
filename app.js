/* Athens guide map: emoji pins, type/friend filters, shaded areas, "near me". Needs Leaflet. */
(function () {
  var CAT = window.ATH_CATS || {};
  function km(a, b, c, d) {
    var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2);
    return 12742 * Math.asin(Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y));
  }
  function walk(k) { var m = Math.round(k * 1000 * 1.3 / 80); return m <= 40 ? '~' + m + ' min walk' : '~' + k.toFixed(1) + ' km'; }
  function pinIcon(p) {
    var c = CAT[p.cat] || {}, cls = 'pin' + (p.closed ? ' pin-off' : '');
    return L.divIcon({ className: '', iconSize: [34, 40], iconAnchor: [17, 38], popupAnchor: [0, -34],
      html: '<div class="' + cls + '" style="--c:' + (c.col || '#555') + '"><span class="pe">' + (c.e || '📍') + '</span><b class="pn">' + p.n + '</b></div>' });
  }
  function popup(p) {
    var c = CAT[p.cat] || {};
    return '<div class="pop"><b>' + p.n + '. ' + p.name + '</b><br><span>' + (c.e || '') + ' ' + (c.label || '') +
      (p.price ? ' · ' + p.price : '') + (p.rating ? ' · ★' + p.rating : '') + '</span>' +
      (p.closed ? '<br><span class="warn">⏸ ' + p.closed + '</span>' : '') +
      '<br><a href="' + p.page + '">Details</a> · <a target="_blank" rel="noopener" href="' + p.link + '">Google Maps ↗</a></div>';
  }
  window.AthensMap = function (id, pts, opt) {
    opt = opt || {};
    var el = document.getElementById(id); if (!el) return;
    var light = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, attribution: 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors' });
    var labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 });
    var streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' });
    var m = L.map(id, { scrollWheelZoom: false, layers: [light, labels] });
    L.control.layers({ 'Light': L.layerGroup([light, labels]), 'Streets': streets }, null, { position: 'topright' }).addTo(m);
    var bounds = [], markers = [];
    if (opt.areas) {
      opt.areas.forEach(function (a) {
        var poly = L.polygon(a.shape, { color: a.col, weight: 2, fillColor: a.col, fillOpacity: 0.18 }).addTo(m);
        poly.bindTooltip(a.short || a.name, { permanent: true, direction: 'center', className: 'area-lbl' });
        if (a.z) poly.on('click', function () { location.href = a.z + '.html'; });
        a.shape.forEach(function (ll) { bounds.push(ll); });
      });
    }
    if (opt.home) {
      L.circle([opt.home.lat, opt.home.lon], { radius: opt.home.exact ? 40 : 700, color: '#b4532a', fillOpacity: .15 }).addTo(m).bindPopup(opt.home.label);
      if (opt.home.exact) L.marker([opt.home.lat, opt.home.lon], { icon: L.divIcon({ className: '', iconSize: [30, 30], html: '<div class="home-mk">🏠</div>' }) }).addTo(m);
    }
    pts.forEach(function (p) {
      var mk = L.marker([p.lat, p.lon], { icon: pinIcon(p), title: p.n + '. ' + p.name }).bindPopup(popup(p));
      mk._p = p; markers.push(mk); mk.addTo(m);
    });
    // fit to the dense core: places within 2.4 km of the median point (outliers stay on the map, just off-screen)
    if (pts.length) {
      var la = pts.map(function (p) { return p.lat; }).sort(), lo = pts.map(function (p) { return p.lon; }).sort();
      var cLa = la[Math.floor(la.length / 2)], cLo = lo[Math.floor(lo.length / 2)];
      pts.forEach(function (p) { if (pts.length < 4 || km(cLa, cLo, p.lat, p.lon) < 2.4) bounds.push([p.lat, p.lon]); });
    }
    if (opt.home && !bounds.length) bounds.push([opt.home.lat, opt.home.lon]);
    if (bounds.length) m.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });

    // ---- filters (type + friend) and near-me
    var bar = opt.filters && document.getElementById(id + '-f');
    var activeCats = {}, who = 'all', me = null, meMk = null;
    Object.keys(CAT).forEach(function (k) { activeCats[k] = true; });
    function visible(p) {
      var catOk = activeCats[p.cat] || (p.also || []).some(function (c) { return activeCats[c]; });
      return catOk && (who === 'all' || p.by.indexOf(who) >= 0);
    }
    function refresh() {
      markers.forEach(function (mk) { if (visible(mk._p)) mk.addTo(m); else m.removeLayer(mk); });
      if (me) listNear();
    }
    if (bar) {
      var cats = {}; pts.forEach(function (p) { cats[p.cat] = 1; (p.also || []).forEach(function (c) { cats[c] = 1; }); });
      var html = '<div class="frow"><span class="flbl">Show</span><button class="on" data-all="1">All</button>';
      Object.keys(CAT).forEach(function (k) { if (cats[k]) html += '<button class="on" data-cat="' + k + '" style="--c:' + CAT[k].col + '">' + CAT[k].e + ' ' + CAT[k].short + '</button>'; });
      html += '</div><div class="frow"><span class="flbl">From</span>';
      ['all', 'Erhan', 'Irene', 'Giulia'].forEach(function (w) { html += '<button data-who="' + w + '" class="' + (w === 'all' ? 'on' : '') + '">' + (w === 'all' ? 'Everyone' : w) + '</button>'; });
      html += '<button class="near" data-near="1">📍 Near me</button></div>';
      bar.innerHTML = html;
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.all) { var allOn = Object.keys(activeCats).every(function (k) { return activeCats[k]; });
          Object.keys(activeCats).forEach(function (k) { activeCats[k] = !allOn; });
          bar.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', !allOn); }); b.classList.toggle('on', !allOn); }
        else if (b.dataset.cat) { activeCats[b.dataset.cat] = !activeCats[b.dataset.cat]; b.classList.toggle('on'); }
        else if (b.dataset.who) { who = b.dataset.who; bar.querySelectorAll('[data-who]').forEach(function (x) { x.classList.toggle('on', x === b); }); }
        else if (b.dataset.near) { locate(b); return; }
        refresh();
      });
    }
    var list = document.getElementById(id + '-near');
    function listNear() {
      if (!list) return;
      var rows = pts.filter(visible).map(function (p) { return { p: p, d: km(me[0], me[1], p.lat, p.lon) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, opt.nearMax || 12);
      list.innerHTML = '<h3>Closest to you right now</h3><ol class="nearlist">' + rows.map(function (r) {
        var c = CAT[r.p.cat] || {};
        return '<li><b>' + c.e + ' ' + r.p.n + '. ' + r.p.name + '</b> <span class="meta">' + walk(r.d) + (r.p.price ? ' · ' + r.p.price : '') +
          (r.p.closed ? ' · <span class="warn">' + r.p.closed + '</span>' : '') + '</span><br><a href="' + r.p.page + '">Details</a> · <a target="_blank" rel="noopener" href="' + r.p.link + '">Google Maps ↗</a> · <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + r.p.lat + ',' + r.p.lon + '">Walk there ↗</a></li>';
      }).join('') + '</ol><p class="meta">Uses the filters above. Your location stays in your browser and is never sent anywhere.</p>';
      var b2 = [me].concat(rows.slice(0, 6).map(function (r) { return [r.p.lat, r.p.lon]; }));
      m.fitBounds(b2, { padding: [30, 30], maxZoom: 17 });
    }
    function locate(btn) {
      if (!navigator.geolocation) { if (list) list.innerHTML = '<p class="warn">This browser cannot share its location.</p>'; return; }
      btn.textContent = '📍 Locating…';
      navigator.geolocation.watchPosition(function (pos) {
        var first = !me; me = [pos.coords.latitude, pos.coords.longitude];
        if (!meMk) meMk = L.circleMarker(me, { radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1 }).addTo(m).bindPopup('You are here');
        else meMk.setLatLng(me);
        btn.textContent = '📍 Near me ✓'; btn.classList.add('on');
        if (first) listNear();
      }, function (err) {
        btn.textContent = '📍 Near me';
        if (list) list.innerHTML = '<p class="warn">Location not available (' + err.message + '). Allow location access for this site, or open it on your phone.</p>';
      }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 });
    }
    if (opt.autoNear && bar) { var nb = bar.querySelector('[data-near]'); if (nb) setTimeout(function () { locate(nb); }, 300); }
    return m;
  };
})();
