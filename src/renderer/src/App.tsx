import React from 'react';
import { Dashboard } from './components/Dashboard';

function App(): React.JSX.Element {
  return (
    // "bg-gray-100" entfernt, da Body jetzt die Farbe hat
    <div className="min-h-screen font-sans relative overflow-hidden">
      <Dashboard />
      
      <div className="fixed bottom-2 right-4 text-xs text-slate-500 opacity-50">
        Build with Electron & React
      </div>
    </div>
  );
}

export default App;