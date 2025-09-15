import React, { useState, useRef, useMemo } from 'react';
import type { Correction } from '../types';

interface SuggestionPopoverProps {
  correction: Correction;
  position: { top: number; left: number };
  onApply: (correction: Correction) => void;
  onClose: () => void;
  onIgnore: () => void;
  onAddToDictionary: (word: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SuggestionPopover: React.FC<SuggestionPopoverProps> = ({ 
    correction, position, onApply, onClose, onIgnore, onAddToDictionary, onMouseEnter, onMouseLeave 
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  return (
    <div
      ref={popoverRef}
      style={{ top: position.top, left: position.left, maxWidth: '20rem' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-20 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-3 text-sm flex flex-col space-y-2"
    >
      <p className="font-semibold text-slate-300">সংশোধন:</p>
      <button
        onClick={() => onApply(correction)}
        className="w-full text-left px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-300 rounded-md transition-colors"
      >
        {correction.correct}
      </button>
      <p className="text-xs text-slate-400 italic border-t border-slate-700 pt-2">{correction.explanation}</p>
      <div className="flex items-center space-x-2 pt-2 border-t border-slate-700">
        <button
          onClick={onIgnore}
          className="flex-1 text-center px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors"
        >
         উপেক্ষা করুন
        </button>
         <button
          onClick={() => onAddToDictionary(correction.incorrect)}
          className="flex-1 text-center px-2 py-1 bg-sky-700 hover:bg-sky-600 text-sky-200 text-xs rounded-md transition-colors"
        >
          ডিকশনারিতে যোগ করুন
        </button>
      </div>
    </div>
  );
};


interface BanglaEditorProps {
  text: string;
  corrections: Correction[];
  dictionary: string[];
  onTextChange: (newText: string) => void;
  onAddToDictionary: (word: string) => void;
  isLoading: boolean;
}

export const BanglaEditor: React.FC<BanglaEditorProps> = ({ text, corrections, dictionary, onTextChange, onAddToDictionary, isLoading }) => {
  const [activeCorrection, setActiveCorrection] = useState<{ correction: Correction; index: number } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const displayRef = useRef<HTMLDivElement>(null);
  const hidePopoverTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleCorrectionApply = (correctionToApply: Correction) => {
      onTextChange(text.replace(correctionToApply.incorrect, correctionToApply.correct));
      setActiveCorrection(null);
  };

  const handleAddToDictionaryAndClose = (word: string) => {
    onAddToDictionary(word);
    setActiveCorrection(null);
  }
  
  const handleHighlightMouseEnter = (correction: Correction, index: number, event: React.MouseEvent) => {
    if (hidePopoverTimeout.current) {
      clearTimeout(hidePopoverTimeout.current);
      hidePopoverTimeout.current = null;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const displayRect = displayRef.current?.getBoundingClientRect();
    if(!displayRect) return;

    setPopoverPosition({
      top: rect.bottom - displayRect.top + window.scrollY + 5,
      left: rect.left - displayRect.left + window.scrollX,
    });
    setActiveCorrection({ correction, index });
  };
  
  const handleMouseLeaveWithDelay = () => {
      hidePopoverTimeout.current = setTimeout(() => {
          setActiveCorrection(null);
      }, 200); // 200ms delay to allow moving mouse to popover
  };

  const filteredCorrections = useMemo(() => {
    return corrections.filter(c => !dictionary.includes(c.incorrect));
  }, [corrections, dictionary]);

  const handleFixAll = () => {
    const sortedCorrections = [...filteredCorrections].sort((a, b) => b.incorrect.length - a.incorrect.length);

    let newText = text;
    sortedCorrections.forEach(correction => {
        newText = newText.split(correction.incorrect).join(correction.correct);
    });
    
    onTextChange(newText);
    setActiveCorrection(null);
  };

  const renderedText = useMemo(() => {
    if (!filteredCorrections.length) {
      return text;
    }
    
    const incorrectPhrases = filteredCorrections.map(c => c.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const validPhrases = incorrectPhrases.filter(phrase => phrase.length > 0);
    if (validPhrases.length === 0) return text;
    
    const regex = new RegExp(`(${validPhrases.join('|')})`, 'g');
    const parts = text.split(regex);
    let errorIndex = 0;

    return parts.map((part, i) => {
      const correction = filteredCorrections.find(c => c.incorrect === part);
      if (correction) {
        const currentIndex = errorIndex++;
        return (
          <span
            key={`${i}-${currentIndex}`}
            className="bg-red-500/30 hover:bg-red-500/40 cursor-pointer rounded px-1 py-0.5 transition-colors"
            onMouseEnter={(e) => handleHighlightMouseEnter(correction, currentIndex, e)}
            onMouseLeave={handleMouseLeaveWithDelay}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [text, filteredCorrections]);


  return (
    <div className="relative bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
             <h2 className="text-lg font-bold text-emerald-400">
                বাংলা এডিটর
             </h2>
             <div className="flex items-center space-x-4">
                {filteredCorrections.length > 0 && !isLoading && (
                    <button 
                        onClick={handleFixAll}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span>সব ঠিক করুন</span>
                    </button>
                )}
                 {isLoading && (
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>পরীক্ষা চলছে...</span>
                    </div>
                 )}
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-700">
            <div className="p-4 bg-slate-800 md:rounded-bl-xl">
                 <textarea
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder="এখানে লিখুন..."
                    className="w-full h-64 md:h-96 p-2 bg-slate-900/50 border border-slate-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base leading-relaxed"
                 />
            </div>
            
            <div ref={displayRef} className="relative p-4 bg-slate-800 md:rounded-br-xl">
                <div className="w-full h-64 md:h-96 p-2 bg-slate-900/50 border border-transparent rounded-md text-base leading-relaxed whitespace-pre-wrap">
                    {renderedText}
                </div>
                 {activeCorrection && (
                    <SuggestionPopover
                        correction={activeCorrection.correction}
                        position={popoverPosition}
                        onApply={handleCorrectionApply}
                        onClose={() => setActiveCorrection(null)}
                        onIgnore={() => setActiveCorrection(null)}
                        onAddToDictionary={handleAddToDictionaryAndClose}
                        onMouseEnter={() => {
                            if (hidePopoverTimeout.current) {
                                clearTimeout(hidePopoverTimeout.current);
                                hidePopoverTimeout.current = null;
                            }
                        }}
                        onMouseLeave={handleMouseLeaveWithDelay}
                    />
                )}
            </div>
        </div>
        <div className="p-2 border-t border-slate-700 text-center text-xs text-slate-500">
            <p><strong>বাম:</strong> আপনার লেখা | <strong>ডান:</strong> AI বিশ্লেষণ ও পরামর্শ (ভুলের উপর হোভার করুন)</p>
        </div>
    </div>
  );
};
