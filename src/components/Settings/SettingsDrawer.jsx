import { Settings, User, Moon, Sun, Sparkles, Download, Shield, LogOut, ChevronRight, FileText } from 'lucide-react';
import './SettingsDrawer.css';

export default function SettingsDrawer({ onClose, theme, onToggleTheme, onJoinBeta, admin, onSecretTap, editCount, onExportJson, onSignOut, profile, onRequireAuth }) {
  return (
    <div className="sd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sd-drawer">
        <div className="sd-handle" />
        <div className="sd-header">
          <div className="sd-header-left">
            <Settings size={17} strokeWidth={2} className="sd-header-icon" />
            <span className="sd-title">Paramètres</span>
          </div>
          <button className="sd-close" onClick={onClose}>×</button>
        </div>

        {/* ── Compte ── */}
        <div className="sd-section">
          <div className="sd-section-label">Compte</div>
          {profile ? (
            <>
              <div className="sd-row sd-row--info">
                <div className="sd-avatar" style={{ background: profile.avatar_color }}>
                  {profile.avatar_emoji}
                </div>
                <div className="sd-row-text">
                  <span className="sd-row-title">{profile.username}</span>
                  <span className="sd-row-sub">Connecté</span>
                </div>
              </div>
              <button className="sd-row sd-row--danger" onClick={onSignOut}>
                <div className="sd-icon-wrap"><LogOut size={15} strokeWidth={2} /></div>
                <span className="sd-row-title">Se déconnecter</span>
              </button>
            </>
          ) : (
            <button className="sd-row" onClick={() => { onRequireAuth(); onClose(); }}>
              <div className="sd-icon-wrap"><User size={15} strokeWidth={2} /></div>
              <div className="sd-row-text">
                <span className="sd-row-title">Créer mon profil</span>
                <span className="sd-row-sub">Check-in, avis, communauté</span>
              </div>
              <ChevronRight size={15} className="sd-row-arrow" />
            </button>
          )}
        </div>

        {/* ── Apparence ── */}
        <div className="sd-section">
          <div className="sd-section-label">Apparence</div>
          <div className="sd-row">
            <div className="sd-icon-wrap">
              {theme === 'dark' ? <Moon size={15} strokeWidth={2} /> : <Sun size={15} strokeWidth={2} />}
            </div>
            <div className="sd-row-text">
              <span className="sd-row-title">Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
              <span className="sd-row-sub">Thème actuel de l'app</span>
            </div>
            <button className={`sd-toggle${theme === 'dark' ? ' on' : ''}`} onClick={onToggleTheme}>
              <div className="sd-toggle-thumb" />
            </button>
          </div>
        </div>

        {/* ── Bêta ── */}
        <div className="sd-section">
          <div className="sd-section-label">Bêta & communauté</div>
          <button className="sd-row" onClick={() => { onJoinBeta(); onClose(); }}>
            <div className="sd-icon-wrap sd-icon-wrap--brand"><Sparkles size={15} strokeWidth={2} /></div>
            <div className="sd-row-text">
              <span className="sd-row-title">Rejoindre la bêta</span>
              <span className="sd-row-sub">Accès anticipé · Nouvelles fonctionnalités</span>
            </div>
            <ChevronRight size={15} className="sd-row-arrow" />
          </button>
        </div>

        {/* ── Données (admin only) ── */}
        {editCount > 0 && (
          <div className="sd-section">
            <div className="sd-section-label">Données</div>
            <button className="sd-row" onClick={onExportJson}>
              <div className="sd-icon-wrap"><Download size={15} strokeWidth={2} /></div>
              <div className="sd-row-text">
                <span className="sd-row-title">Exporter mes données</span>
                <span className="sd-row-sub">{editCount} modifications locales</span>
              </div>
              <ChevronRight size={15} className="sd-row-arrow" />
            </button>
          </div>
        )}

        {/* ── Informations ── */}
        <div className="sd-section">
          <div className="sd-section-label">Informations</div>
          <div className="sd-row sd-row--info">
            <div className="sd-icon-wrap"><FileText size={15} strokeWidth={2} /></div>
            <div className="sd-row-text">
              <span className="sd-row-title">Confidentialité & RGPD</span>
              <span className="sd-row-sub">Données personnelles · Cookies</span>
            </div>
          </div>
        </div>

        {/* ── Admin (tap 5x sur le footer pour activer) ── */}
        <button
          className={`sd-admin-row${admin ? ' active' : ''}`}
          onClick={onSecretTap}
        >
          <Shield size={13} strokeWidth={1.5} />
          {admin ? 'Mode admin actif · tap pour désactiver' : 'v1.0 bêta · Toulouse'}
        </button>
      </div>
    </div>
  );
}
