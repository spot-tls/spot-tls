import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { getCatConfig, CLOSED_PIN_COLOR, MOODS, matchMood, QUARTIER_COLORS } from '../../utils/config';
import { isOpenNow } from '../../utils/isOpenNow';
import { distanceKm, formatDistance } from '../../utils/distance';
import SpotDetail from './SpotDetail';
import SpotEditor from './SpotEditor';
import AddSpotFlow from './AddSpotFlow';
import './MapView.css';

const TOULOUSE = [43.6045, 1.4442];

const TLS_BOUNDS = L.latLngBounds([43.47, 1.22], [43.74, 1.65]);
const TILE_DARK    = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
const TILE_LIGHT   = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
const LABELS_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';
const LABELS_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
const TILE_ATTR    = '&copy; OpenStreetMap &copy; CARTO';

function pinHtml(spot, open, compact) {
  const cat = getCatConfig(spot.category);
  const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
  const confirmed_closed = hasHours && open === false;
  const opacity = confirmed_closed ? 0.5 : 1;
  const isNew = spot._isNew;

  if (compact) {
    const color = confirmed_closed ? '#4a4060' : cat.color;
    return (
      '<div class="spot-dot" style="background:' + color + ';opacity:' + opacity + ';'
      + (isNew ? 'border:2px solid #4ade80;' : '') + '"></div>'
    );
  }

  const bg = confirmed_closed ? CLOSED_PIN_COLOR : cat.gradient;
  const tailColor = confirmed_closed ? '#4a4060' : cat.color;
  return (
    '<div class="spot-pin" style="background:' + bg + ';opacity:' + opacity + ';'
    + (isNew ? 'border:2px solid #4ade80;' : '') + '">'
    + '<span class="spot-pin-emoji">' + cat.emoji + '</span></div>'
    + '<div class="spot-pin-tail" style="border-top-color:' + tailColor + ';opacity:' + opacity + '"></div>'
  );
}

const userIcon = L.divIcon({
  className: 'user-pin-wrap',
  html: '<div class="user-pin"></div>',
  iconSize: [22, 22], iconAnchor: [11, 11],
});

const placingIcon = L.divIcon({
  className: '',
  html: '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4ade80,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 0 4px rgba(74,222,128,0.3);">+</div>',
  iconSize: [32, 32], iconAnchor: [16, 16],
});

export default function MapView({
  spots, isFavorite, onToggleFavorite, userPos, geoStatus, onLocate, onEditSpot,
  admin, onAddSpot, onDeleteSpot,
  repositioningSpot, onStartReposition, onRepositionSave, onRepositionCancel,
}) {
  const mapEl   = useRef(null);
  const mapRef  = useRef(null);
  const baseRef = useRef(null);
  const lblRef  = useRef(null);
  const layerRef = useRef(null);
  const userRef  = useRef(null);
  const placingMarkerRef = useRef(null);
  const roRef   = useRef(null);

  const [openOnly,    setOpenOnly]    = useState(false);
  const [mood,        setMood]        = useState(null);
  const [category,    setCategory]    = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [viewMode,    setViewMode]    = useState('map');
  const [editingSpot, setEditingSpot] = useState(null);
  const [placing,     setPlacing]     = useState(false);
  const [newCoords,   setNewCoords]   = useState(null);
  const [zoom,        setZoom]        = useState(14);

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

  useEffect(() => {
    if (mapRef.current) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const map = L.map(mapEl.current, {
      center: TOULOUSE, zoom: 14,
      maxBounds: TLS_BOUNDS, maxBoundsViscosity: 0.85,
      minZoom: 11, maxZoom: 18,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const base = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    const lbl  = L.tileLayer(isDark ? LABELS_DARK : LABELS_LIGHT, { attribution: '', maxZoom: 19, pane: 'shadowPane' }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map; baseRef.current = base; lblRef.current = lbl; layerRef.current = layer;
    setTimeout(() => map.invalidateSize(), 300);
    map.on('zoomend', () => setZoom(map.getZoom()));

    // Rappel invalidateSize chaque fois que le conteneur redevient visible
    // (le MapView est monté caché via display:none — ça casse les dimensions Leaflet)
    roRef.current = new ResizeObserver(() => {
      if (mapEl.current?.offsetWidth > 0) map.invalidateSize();
    });
    roRef.current.observe(mapEl.current);

    return () => roRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const obs = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      baseRef.current?.setUrl(isDark ? TILE_DARK : TILE_LIGHT);
      lblRef.current?.setUrl(isDark ? LABELS_DARK : LABELS_LIGHT);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const compact = zoom < 15;
    layer.clearLayers();
    filtered.forEach((spot) => {
      const hasHours = !!spot.hours && Object.keys(spot.hours).length > 0;
      const open = hasHours ? isOpenNow(spot) : null;
      const icon = L.divIcon({
        className: compact ? 'spot-dot-wrap' : 'spot-pin-wrap',
        html: pinHtml(spot, open, compact),
        iconSize: compact ? [12, 12] : [30, 40],
        iconAnchor: compact ? [6, 6] : [15, 40],
      });
      L.marker([spot.lat, spot.lng], { icon }).addTo(layer).on('click', () => openSpot(spot));
    });
  }, [filtered, zoom]);

  useEffect(() => {
    if (!mapRef.current || !userPos) return;
    if (!userRef.current) {
      userRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(mapRef.current);
    } else {
      userRef.current.setLatLng([userPos.lat, userPos.lng]);
    }
  }, [userPos]);

  // Mode repositionnement
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!repositioningSpot) return;
    map.getContainer().style.cursor = 'crosshair';
    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      map.getContainer().style.cursor = '';
      onRepositionSave?.(lat, lng);
    };
    map.once('click', handleClick);
    return () => { map.off('click', handleClick); map.getContainer().style.cursor = ''; };
  }, [repositioningSpot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!placing) {
      if (placingMarkerRef.current) {
        map.removeLayer(placingMarkerRef.current);
        placingMarkerRef.current = null;
      }
      map.getContainer().style.cursor = '';
      return;
    }
    map.getContainer().style.cursor = 'crosshair';
    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      if (placingMarkerRef.current) map.removeLayer(placingMarkerRef.current);
      placingMarkerRef.current = L.marker([lat, lng], { icon: placingIcon }).addTo(map);
      setPlacing(false);
      setNewCoords({ lat, lng });
      map.getContainer().style.cursor = '';
    };
    map.once('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [placing]);

  const surpriseMe = () => {
    if (!filtered.length) return;
    const s = filtered[Math.floor(Math.random() * filtered.length)];
    mapRef.current?.flyTo([s.lat, s.lng], 16, { duration: 0.8 });
    setSelected(s);
  };

  const handleAddSave = (spotData) => {
    onAddSpot?.(spotData);
    if (placingMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(placingMarkerRef.current);
      placingMarkerRef.current = null;
    }
    setNewCoords(null);
  };

  const cancelAdd = () => {
    if (placingMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(placingMarkerRef.current);
      placingMarkerRef.current = null;
    }
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
