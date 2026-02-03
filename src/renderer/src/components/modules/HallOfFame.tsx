import React, { useState, useMemo } from 'react';
import { Module } from '../../db/db';
import { ModuleItem } from './ModuleItem';
import { 
  Trophy, Search, ArrowDownAZ, ArrowUpAZ, 
  ArrowDown01, ArrowUp01, Filter 
} from 'lucide-react';

interface HallOfFameProps {
  modules: Module[];
  onEdit: (m: Module) => void;
  onUpload: (id: string) => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ modules, onEdit, onUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'grade'>('grade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredModules = useMemo(() => {
    return modules
      .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'title') {
          comp = a.title.localeCompare(b.title);
        } else {
          comp = (a.grade ?? 99) - (b.grade ?? 99);
        }
        return sortDir === 'asc' ? comp : -comp;
      });
  }, [modules, searchTerm, sortBy, sortDir]);

  const toggleSort = (field: 'title' | 'grade') => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3 text-slate-400 shrink-0">
          <Trophy className="text-amber-500" size={24} /> Hall of Fame
        </h2>
        
        {/* Toolbar */}
        <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-full md:w-auto backdrop-blur-sm">
          <div className="relative flex-grow md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Suche..." 
              className="bg-slate-900/50 border border-transparent rounded-lg text-sm text-white pl-10 pr-3 py-2 w-full focus:outline-none focus:border-accent/50 focus:bg-slate-900 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-px h-6 bg-slate-700 mx-1"></div>

          <button 
            onClick={() => toggleSort('title')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'title' ? 'bg-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {sortBy === 'title' && sortDir === 'desc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />}
            <span className="hidden sm:inline">Name</span>
          </button>

          <button 
            onClick={() => toggleSort('grade')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'grade' ? 'bg-accent text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {sortBy === 'grade' && sortDir === 'desc' ? <ArrowDown01 size={14} /> : <ArrowUp01 size={14} />}
            <span className="hidden sm:inline">Note</span>
          </button>
        </div>
      </div>

      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80 hover:opacity-100 transition-opacity">
          {filteredModules.map((mod) => (
            <ModuleItem 
              key={mod.id} 
              module={mod} 
              variant="compact"
              onUploadClick={onUpload} 
              onEditClick={onEdit} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
          <Filter className="mx-auto mb-2 opacity-50" size={32} />
          <p>Keine Module gefunden.</p>
        </div>
      )}
    </div>
  );
};