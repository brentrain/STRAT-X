
import React from 'react';
import { Patient, CardiacRhythm } from '../types';
import { RHYTHM_PARAMS } from '../constants';

interface CategorizedRhythmMenuProps {
  allRhythms: CardiacRhythm[];
  activeRhythm: CardiacRhythm;
  onSetRhythm: (rhythm: CardiacRhythm) => void;
}

const RHYTHM_CATEGORIES: Record<string, CardiacRhythm[]> = {
    'Sinus Rhythms': ['NSR', 'SINUS_TACHYCARDIA', 'SINUS_BRADYCARDIA'],
    'Atrial Rhythms': ['ATRIAL_FIBRILLATION', 'ATRIAL_FLUTTER', 'SVT'],
    'AV Blocks': ['FIRST_DEGREE_AV_BLOCK', 'SECOND_DEGREE_AV_BLOCK_TYPE_I', 'SECOND_DEGREE_AV_BLOCK_TYPE_II', 'THIRD_DEGREE_AV_BLOCK'],
    'Ventricular & Lethal': ['VT', 'VENTRICULAR_FIBRILLATION', 'TORSADES_DE_POINTES', 'ASYSTOLE'],
};

const CategoryButton: React.FC<{
  rhythm: CardiacRhythm;
  activeRhythm: CardiacRhythm;
  onSetRhythm: (rhythm: CardiacRhythm) => void;
}> = ({ rhythm, activeRhythm, onSetRhythm }) => {
  const params = RHYTHM_PARAMS[rhythm];
  const isActive = activeRhythm === rhythm;

  let buttonClass = 'bg-slate-600 hover:bg-slate-500 text-slate-200 hover:text-white focus:ring-sky-400';
  if (isActive) {
    buttonClass = 'bg-sky-600 text-white cursor-default ring-sky-500';
  } else if (params?.isLethal) {
    buttonClass = 'border border-red-500/50 hover:bg-red-600 text-red-300 hover:text-white';
  } else if (params?.displayName.includes('Block') || params?.displayName.includes('Flutter')) {
    buttonClass = 'border border-orange-500/50 hover:bg-orange-600 text-orange-300 hover:text-white';
  } else if (params?.displayName.includes('Fib') || params?.displayName.includes('SVT')) {
    buttonClass = 'border border-amber-500/50 hover:bg-amber-600 text-amber-300 hover:text-white';
  }

  return (
    <button
      key={rhythm}
      onClick={() => onSetRhythm(rhythm)}
      disabled={isActive}
      className={`p-2 text-xs font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-70 w-full text-center ${buttonClass}`}
      title={`Set rhythm to ${params?.displayName || rhythm}`}
    >
      {params?.displayName || rhythm}
    </button>
  );
};


const CategorizedRhythmMenu: React.FC<CategorizedRhythmMenuProps> = ({ allRhythms, activeRhythm, onSetRhythm }) => {

  const categorizedRhythms = RHYTHM_CATEGORIES;
  const uncategorizedRhythms = allRhythms.filter(r => !Object.values(categorizedRhythms).flat().includes(r));

  return (
    <div className="space-y-3">
        {Object.entries(categorizedRhythms).map(([category, rhythms]) => (
            <details key={category} className="group" open={category.includes('Sinus')}>
                <summary className="text-md font-medium text-slate-300 list-none cursor-pointer group-hover:text-sky-400 transition-colors">
                    <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 transform transition-transform duration-200 group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {category}
                    </span>
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-2 pl-3">
                    {rhythms.map(rhythm => (
                        <CategoryButton key={rhythm} rhythm={rhythm} activeRhythm={activeRhythm} onSetRhythm={onSetRhythm} />
                    ))}
                </div>
            </details>
        ))}
         {uncategorizedRhythms.length > 0 && (
             <details className="group">
                <summary className="text-md font-medium text-slate-300 list-none cursor-pointer group-hover:text-sky-400 transition-colors">
                     <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 transform transition-transform duration-200 group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Other
                    </span>
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-2 pl-3">
                    {uncategorizedRhythms.map(rhythm => (
                        <CategoryButton key={rhythm} rhythm={rhythm} activeRhythm={activeRhythm} onSetRhythm={onSetRhythm} />
                    ))}
                </div>
            </details>
         )}
    </div>
  );
};

export default CategorizedRhythmMenu;
