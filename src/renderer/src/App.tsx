import React, { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';

function App(): React.JSX.Element {
  // Wir beobachten das User-Profil
  const user = useLiveQuery(() => db.userProfile.get('main_user'));

  // Theme Effekt
  useEffect(() => {
    // Standard Theme falls nichts gesetzt
    const theme = user?.activeTheme || 'theme-default';
    
    // WICHTIG: Wir setzen das Attribut auf das HTML Element (root)
    // Das garantiert, dass CSS Variablen überall korrekt überschrieben werden.
    document.documentElement.setAttribute('data-theme', theme);
    
  }, [user?.activeTheme]);

  return (
    <div className="min-h-screen font-sans relative overflow-hidden transition-colors duration-500">
      <Dashboard />
      <div className="fixed bottom-2 right-4 text-xs text-slate-500 opacity-50">
        Alpha v1.1
      </div>
    </div>
  );
}

export default App;