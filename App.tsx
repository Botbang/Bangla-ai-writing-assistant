
import React, { useState, useEffect, useCallback } from 'react';
import { BanglaEditor } from './components/BanglaEditor';
import { useDebounce } from './hooks/useDebounce';
import { checkBengaliText } from './services/geminiService';
import type { Correction } from './types';

const App: React.FC = () => {
  // FIX: Removed state related to API key management (apiKey, isGeminiReady, modals)
  // to align with backend-only API key configuration.
  const [text, setText] = useState<string>('আমার সোনার বংলা, আমি তোমায় ভালবসি।');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [dictionary, setDictionary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedText = useDebounce(text, 1000);

  useEffect(() => {
    // FIX: Removed API key loading logic from local storage.
    const storedDictionary = localStorage.getItem('bangla_dictionary');
    if (storedDictionary) {
      setDictionary(JSON.parse(storedDictionary));
    }
  }, []);

  useEffect(() => {
    const processText = async () => {
      // FIX: Removed isGeminiReady check as the service is now always initialized on startup.
      if (debouncedText) {
        setIsLoading(true);
        setError(null);
        try {
          const result = await checkBengaliText(debouncedText);
          setCorrections(result);
        } catch (e) {
          console.error(e);
          // FIX: Updated error message to remove mention of API key.
          setError('Failed to get corrections. Please check your network connection.');
          setCorrections([]);
        } finally {
          setIsLoading(false);
        }
      } else if (!debouncedText) {
        setCorrections([]);
        setError(null);
      }
    };
    processText();
  }, [debouncedText]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleAddToDictionary = (word: string) => {
    if (!dictionary.includes(word)) {
        const newDictionary = [...dictionary, word];
        setDictionary(newDictionary);
        localStorage.setItem('bangla_dictionary', JSON.stringify(newDictionary));
    }
  };

  return (
    <>
      {/* FIX: Removed ApiKeyModal and SettingsModal as they are no longer needed. */}
      
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-8">
        <header className="w-full max-w-4xl mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <div className="flex items-center justify-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-wide">
                Gemini Bangla Assistant
              </h1>
            </div>
             {/* FIX: Removed settings button as API key is no longer managed in the UI. */}
          </div>
          <p className="mt-2 text-slate-400 text-center sm:text-left">
            Write Bengali with confidence. Your AI-powered grammar and spelling checker.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg w-full text-center">
              <strong>Error:</strong> {error}
            </div>
          )}
        </header>

        <main className="w-full max-w-4xl">
          {/* FIX: Always render the editor as API key availability is assumed. */}
          <BanglaEditor
            text={text}
            corrections={corrections}
            dictionary={dictionary}
            onTextChange={handleTextChange}
            onAddToDictionary={handleAddToDictionary}
            isLoading={isLoading}
          />
        </main>

        <footer className="w-full max-w-4xl mt-8 text-center text-slate-500 text-sm">
          <p>Powered by Gemini. For educational and demonstrative purposes only.</p>
        </footer>
      </div>
    </>
  );
};

export default App;
