import { useState } from 'react';
import './BetaModal.css';

export default function BetaModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [done, setDone]   = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  return (
    <div className="bm-overlay" onClick={onClose}>
      <div className="bm-card" onClick={(e) => e.stopPropagation()}>

        <button className="bm-close" onClick={onClose} aria-label="Fermer">×</button>

        {!done ? (
          <>
            <h2 className="bm-title">Rejoindre la bêta ✨</h2>
            <p className="bm-desc">
              SpotFR arrive bientôt. Inscris-toi pour être parmi les premiers à tester.
            </p>
            <form className="bm-form" onSubmit={submit}>
              <input
                className="bm-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
              />
              <button type="submit" className="btn-pill bm-submit">
                Je rejoins la bêta
              </button>
            </form>
          </>
        ) : (
          <div className="bm-success">
            <div className="bm-success-emoji">🎉</div>
            <h2 className="bm-success-title">Tu es sur la liste !</h2>
            <p className="bm-success-desc">
              On te préviendra dès que SpotFR ouvre. À très vite&nbsp;✨
            </p>
            <button onClick={onClose} className="btn-pill bm-success-close">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
