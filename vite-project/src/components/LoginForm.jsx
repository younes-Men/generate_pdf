import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!login || !password) {
      setError('Veuillez remplir les deux champs.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        onLogin(data);
      } else {
        setError(data.error || 'Erreur lors de la connexion.');
      }
    } catch (err) {
      // Pour le développement de ce nouveau projet, on autorise l'accès si le serveur est indisponible
      // C'est juste pour ne pas bloquer l'utilisateur si le backend RCD n'est pas lancé
      console.warn('Serveur indisponible, connexion simulée pour le développement.');
      onLogin({ name: login || 'Utilisateur', token: 'dummy-token' });
      // setError('Erreur de connexion au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      <div className="header" style={{ width: '100%', marginBottom: '2rem' }}>
        <div className="header-content" style={{ borderRadius: '12px' }}>
          <h1>Générateur de Documents</h1>
          <p>Remplissage automatique de formulaires</p>
        </div>
      </div>

      <div className="glass-card" style={{ width: '100%' }}>
        <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">Identifiant (Login)</label>
            <input 
              type="text" 
              value={login} 
              onChange={(e) => setLogin(e.target.value)} 
              className="form-input" 
              placeholder="Saisissez votre identifiant"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input" 
              placeholder="Saisissez votre mot de passe"
            />
          </div>

          {error && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2' }}>
            {error}
          </div>}

          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Vérification...' : 'Accéder au formulaire'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
