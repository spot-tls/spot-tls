import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_CONFIG } from '../../utils/config';
import './AddSpotFlow.css';

const CATEGORIES = Object.keys(CATEGORY_CONFIG);
const WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const PRICES = ['€', '€€', '€€€'];

function emptyHours() {
  return WEEK.reduce((acc, d) => ({ ...acc, [d]: null }), {});
}

export default function AddSpotFlow({ coords, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    price: '',
    description: '',
    address: '',
    quartier: '',
    phone: '',
    insta: '',
    website: '',
    reservation_url: '',
    vibe_tags: '',
    hours: emptyHours(),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setHour = (day, type, val) =>
    setForm((f) => ({
      ...f,
      hours: {
        ...f.hours,
        [day]: { ...(f.hours[day] || { open: '', close: '' }), [type]: val },
      },
    }));
  const clearDay = (day) => setForm((f) => ({ ...f, hours: { ...f.hours, [day]: null } }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const tags = form.vibe_tags.split(',').map((t) => t.trim()).filter(Boolean);
    const cleanHours = {};
    WEEK.forEach((d) => {
      const h = form.hours[d];
      if (h && h.open && h.close) cleanHours[d] = { open: h.open, close: h.close };
    });
    onSave({
      ...form,
      lat: coords.lat,
      lng: coords.lng,
      vibe_tags: tags,
      hours: cleanHours,
    });
  };

  const valid = form.name.trim().length > 0;

  return createPortal(
    <div className="asf-overlay" onClick={onCancel}>
      <div className="asf-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="asf-handle" />

        <div className="asf-header">
          <div className="asf-header-row">
            <div>
              <div className="asf-title">➕ Nouveau spot</div>
              <div className="asf-coords">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            </div>
            <button className="asf-close" onClick={onCancel}>×</button>
          </div>
        </div>

        <div className="asf-body">

          {/* Infos principales */}
          <div className="asf-section">
            <div className="asf-section-title">Infos principales</div>

            <div className="asf-field">
              <label className="asf-label">Nom *</label>
              <input className="asf-input" placeholder="Nom du spot"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>

            <div className="asf-field">
              <label className="asf-label">Catégorie</label>
              <select className="asf-input" value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="asf-field">
              <label className="asf-label">Adresse</label>
              <input className="asf-input" placeholder="Adresse complète"
                value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>

            <div className="asf-field">
              <label className="asf-label">Quartier</label>
              <input className="asf-input" placeholder="ex: Capitole"
                value={form.quartier} onChange={(e) => set('quartier', e.target.value)} />
            </div>

            <div className="asf-field">
              <label className="asf-label">Prix</label>
              <div className="asf-price-row">
                {PRICES.map((p) => (
                  <button key={p}
                    className={`asf-price-btn${form.price === p ? ' active' : ''}`}
                    onClick={() => set('price', form.price === p ? '' : p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="asf-field">
              <label className="asf-label">Description</label>
              <textarea className="asf-input asf-textarea" rows={3}
                placeholder="Ambiance, points forts..."
                value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div className="asf-field">
              <label className="asf-label">Vibe tags (séparés par virgule)</label>
              <input className="asf-input" placeholder="cosy, terrasse, branché..."
                value={form.vibe_tags} onChange={(e) => set('vibe_tags', e.target.value)} />
            </div>
          </div>

          {/* Contacts */}
          <div className="asf-section">
            <div className="asf-section-title">Contacts</div>
            <div className="asf-field">
              <label className="asf-label">Téléphone</label>
              <input className="asf-input" type="tel" placeholder="05 61 ..."
                value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="asf-field">
              <label className="asf-label">Instagram</label>
              <input className="asf-input" placeholder="@lespot"
                value={form.insta} onChange={(e) => set('insta', e.target.value)} />
            </div>
            <div className="asf-field">
              <label className="asf-label">Site web</label>
              <input className="asf-input" type="url" placeholder="https://..."
                value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
            <div className="asf-field">
              <label className="asf-label">URL réservation</label>
              <input className="asf-input" type="url" placeholder="https://..."
                value={form.reservation_url} onChange={(e) => set('reservation_url', e.target.value)} />
            </div>
          </div>

          {/* Horaires */}
          <div className="asf-section">
            <div className="asf-section-title">Horaires</div>
            {WEEK.map((day) => {
              const h = form.hours[day];
              return (
                <div key={day} className="asf-hours-row">
                  <span className="asf-hours-day">{day}</span>
                  <div className="asf-hours-inputs">
                    <input type="time" className="asf-time-input"
                      value={h?.open || ''}
                      onChange={(e) => setHour(day, 'open', e.target.value)} />
                    <span className="asf-hours-sep">–</span>
                    <input type="time" className="asf-time-input"
                      value={h?.close || ''}
                      onChange={(e) => setHour(day, 'close', e.target.value)} />
                    {h && <button className="asf-hours-clear" onClick={() => clearDay(day)}>✕</button>}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        <div className="asf-footer">
          <button className="asf-btn-cancel" onClick={onCancel}>Annuler</button>
          <button className="asf-btn-save" onClick={handleSave} disabled={!valid}>
            ➕ Créer le spot
          </