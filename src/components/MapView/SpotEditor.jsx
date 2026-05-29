/**
 * SpotEditor — fiche d'édition inline d'un spot.
 * S'ouvre depuis SpotDetail via le bouton ✏️.
 * Les modifications sont sauvegardées en localStorage (via saveEdit).
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateSpot } from '../../lib/supabaseAdmin';
import './SpotEditor.css';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const CATEGORIES = [
  'Boîte / club', 'Bar à cocktails', 'Pub', 'Brunch / café',
  'Restaurant', 'Concerts / lives', 'Bar à jeux / Gaming',
  'Karaoké', 'Bar à vin', 'Expo / spectacle',
];
const PRICES = ['€', '€€', '€€€'];

function Field({ label, children }) {
  return (
    <div className="spe-field">
      <label className="spe-label">{label}</label>
      {children}
    </div>
  );
}

export default function SpotEditor({ spot, onClose, onSave, admin }) {
  const [form, setForm] = useState({
    name:            spot.name || '',
    category:        spot.category || '',
    description:     spot.description || '',
    phone:           spot.phone || '',
    insta:           spot.insta || '',
    website:         spot.website || '',
    reservation_url: spot.reservation_url || '',
    price:           spot.price || '€€',
    vibe_tags:       (spot.vibe_tags || []).join(', '),
    hours:           spot.hours ? JSON.parse(JSON.stringify(spot.hours)) : Object.fromEntries(DAYS.map(d => [d, null])),
    photo_url:       spot.photo_url || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setHour = (day, field, val) => {
    setForm((f) => {
      const hours = { ...f.hours };
      if (!val && field === 'open') {
        // Si on efface l'ouverture → jour fermé
        hours[day] = null;
      } else {
        hours[day] = { ...(hours[day] || { open: '', close: '' }), [field]: val };
        // Si les deux sont vides → fermé
        if (!hours[day].open && !hours[day].close) hours[day] = null;
      }
      return { ...f, hours };
    });
  };

  const handleSave = async () => {
    const vibe_tags = form.vibe_tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fields = {
      name:            form.name.trim(),
      category:        form.category,
      description:     form.description.trim(),
      phone:           form.phone.trim(),
      insta:           form.insta.trim(),
      website:         form.website.trim(),
      reservation_url: form.reservation_url.trim(),
      price:           form.price,
      vibe_tags,
      hours:           form.hours,
      photo_url:       form.photo_url.trim(),
    };

    setSaving(true);
    if (admin && spot.id) {
      try { await updateSpot(spot.id, fields); } catch (e) { console.error('updateSpot error:', e); }
    }
    onSave(fields);
    onClose();
  };

  return createPortal(
    <div className="spe-overlay" onClick={onClose}>
      <div className="spe-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="spe-header">
          <div className="spe-handle" />
          <div className="spe-header-row">
            <span className="spe-title">✏️ Modifier le spot</span>
            <button className="spe-close" onClick={onClose}>×</button>
          </div>
          <div className="spe-spot-name">{spot.name}</div>
        </div>

        {/* Form body */}
        <div className="spe-body">

          {/* Infos générales */}
          <div className="spe-section">
            <div className="spe-section-title">Infos générales</div>

            <Field label="Nom">
              <input className="spe-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nom du spot" />
            </Field>

            <Field label="Catégorie">
              <select className="spe-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Prix">
              <div className="spe-price-row">
                {PRICES.map((p) => (
                  <button
                    key={p}
                    className={`spe-price-btn${form.price === p ? ' active' : ''}`}
                    onClick={() => set('price', p)}
                  >{p}</button>
                ))}
              </div>
            </Field>

            <Field label="Description">
              <textarea
                className="spe-input spe-textarea"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Description du spot…"
                rows={3}
              />
            </Field>

            <Field label="Vibe tags (séparés par des virgules)">
              <input
                className="spe-input"
                value={form.vibe_tags}
                onChange={(e) => set('vibe_tags', e.target.value)}
                placeholder="cosy, terrasse, dansant…"
              />
            </Field>

            <Field label="🖼️ Photo URL">
              <input
                className="spe-input"
                value={form.photo_url}
                onChange={(e) => set('photo_url', e.target.value)}
                placeholder="https://images.unsplash.com/…"
              />
              {form.photo_url && (
                <img
                  src={form.photo_url}
                  alt="preview"
                  style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 10 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </Field>
          </div>

          {/* Contacts */}
          <div className="spe-section">
            <div className="spe-section-title">Contacts &amp; liens</div>

            <Field label="📞 Téléphone">
              <input className="spe-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="05 61 XX XX XX" />
            </Field>

            <Field label="📸 Instagram (compte ou URL)">
              <input className="spe-input" value={form.insta} onChange={(e) => set('insta', e.target.value)} placeholder="@lespot ou https://instagram.com/…" />
            </Field>

            <Field label="🌐 Site web">
              <input className="spe-input" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
            </Field>

            <Field label="🗓️ Lien réservation (TheFork, Shotgun…)">
              <input className="spe-input" value={form.reservation_url} onChange={(e) => set('reservation_url', e.target.value)} placeholder="https://…" />
            </Field>
          </div>

          {/* Horaires */}
          <div className="spe-section">
            <div className="spe-section-title">Horaires</div>
            <div className="spe-hours-hint">Laisser vide = fermé ce jour-là</div>
            {DAYS.map((day) => {
              const h = form.hours[day];
              return (
                <div key={day} className="spe-hours-row">
                  <span className="spe-hours-day">{day}</span>
                  <div className="spe-hours-inputs">
                    <input
                      className="spe-time-input"
                      type="time"
                      value={h?.open || ''}
                      onChange={(e) => setHour(day, 'open', e.target.value)}
                      placeholder="--:--"
                    />
                    <span className="spe-hours-sep">–</span>
                    <input
                      className="spe-time-input"
                      type="time"
                      value={h?.close || ''}
                      onChange={(e) => setHour(day, 'close', e.target.value)}
                      placeholder="--:--"
                    />
                  </div>
                  {h && (
                    <button className="spe-hours-clear" onClick={() => setForm((f) => ({ ...f, hours: { ...f.hours, [day]: null } }))}>✕</button>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer CTA */}
        <div className="spe-footer">
          <button className="spe-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="spe-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : '💾 Sauvegarder'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
