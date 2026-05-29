import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createEvent, updateEvent, deleteEvent } from '../../lib/supabaseAdmin';
import './AdminEventForm.css';

const CATEGORIES = ['DJ Set', 'Concert', 'Happy Hour', 'Afterwork', 'Expo', 'Soirée', 'Brunch', 'Autre'];
const PRICES     = ['Gratuit', '€', '€€', '€€€'];

function field(label, children) {
  return (
    <div className="aef-field">
      <label className="aef-label">{label}</label>
      {children}
    </div>
  );
}

export default function AdminEventForm({ event, onClose, onSaved, onDeleted }) {
  const isEdit = !!event;

  const [form, setForm] = useState({
    title:        event?.title        || '',
    category:     event?.category     || 'DJ Set',
    spot_name:    event?.spot_name    || '',
    quartier:     event?.quartier     || '',
    date:         event?.date         || '',
    time_start:   event?.time_start   || '',
    time_end:     event?.time_end     || '',
    price:        event?.price        || 'Gratuit',
    price_detail: event?.price_detail || '',
    photo_url:    event?.photo_url    || '',
    description:  event?.description  || '',
    link:         event?.link         || '',
    featured:     event?.featured     || false,
  });

  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [error,       setError]       = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est requis.'); return; }
    if (!form.date)          { setError('La date est requise.');  return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, featured: !!form.featured };
      if (isEdit) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setError('Erreur : ' + e.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      onDeleted?.();
      onClose();
    } catch (e) {
      setError('Erreur suppression : ' + e.message);
      setDeleting(false);
    }
  };

  return createPortal(
    <div className="aef-overlay" onClick={onClose}>
      <div className="aef-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="aef-handle" />
        <div className="aef-header">
          <h2 className="aef-title">{isEdit ? '✏️ Modifier l\'événement' : '➕ Nouvel événement'}</h2>
          <button className="aef-close" onClick={onClose}>×</button>
        </div>

        <div className="aef-body">
          {field('Titre *', <input className="aef-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Soirée Techno — Circuit Breaker" />)}
          {field('Catégorie', (
            <select className="aef-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          ))}
          {field('Lieu', <input className="aef-input" value={form.spot_name} onChange={(e) => set('spot_name', e.target.value)} placeholder="Le Rex" />)}
          {field('Quartier', <input className="aef-input" value={form.quartier} onChange={(e) => set('quartier', e.target.value)} placeholder="Capitole" />)}
          {field('Date *', <input className="aef-input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />)}

          <div className="aef-row">
            {field('Heure début', <input className="aef-input" type="time" value={form.time_start} onChange={(e) => set('time_start', e.target.value)} />)}
            {field('Heure fin', <input className="aef-input" type="time" value={form.time_end} onChange={(e) => set('time_end', e.target.value)} />)}
          </div>

          {field('Prix', (
            <select className="aef-input" value={form.price} onChange={(e) => set('price', e.target.value)}>
              {PRICES.map((p) => <option key={p}>{p}</option>)}
            </select>
          ))}
          {field('Détail prix', <input className="aef-input" value={form.price_detail} onChange={(e) => set('price_detail', e.target.value)} placeholder="12€ / gratuit avant 23h30" />)}
          {field('Photo URL', <input className="aef-input" value={form.photo_url} onChange={(e) => set('photo_url', e.target.value)} placeholder="https://..." />)}
          {field('Description', <textarea className="aef-input aef-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description de l'événement..." rows={3} />)}
          {field('Lien / réservation', <input className="aef-input" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="https://..." />)}

          <label className="aef-check-row">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            <span>⭐ Mettre en avant (featured)</span>
          </label>

          {error && <p className="aef-error">{error}</p>}

          <button className="aef-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? '💾 Sauvegarder' : '✅ Créer l\'événement'}
          </button>

          {isEdit && (
            <div className="aef-delete-zone">
              <button
                className={`aef-btn-delete${confirmDel ? ' confirm' : ''}`}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '…' : confirmDel ? '⚠️ Confirmer la suppression' : '🗑️ Supprimer'}
              </button>
              {confirmDel && <button className="aef-btn-cancel" onClick={() => setConfirmDel(false)}>Annuler</button>}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
