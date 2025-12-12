import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

import Header from './components/Header';
import TranscriptionPanel from './components/TranscriptionPanel';
import AnalysisPanel from './components/AnalysisPanel';
import { TranscriptLine, SummaryData, ToneAnalysisData } from './types';
import { summarizeTranscript, askQuestion, translateText, getSuggestedQuestions, analyzeTone } from './services/geminiService';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(1);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ user: string; ai: string }[]>([]);

  const aiRef = useRef<GoogleGenAI | null>(null);
  if (!aiRef.current) {
    if (process.env.API_KEY) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  const addTranscriptLine = useCallback((text: string) => {
    if (text.trim()) {
      setTranscript(prev => [
        ...prev,
        {
          timestamp: new Date(),
          speaker: `S${currentSpeaker}`,
          text,
        },
      ]);
    }
  }, [currentSpeaker]);

  const handleStartStop = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setError(null);
    }
  };

  const handleNewSpeaker = () => {
    setCurrentSpeaker(prev => prev + 1);
  };

  const handleSummarize = async () => {
    if (!aiRef.current || transcript.length === 0) return;
    setIsLoading(true);
    setError(null);
    setSummaryData(null);
    setSuggestedQuestions([]);
    try {
      const fullTranscript = transcript.map(line => `[${line.speaker}] ${line.text}`).join('\n');
      const result = await summarizeTranscript(aiRef.current, fullTranscript);
      setSummaryData(result);
      const questions = await getSuggestedQuestions(aiRef.current, fullTranscript);
      setSuggestedQuestions(questions);
    } catch (e) {
      console.error(e);
      setError('Failed to summarize transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!aiRef.current || !question.trim()) return;
    setIsLoading(true);
    setError(null);
    
    const fullTranscript = transcript.map(line => `[${line.speaker}] ${line.text}`).join('\n');

    try {
      const answer = await askQuestion(aiRef.current, fullTranscript, chatHistory, question);
      setChatHistory(prev => [...prev, { user: question, ai: answer }]);
    } catch (e) {
      console.error(e);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTranslate = async (language: string) => {
    if (!aiRef.current || transcript.length === 0) return '';
    setIsLoading(true);
    setError(null);
    try {
      const fullTranscript = transcript.map(line => line.text).join('\n');
      return await translateText(aiRef.current, fullTranscript, language);
    } catch (e) {
        console.error(e);
        setError(`Failed to translate to ${language}.`);
        return `Error: Could not translate text.`;
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnalyzeTone = async () => {
    if (!aiRef.current || transcript.length === 0) return;
    setIsLoading(true);
    setError(null);
    setToneAnalysis(null);
    try {
      const fullTranscript = transcript.map(line => line.text).join('\n');
      const result = await analyzeTone(aiRef.current, fullTranscript);
      setToneAnalysis(result);
    } catch (e) {
        console.error(e);
        setError(`Failed to analyze tone and context.`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        {error && (
            <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
         {!process.env.API_KEY && (
            <div className="bg-yellow-800 border border-yellow-600 text-white px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Warning: </strong>
                <span className="block sm:inline">API_KEY environment variable not set. AI features will not work.</span>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TranscriptionPanel
            isListening={isListening}
            transcript={transcript}
            onStartStop={handleStartStop}
            onNewSpeaker={handleNewSpeaker}
            onSummarize={handleSummarize}
            addTranscriptLine={addTranscriptLine}
            isLoading={isLoading}
            ai={aiRef.current}
          />
          <AnalysisPanel
            summaryData={summaryData}
            isLoading={isLoading}
            chatHistory={chatHistory}
            onAskQuestion={handleAskQuestion}
            transcript={transcript}
            onTranslate={handleTranslate}
            suggestedQuestions={suggestedQuestions}
            toneAnalysis={toneAnalysis}
            onAnalyzeTone={handleAnalyzeTone}
          />
        </div>
      </main>
    </div>
  );
};

export default App;