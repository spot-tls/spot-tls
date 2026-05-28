import './SplashScreen.css';

const FEATURES = [
  { emoji: '🗺️', label: '60 spots sélectionnés', detail: 'bars, clubs, restos, concerts' },
  { emoji: '⚡', label: 'Filtres par ambiance',    detail: 'chill, branché, chic, underground…' },
  { emoji: '📍', label: 'Autour de moi',            detail: 'spots ouverts près de toi maintenant' },
];

// Particules décoratives (position fixe, animation aléatoire)
const PARTICLES = [
  { x: 12, y: 20, size: 4,  delay: 0,    dur: 4.2 },
  { x: 80, y: 15, size: 3,  delay: 0.8,  dur: 5.1 },
  { x: 25, y: 65, size: 5,  delay: 1.4,  dur: 3.8 },
  { x: 88, y: 55, size: 3,  delay: 0.3,  dur: 6.0 },
  { x: 55, y: 80, size: 4,  delay: 2.0,  dur: 4.7 },
  { x: 70, y: 30, size: 2,  delay: 1.1,  dur: 5.5 },
  { x: 40, y: 10, size: 3,  delay: 0.6,  dur: 4.9 },
  { x: 15, y: 82, size: 5,  delay: 1.8,  dur: 3.6 },
];

export default function SplashScreen({ onDismiss, onJoinBeta }) {
  return (
    <div className="splash">
      {/* Glows décoratifs */}
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <div className="splash-glow splash-glow-3" />

      {/* Particules flottantes */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="splash-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}

      <div className="splash-content">
        {/* Logo / wordmark avec ring */}
        <div className="splash-logo-wrap" style={{ animationDelay: '0s' }}>
          <div className="splash-logo-ring" />
          <div className="splash-logo">
            <span className="splash-logo-spot">Spot</span>
            <span className="splash-logo-fr">FR</span>
            <span className="splash-logo-pin">📍</span>
          </div>
        </div>

        {/* Tagline */}
        <h1 className="splash-title" style={{ '--delay': '.18s' }}>
          Les meilleures<br />sorties à Toulouse
        </h1>
        <p className="splash-sub" style={{ '--delay': '.3s' }}>
          Bars, clubs, restos, concerts…<br />
          filtrés par ambiance, en temps réel.
        </p>

        {/* Feature pills */}
        <div className="splash-features">
          {FEATURES.map((f, i) => (
            <div key={f.label} className="splash-feature" style={{ '--delay': `${0.42 + i * 0.1}s` }}>
              <span className="splash-feature-emoji">{f.emoji}</span>
              <div className="splash-feature-body">
                <span className="splash-feature-label">{f.label}</span>
                <span className="splash-feature-detail">{f.detail}</span>
              </div>
              <span className="splash-feature-check">✓</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="splash-actions" style={{ '--delay': '.76s' }}>
          <div className="splash-cta-wrap">
            <div className="splash-cta-pulse" />
            <button className="splash-cta" onClick={onDismiss}>
              Explorer les spots
              <span className="splash-cta-arrow">→</span>
            </button>
          </div>
          <button className="splash-beta" onClick={() => { onDismiss(); onJoinBeta(); }}>
            Rejoindre la bêta ✨
          </button>
        </div>
      </div>

      {/* Badge bêta discret */}
      <div className="splash-badge">Bêta · Toulouse</div>
    </div>
  );
}
