import React, { useState, useEffect, useCallback } from 'react';
import { BanglaEditor } from './components/BanglaEditor';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SettingsModal } from './components/SettingsModal';
import { useDebounce } from './hooks/useDebounce';
import { checkBengaliText, initializeGeminiClient } from './services/geminiService';
import type { Correction } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGeminiReady, setIsGeminiReady] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  const [text, setText] = useState<string>('আমার সোনার বংলা, আমি তোমায় ভালবসি।');
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [dictionary, setDictionary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedText = useDebounce(text, 1000);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      handleSaveApiKey(storedApiKey);
    } else {
      setIsApiKeyModalOpen(true);
    }

    const storedDictionary = localStorage.getItem('bangla_dictionary');
    if (storedDictionary) {
      setDictionary(JSON.parse(storedDictionary));
    }
  }, []);

  useEffect(() => {
    const processText = async () => {
      if (isGeminiReady && debouncedText) {
        setIsLoading(true);
        setError(null);
        try {
          const result = await checkBengaliText(debouncedText);
          setCorrections(result);
        } catch (e) {
          console.error(e);
          setError('Failed to get corrections. Please check your API key and network connection.');
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
  }, [debouncedText, isGeminiReady]);

  const handleSaveApiKey = (newApiKey: string) => {
    setError(null);
    try {
        initializeGeminiClient(newApiKey);
        localStorage.setItem('gemini_api_key', newApiKey);
        setApiKey(newApiKey);
        setIsGeminiReady(true);
        setIsApiKeyModalOpen(false);
        setIsSettingsModalOpen(false);
    } catch(e) {
        console.error(e);
        setError("Failed to initialize Gemini. The API key might be invalid.");
        setIsGeminiReady(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
    setIsGeminiReady(false);
    setIsSettingsModalOpen(false);
    setIsApiKeyModalOpen(true);
  };

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
      {isApiKeyModalOpen && <ApiKeyModal onSave={handleSaveApiKey} error={error} />}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          currentApiKey={apiKey || ''}
          onSave={handleSaveApiKey}
          onClear={handleClearApiKey}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
      
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
             {apiKey && (
                 <button onClick={() => setIsSettingsModalOpen(true)} className="mt-4 sm:mt-0 p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors" aria-label="Open settings">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                 </button>
             )}
          </div>
          <p className="mt-2 text-slate-400 text-center sm:text-left">
            Write Bengali with confidence. Your AI-powered grammar and spelling checker.
          </p>
          {error && !isApiKeyModalOpen && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg w-full text-center">
              <strong>Error:</strong> {error}
            </div>
          )}
        </header>

        <main className="w-full max-w-4xl">
          {isGeminiReady ? (
            <BanglaEditor
              text={text}
              corrections={corrections}
              dictionary={dictionary}
              onTextChange={handleTextChange}
              onAddToDictionary={handleAddToDictionary}
              isLoading={isLoading}
            />
          ) : (
             !error && !isApiKeyModalOpen && (
                <div className="text-center p-8 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-lg">Waiting for API Key...</p>
                </div>
             )
          )}
        </main>

        <footer className="w-full max-w-4xl mt-8 text-center text-slate-500 text-sm">
          <p>Powered by Gemini. For educational and demonstrative purposes only.</p>
        </footer>
      </div>
    </>
  );
};

export default App;