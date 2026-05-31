import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getCatConfig, CATEGORY_CONFIG, CLOSED_PIN_COLOR, MOODS, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import SpotDetail from './SpotDetail';
import SpotEditor from './SpotEditor';
import AddSpotFlow from './AddSpotFlow';
import './MapView.css';

// MapLibre travaille en [lng, lat] (l'inverse de Leaflet).
const TOULOUSE = [1.4442, 43.6045];
const TLS_BOUNDS = [[1.22, 43.47], [1.65, 43.74]]; // [SW, NE]

// Styles vectoriels CARTO (gratuits, mêmes basemaps dark/light que la v1 raster,
// mais en vectoriel = pan/zoom fluide). Pas de clé API requise.
const STYLE_DARK  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const isDarkTheme = () => document.documentElement.getAttribute('data-theme') !== 'light';

// ── Génère une image de pin premium sur un canvas (cercle gradient + anneau
//    blanc + ombre + emoji catégorie). Servie à MapLibre via map.addImage. ──
function makePinImage(color, emoji, closed) {
  const ratio = 2;
  const size = 46;
  const d = size * ratio;
  const canvas = document.createElement('canvas');
  canvas.width = d;
  canvas.height = d;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const cx = size / 2;
  const cy = size / 2;
  const r = 13;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = closed ? CLOSED_PIN_COLOR : color;
  ctx.fill();
  ctx.restore();

  // Anneau blanc
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = closed ? 'rgba(255,255,255,0.6)' : '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Emoji catégorie
  ctx.globalAlpha = closed ? 0.7 : 1;
  ctx.font = '14px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, cx, cy + 0.5);

  return { data: ctx.getImageData(0, 0, d, d).data, width: d, height: d, pixelRatio: ratio };
}

function iconKey(spot, closed) {
  const base = CATEGORY_CONFIG[spot.category] ? spot.category : '__default';
  return (closed ? 'closed:' : 'open:') + base;
}

export default function MapView({
  spots, isFavorite, onToggleFavorite, userPos, geoStatus, onLocate, onEditSpot,
  admin, onAddSpot, onDeleteSpot,
  repositioningSpot, onStartReposition, onRepositionSave, onRepositionCancel,
  isActive,
}) {
  const mapEl   = useRef(null);
  const mapRef  = useRef(null);
  const userMarkerRef = useRef(null);
  const placingMarkerRef = useRef(null);
  const roRef   = useRef(null);
  const styleReadyRef = useRef(false);

  const [openOnly,    setOpenOnly]    = useState(false);
  const [mood,        setMood]        = useState(null);
  const [category,    setCategory]    = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [viewMode,    setViewMode]    = useState('map');
  const [editingSpot, setEditingSpot] = useState(null);
  const [placing,     setPlacing]     = useState(false);
  const [newCoords,   setNewCoords]   = useState(null);

  // refs pour accéder à l'état courant dans les handlers MapLibre (capturés une fois)
  const placingRef = useRef(false);
  const repositioningRef = useRef(null);
  useEffect(() => { placingRef.current = placing; }, [placing]);
  useEffect(() => { repositioningRef.current = repositioningSpot; }, [repositioningSpot]);

  const categories = useMemo(() => {
    const counts = {};
    spots.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [spots]);

  const filtered = useMemo(
    () => spots.filter((s) =>
      (!openOnly || isOpenNow(s)) && matchMood(s, mood) && (!category || s.category === category)),
    [spots, openOnly, mood, category]
  );

  // Lookup spotId -> spot (pour retrouver le spot au clic sur un point)
  const spotByIdRef = useRef({});
  useEffect(() => {
    const m = {};
    filtered.forEach((s) => { m[String(s.id)] = s; });
    spotByIdRef.current = m;
  }, [filtered]);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: filtered.map((s) => {
      const hasHours = !!s.hours && Object.keys(s.hours).length > 0;
      const open = hasHours ? isOpenNow(s) : null;
      const closed = hasHours && open === false;
      return {
        type: 'Feature',
        properties: {
          spotId: String(s.id),
          name: s.name || '',
          icon: iconKey(s, closed),
        },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      };
    }),
  }), [filtered]);

  // ── Enregistre toutes les images de pins (1 normale + 1 fermée par catégorie) ──
  const registerImages = useCallback((map) => {
    const cats = { ...CATEGORY_CONFIG, __default: { color: '#EC4899', emoji: '📍' } };
    Object.entries(cats).forEach(([key, cfg]) => {
      const openName = 'open:' + key;
      const closedName = 'closed:' + key;
      if (!map.hasImage(openName)) map.addImage(openName, makePinImage(cfg.color, cfg.emoji, false), { pixelRatio: 2 });
      if (!map.hasImage(closedName)) map.addImage(closedName, makePinImage(cfg.color, cfg.emoji, true), { pixelRatio: 2 });
    });
  }, []);

  // ── Ajoute source + layers (rappelé après chaque setStyle) ──
  const addSpotLayers = useCallback((map) => {
    registerImages(map);

    if (!map.getSource('spots')) {
      map.addSource('spots', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 16,
      });
    }

    // Halo flou sous les clusters (effet glow Snap Map)
    if (!map.getLayer('cluster-glow')) {
      map.addLayer({
        id: 'cluster-glow',
        type: 'circle',
        source: 'spots',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#EC4899',
          'circle-blur': 1,
          'circle-opacity': 0.35,
          'circle-radius': ['step', ['get', 'point_count'], 26, 10, 32, 50, 40],
        },
      });
    }
    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'spots',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#A78BFA', 10, '#C56FE0', 50, '#EC4899'],
          'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 50, 26],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'rgba(255,255,255,0.9)',
        },
      });
    }
    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'spots',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold', 'Noto Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#fff' },
      });
    }
    // Points individuels (pins premium) + nom au zoom proche
    if (!map.getLayer('unclustered')) {
      map.addLayer({
        id: 'unclustered',
        type: 'symbol',
        source: 'spots',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.62, 14, 0.85, 17, 1],
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
          'text-field': ['step', ['zoom'], '', 16.5, ['get', 'name']],
          'text-font': ['Open Sans Bold', 'Noto Sans Bold'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-optional': true,
          'text-max-width': 9,
        },
        paint: {
          'text-color': isDarkTheme() ? '#F5F0FF' : '#1A1825',
          'text-halo-color': isDarkTheme() ? 'rgba(7,6,12,0.9)' : 'rgba(255,255,255,0.95)',
          'text-halo-width': 1.4,
        },
      });
    }
  }, [geojson, registerImages]);

  const openSpot = (spot) => { setSelected(spot); };

  // Deep link: ouvre le spot depuis l'URL (?spot=ID)
  useEffect(() => {
    if (!spots.length) return;
    const params = new URLSearchParams(window.location.search);
    const spotId = params.get('spot');
    if (!spotId) return;
    const target = spots.find((s) => String(s.id) === spotId);
    if (target) {
      setSelected(target);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [spots]);

  // ── Init carte ──
  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: isDarkTheme() ? STYLE_DARK : STYLE_LIGHT,
      center: TOULOUSE,
      zoom: 13.2,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: TLS_BOUNDS,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();

    const onStyleLoad = () => {
      styleReadyRef.current = true;
      addSpotLayers(map);
    };
    map.on('load', onStyleLoad);
    // setStyle (changement de thème) ré-émet 'styledata' : on ré-injecte les layers
    map.on('styledata', () => {
      if (styleReadyRef.current && !map.getSource('spots')) addSpotLayers(map);
    });

    // ── Interactions ──
    map.on('click', 'clusters', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const clusterId = f.properties.cluster_id;
      map.getSource('spots').getClusterExpansionZoom(clusterId).then((zoom) => {
        map.easeTo({ center: f.geometry.coordinates, zoom, duration: 500 });
      });
    });
    map.on('click', 'unclustered', (e) => {
      if (placingRef.current || repositioningRef.current) return;
      const f = e.features?.[0];
      if (!f) return;
      const spot = spotByIdRef.current[f.properties.spotId];
      if (spot) setSelected(spot);
    });
    ['clusters', 'unclustered'].forEach((layer) => {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    });

    // Clic "vide" pour placer / repositionner un spot (mode admin)
    map.on('click', (e) => {
      if (repositioningRef.current) {
        map.getCanvas().style.cursor = '';
        onRepositionSave?.(e.lngLat.lat, e.lngLat.lng);
        return;
      }
      if (placingRef.current) {
        const { lng, lat } = e.lngLat;
        if (placingMarkerRef.current) placingMarkerRef.current.remove();
        const el = document.createElement('div');
        el.className = 'mlg-placing-pin';
        el.textContent = '+';
        placingMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat]).addTo(map);
        setPlacing(false);
        setNewCoords({ lat, lng });
        map.getCanvas().style.cursor = '';
      }
    });

    roRef.current = new ResizeObserver(() => {
      if (mapEl.current?.offsetWidth > 0) map.resize();
    });
    roRef.current.observe(mapEl.current);

    return () => { roRef.current?.disconnect(); map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bascule thème dark/light ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const obs = new MutationObserver(() => {
      styleReadyRef.current = false;
      map.setStyle(isDarkTheme() ? STYLE_DARK : STYLE_LIGHT);
      map.once('styledata', () => { styleReadyRef.current = true; addSpotLayers(map); });
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [addSpotLayers]);

  // ── Met à jour les données quand les filtres changent ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('spots');
    if (src) src.setData(geojson);
  }, [geojson]);

  // Resize quand on repasse en vue carte (le conteneur était caché)
  useEffect(() => {
    if (viewMode === 'map') setTimeout(() => mapRef.current?.resize(), 60);
  }, [viewMode]);

  // Resize quand la page devient active depuis App.jsx (display:none → block)
  useEffect(() => {
    if (isActive) setTimeout(() => mapRef.current?.resize(), 120);
  }, [isActive]);

  // ── Marqueur utilisateur ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-pin';
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPos.lng, userPos.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
    }
  }, [userPos]);

  // Curseur crosshair en mode placement / repositionnement
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = (placing || repositioningSpot) ? 'crosshair' : '';
  }, [placing, repositioningSpot]);

  const surpriseMe = () => {
    if (!filtered.length) return;
    const s = filtered[Math.floor(Math.random() * filtered.length)];
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 16, duration: 900 });
    setSelected(s);
  };

  const handleAddSave = (spotData) => {
    onAddSpot?.(spotData);
    if (placingMarkerRef.current) { placingMarkerRef.current.remove(); placingMarkerRef.current = null; }
    setNewCoords(null);
  };

  const cancelAdd = () => {
    if (placingMarkerRef.current) { placingMarkerRef.current.remove(); placingMarkerRef.current = null; }
    setNewCoords(null);
    setPlacing(false);
  };

  return (
    <div className="mapview">
      <div className="filter-bar">
        <button
          className={`chip toggle${openOnly ? ' active' : ''}`}
          onClick={() => setOpenOnly((v) => !v)}
        >
          <span className={`dot${openOnly ? ' on' : ''}`} />
          Ouvert
        </button>
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`chip mood${mood === m.key ? ' active' : ''}`}
            onClick={() => setMood((v) => (v === m.key ? null : m.key))}
          >
            {m.emoji} {m.label}
          </button>
        ))}
        <span className="filter-sep" />
        {categories.map(([cat, count]) => {
          const c = getCatConfig(cat);
          const active = category === cat;
          return (
            <button key={cat} className={`chip cat${active ? ' active' : ''}`}
              style={active ? { borderColor: c.color, color: c.color } : undefined}
              onClick={() => setCategory((v) => (v === cat ? null : cat))}>
              <span>{c.emoji}</span>{cat}<span className="cat-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="view-toggle">
        <button className={`vt-btn${viewMode === 'map' ? ' active' : ''}`} onClick={() => setViewMode('map')}>
          Carte
        </button>
        <button className={`vt-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}>
          Liste
        </button>
      </div>

      <div ref={mapEl} className="map-canvas" style={{ display: viewMode === 'list' ? 'none' : undefined }} />

      {viewMode === 'list' && (() => {
        const groups = {};
        filtered.forEach((s) => {
          const q = s.quartier || 'Autre';
          if (!groups[q]) groups[q] = [];
          groups[q].push(s);
        });
        const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
        return (
          <div className="map-list">
            <div className="map-list-count">
              {filtered.length} spot{filtered.length > 1 ? 's' : ''}
              {filtered.length !== spots.length && ` · filtré sur ${spots.length}`}
            </div>
            {sorted.map(([qName, qSpots]) => {
              const qColor = QUARTIER_COLORS[qName] || '#A78BFA';
              const openCount = qSpots.filter((s) => {
                const hh = !!s.hours && Object.keys(s.hours).length > 0;
                return hh ? isOpenNow(s) : false;
              }).length;
              return (
                <div key={qName} className="ml-quartier-group">
                  <div className="ml-quartier-header" style={{ '--qc': qColor }}>
                    <div className="ml-quartier-bar" />
                    <span className="ml-quartier-name">{qName}</span>
                    <span className="ml-quartier-count">{qSpots.length}</span>
                    {openCount > 0 && (
                      <span className="ml-quartier-open">{openCount} ouvert{openCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {qSpots.map((s) => {
                    const cat = getCatConfig(s.category);
                    const hasH = !!s.hours && Object.keys(s.hours).length > 0;
                    const open = hasH ? isOpenNow(s) : null;
                    const dist = userPos ? distanceKm(userPos, { lat: s.lat, lng: s.lng }) : null;
                    const photo = s.photos?.[0] || s.photo_url || null;
                    return (
                      <button key={s.id} className="map-list-card" onClick={() => setSelected(s)}>
                        <div className="map-list-thumb" style={{ background: photo ? undefined : cat.gradient }}>
                          {photo
                            ? <img src={photo} alt={s.name} onError={e => { e.target.style.display = 'none'; }} />
                            : cat.emoji}
                          {open !== null && <div className={`ml-open-dot${open ? ' on' : ' off'}`} />}
                        </div>
                        <div className="map-list-body">
                          <div className="map-list-top">
                            <span className="map-list-name">{s.name}</span>
                          </div>
                          <div className="map-list-meta">
                            <span style={{ color: cat.color }}>{cat.emoji} {s.category}</span>
                          </div>
                          <div className="ml-card-footer">
                            {open !== null && (
                              <span className={`ml-status ${open ? 'on' : 'off'}`}>
                                {open ? 'Ouvert' : 'Fermé'}
                              </span>
                            )}
                            {dist != null && <span className="ml-dist">📍 {formatDistance(dist)}</span>}
                          </div>
                        </div>
                        <div className="ml-card-right">
                          {s.google_rating
                            ? <div className="ml-rating-badge">⭐ {s.google_rating}</div>
                            : null}
                          {s.google_rating >= 4.5 && <div className="ml-coup-badge">❤️</div>}
                          <span className="ml-chevron">›</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      {viewMode === 'map' && geoStatus === 'denied' && (
        <div className="map-toast">Localisation refusée · autorise-la dans ton navigateur.</div>
      )}

      {viewMode === 'map' && (
        <>
          <button className="surprise-btn" onClick={surpriseMe} title="Surprends-moi">&#x1F3B2;</button>
          <div className="map-counter">{filtered.length} spot{filtered.length > 1 ? 's' : ''}</div>
        </>
      )}

      {admin && viewMode === 'map' && !placing && !newCoords && (
        <button className="admin-add-btn" onClick={() => setPlacing(true)} title="Ajouter un spot">+</button>
      )}

      {admin && placing && (
        <div className="admin-placing-banner">
          <span>📍 Tape sur la carte pour placer le spot</span>
          <button onClick={cancelAdd}>Annuler</button>
        </div>
      )}

      {repositioningSpot && (
        <div className="admin-placing-banner">
          <span>📍 Tape l'emplacement exact de <strong>{repositioningSpot.name}</strong></span>
          <button onClick={onRepositionCancel}>Annuler</button>
        </div>
      )}

      {selected && (
        <SpotDetail
          spot={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          userPos={userPos}
          onEdit={(s) => setEditingSpot(s)}
          onReposition={admin ? onStartReposition : undefined}
          onDelete={admin ? onDeleteSpot : undefined}
        />
      )}

      {editingSpot && (
        <SpotEditor
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
          admin={admin}
          onSave={(fields) => {
            onEditSpot?.(editingSpot.id, fields);
            setEditingSpot(null);
          }}
        />
      )}

      {newCoords && (
        <AddSpotFlow
          coords={newCoords}
          onSave={handleAddSave}
          onCancel={cancelAdd}
        />
      )}
    </div>
  );
}
