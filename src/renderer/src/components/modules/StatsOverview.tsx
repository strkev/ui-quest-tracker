import React from 'react';
import { GraduationCap } from 'lucide-react';

interface StatsOverviewProps {
  finishedCount: number;
  totalModules: number;
  totalCP: number;
  averageGrade: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  finishedCount, 
  totalModules, 
  totalCP, 
  averageGrade 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {/* Semester Progress Card */}
      <div className="pixel-card bg-slate-800 p-6 md:col-span-2 flex flex-col justify-center shadow-lg border-slate-700">
        <div className="flex justify-between text-xs mb-3 text-slate-400 font-bold uppercase tracking-wider">
          <span>Semester Progress</span>
          <span>{finishedCount} / {totalModules} Modules</span>
        </div>
        <progress 
          className="nes-progress is-primary h-6 w-full" 
          value={finishedCount} 
          max={Math.max(totalModules, 1)}
        ></progress>
      </div>

      {/* CP & GPA Card */}
      <div className="pixel-card bg-slate-800 p-4 flex justify-around items-center divide-x divide-slate-700 shadow-lg border-slate-700">
        <div className="flex flex-col items-center px-4 w-1/2">
          <span className="text-3xl font-black text-amber-400 drop-shadow-sm">{totalCP}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total CP</span>
        </div>
        <div className="flex flex-col items-center px-4 w-1/2">
          <div className="flex items-center gap-2 text-accent">
            <GraduationCap size={28} />
            <span className="text-3xl font-black">{averageGrade}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Ø Note (GPA)</span>
        </div>
      </div>
    </div>
  );
};