import { useState } from 'react';
import './SplashScreen.css';

/* ── Logo S recréé en SVG inline ── */
function SpotLogo({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2D8B" />
          <stop offset="55%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Glow derrière */}
      <ellipse cx="50" cy="52" rx="34" ry="38" fill="url(#logoGrad)" opacity="0.18" filter="url(#logoGlow)" />
      {/* Lettre S */}
      <text
        x="50" y="72"
        textAnchor="middle"
        fontFamily="'Bricolage Grotesque', 'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="82"
        fill="url(#logoGrad)"
        filter="url(#logoGlow)"
        letterSpacing="-4"
      >S</text>
      {/* Sparks en haut à droite */}
      <line x1="72" y1="14" x2="78" y2="8"  stroke="#FF2D8B" strokeWidth="3" strokeLinecap="round" />
      <line x1="76" y1="22" x2="83" y2="19" stroke="#FF2D8B" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="68" y1="10" x2="70" y2="3"  stroke="#FF2D8B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const SLIDES = [
  {
    emoji: '\U0001f303',
    title: "Toulouse la nuit,\nc'est autre chose.",
    sub: "SpotTLS réunit les meilleurs bars, clubs et concerts\nde la Ville Rose. Triés sur le volet.",
  },
  {
    emoji: '⚡',
    title: "Filtre par ambiance,\npas par catégorie.",
    sub: "Chill, Branché, Chic, Underground…\ntrouve l'endroit qui colle à ton humeur.",
  },
  {
    emoji: '\U0001f378',
    title: "Check-in, note,\npartage ta soirée.",
    sub: "Dis à la communauté où tu es et comment c'est.\nTout ce que tu partages est contrôlé par toi.",
  },
];

const FLOATERS = [
  { e: '\U0001f378', x: 6,  y: 10, s: 1.4, d: 0,   dur: 5.2 },
  { e: '\U0001f3b5', x: 80, y: 6,  s: 1.1, d: 0.7, dur: 6.1 },
  { e: '\U0001f525', x: 16, y: 70, s: 1.2, d: 1.4, dur: 4.8 },
  { e: '\U0001f389', x: 86, y: 58, s: 1.0, d: 0.3, dur: 5.6 },
  { e: '\U0001f3b8', x: 48, y: 80, s: 0.9, d: 2.0, dur: 4.4 },
  { e: '\U0001f31f', x: 70, y: 22, s: 1.3, d: 1.0, dur: 5.9 },
  { e: '\U0001f4cd', x: 33, y: 4,  s: 1.0, d: 0.5, dur: 6.3 },
  { e: '\U0001f942', x: 4,  y: 42, s: 1.1, d: 1.7, dur: 4.7 },
];

export default function SplashScreen({ onDismiss, onJoinBeta }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const s = SLIDES[slide];

  function next() {
    if (isLast) onDismiss();
    else setSlide(v => v + 1);
  }

  return (
    <div className="splash">
      {/* Glows néon de fond */}
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />

      {/* Emojis flottants */}
      {FLOATERS.map((f, i) => (
        <div key={i} className="splash-floater" style={{
          left: `${f.x}%`, top: `${f.y}%`,
          fontSize: `${f.s * 22}px`,
          animationDelay: `${f.d}s`,
          animationDuration: `${f.dur}s`,
        }}>{f.e}</div>
      ))}

      <div className="splash-content">
        {/* Logo S */}
        <div className="splash-logo-wrap">
          <div className="splash-logo-ring" />
          <SpotLogo size={96} />
        </div>

        {/* Slide */}
        <div className="splash-slide" key={slide}>
          <div className="splash-slide-emoji">{s.emoji}</div>
          <h1 className="splash-title" style={{ whiteSpace: 'pre-line' }}>{s.title}</h1>
          <p className="splash-sub" style={{ whiteSpace: 'pre-line' }}>{s.sub}</p>
        </div>

        {/* Dots */}
        <div className="splash-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`splash-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />
          ))}
        </div>

        {/* CTA */}
        <div className="splash-actions">
          <button className="splash-cta" onClick={next}>
            {isLast ? '\U0001f378 Trouver mon spot' : 'Suivant →'}
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
