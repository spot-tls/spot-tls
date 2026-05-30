import { useState } from 'react';
import './SplashScreen.css';

const SLIDES = [
  {
    emoji: '🏙️',
    title: "Toulouse la nuit,\nc’est autre chose.",
    sub: "SpotTLS réunit les meilleurs bars, clubs et concerts\nde la Ville Rose. Triés sur le volet.",
    accent: '#EC4899',
  },
  {
    emoji: '⚡',
    title: "Filtre par ambiance,\npas par catégorie.",
    sub: "Chill, Branché, Chic, Underground…\ntrouve l’endroit qui colle à ton humeur du moment.",
    accent: '#A78BFA',
  },
  {
    emoji: '🍸',
    title: "Check-in, note,\npartage ta soirée.",
    sub: "Dis à la communauté où tu es et comment c’est.\nTout ce qui est partagé est contrôlé par toi.",
    accent: '#F59E0B',
  },
];

const FLOATERS = [
  { e: '🍸', x: 8,  y: 12, s: 1.4, d: 0,   dur: 5.2 },
  { e: '🎵', x: 82, y: 8,  s: 1.1, d: 0.7, dur: 6.1 },
  { e: '🔥', x: 18, y: 72, s: 1.2, d: 1.4, dur: 4.8 },
  { e: '🎉', x: 88, y: 60, s: 1.0, d: 0.3, dur: 5.6 },
  { e: '🎸', x: 50, y: 82, s: 0.9, d: 2.0, dur: 4.4 },
  { e: '🌟', x: 72, y: 25, s: 1.3, d: 1.0, dur: 5.9 },
  { e: '📍', x: 35, y: 6,  s: 1.0, d: 0.5, dur: 6.3 },
  { e: '🥂', x: 6,  y: 45, s: 1.1, d: 1.7, dur: 4.7 },
];

export default function SplashScreen({ onDismiss, onJoinBeta }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const s = SLIDES[slide];

  function next() {
    if (isLast) { onDismiss(); }
    else setSlide(v => v + 1);
  }

  return (
    <div className="splash">
      <div className="splash-glow splash-glow-1" style={{ background: s.accent + '40' }} />
      <div className="splash-glow splash-glow-2" />

      {FLOATERS.map((f, i) => (
        <div key={i} className="splash-floater" style={{
          left: `${f.x}%`, top: `${f.y}%`,
          fontSize: `${f.s * 22}px`,
          animationDelay: `${f.d}s`,
          animationDuration: `${f.dur}s`,
        }}>{f.e}</div>
      ))}

      <div className="splash-content">
        <div className="splash-logo-wrap">
          <div className="splash-logo-ring" />
          <div className="splash-logo">
            <span className="splash-logo-spot">Spot</span>
            <span className="splash-logo-tls">TLS</span>
          </div>
        </div>

        <div className="splash-slide" key={slide}>
          <div className="splash-slide-emoji">{s.emoji}</div>
          <h1 className="splash-title" style={{ whiteSpace: 'pre-line' }}>{s.title}</h1>
          <p className="splash-sub" style={{ whiteSpace: 'pre-line' }}>{s.sub}</p>
        </div>

        <div className="splash-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`splash-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />
          ))}
        </div>

        <div className="splash-actions">
          <button className="splash-cta" onClick={next}>
            {isLast ? '🏙️ Trouver mon spot' : 'Suivant →'}
          </button>
          {slide === 0 && (
            <button className="splash-skip" onClick={onDismiss}>Passer</button>
          )}
        </div>

        <p className="splash-legal">
          En utilisant SpotTLS, tu acceptes nos{' '}
          <a href="/legal.html" target="_blank" rel="noopener">CGU</a>
          {' '}et notre{' '}
          <a href="/privacy.html" target="_blank" rel="noopener">Politique de confidentialité</a>.
        </p>
      </div>

      <div className="splash-badge">Beta · Toulouse 2025</div>
    </div>
  );
}
