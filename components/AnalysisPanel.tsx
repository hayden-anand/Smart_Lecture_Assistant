import React, { useState, useEffect, useRef } from 'react';
import { SummaryData, TranscriptLine, AnalysisTab, ToneAnalysisData } from '../types';
import { Icon } from './Icon';
import { SUPPORTED_LANGUAGES } from '../constants';

interface AnalysisPanelProps {
  summaryData: SummaryData | null;
  isLoading: boolean;
  chatHistory: { user: string; ai: string }[];
  onAskQuestion: (question: string) => void;
  transcript: TranscriptLine[];
  onTranslate: (language: string) => Promise<string>;
  suggestedQuestions: string[];
  toneAnalysis: ToneAnalysisData | null;
  onAnalyzeTone: () => void;
}

const TabButton: React.FC<{
  iconName: string;
  label: AnalysisTab;
  activeTab: AnalysisTab;
  onClick: (tab: AnalysisTab) => void;
  disabled?: boolean;
}> = ({ iconName, label, activeTab, onClick, disabled = false }) => (
  <button
    onClick={() => !disabled && onClick(label)}
    disabled={disabled}
    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      activeTab === label
        ? 'bg-indigo-600 text-white'
        : 'text-slate-300 hover:bg-slate-700/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-current={activeTab === label ? 'page' : undefined}
  >
    <Icon name={iconName} className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const AnalysisView: React.FC<{ summaryData: SummaryData | null }> = ({ summaryData }) => {
    if (!summaryData) {
        return (
            <div className="text-center text-slate-500 pt-10">
                <Icon name="analysis" className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p>Click "Summarize Transcript" to generate analysis and notes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h3 className="text-lg font-semibold text-sky-400 mb-2">Summary</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {summaryData.summary.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-sky-400 mb-2">Key Terms</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {summaryData.key_terms.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-sky-400 mb-2">Action Items</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {summaryData.action_items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
    );
};

const QandAView: React.FC<{
    chatHistory: { user: string; ai: string }[];
    onAskQuestion: (question: string) => void;
    isLoading: boolean;
    suggestedQuestions: string[];
}> = ({ chatHistory, onAskQuestion, isLoading, suggestedQuestions }) => {
    const [question, setQuestion] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && !isLoading) {
            onAskQuestion(question);
            setQuestion('');
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                {chatHistory.length === 0 && suggestedQuestions.length > 0 && (
                    <div className="text-left text-slate-400 p-4 bg-slate-900/50 rounded-lg animate-fade-in">
                      <h4 className="font-semibold text-slate-300 mb-3">Suggested Questions:</h4>
                      <div className="flex flex-col items-start gap-2">
                        {suggestedQuestions.map((q, i) => (
                          <button key={i} onClick={() => setQuestion(q)} className="text-left bg-slate-700/50 hover:bg-slate-700 p-2 rounded-md transition-colors w-full">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                )}
                {chatHistory.length === 0 && suggestedQuestions.length === 0 &&(
                    <div className="text-center text-slate-500 pt-10">
                        <Icon name="qa" className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                        <p>Ask a question about the transcript.</p>
                    </div>
                )}
                {chatHistory.map((chat, index) => (
                    <React.Fragment key={index}>
                        <div className="flex justify-end">
                            <div className="bg-indigo-600 rounded-lg p-3 max-w-sm">
                                <p>{chat.user}</p>
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="flex items-start gap-2.5">
                                <div className="bg-slate-900 rounded-full p-2 self-start flex-shrink-0">
                                    <Icon name="ai" className="w-6 h-6 text-sky-400"/>
                                </div>
                                <div className="bg-slate-700 rounded-lg p-3 max-w-sm">
                                    <p>{chat.ai}</p>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                {isLoading && chatHistory.length > 0 && (
                     <div className="flex justify-start">
                        <div className="flex items-start gap-2.5">
                            <div className="bg-slate-900 rounded-full p-2 self-start flex-shrink-0">
                                <Icon name="ai" className="w-6 h-6 text-sky-400"/>
                            </div>
                            <div className="bg-slate-700 rounded-lg p-3 max-w-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef}></div>
            </div>
            <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about the transcript..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
                <button type="submit" disabled={isLoading || !question.trim()} className="bg-indigo-600 p-3 rounded-lg hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition">
                    <Icon name="send" className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};

const ToneAnalysisView: React.FC<{
    toneAnalysis: ToneAnalysisData | null;
    onAnalyzeTone: () => void;
    isLoading: boolean;
    hasTranscript: boolean;
}> = ({ toneAnalysis, onAnalyzeTone, isLoading, hasTranscript }) => {
    if (!hasTranscript) {
        return <div className="text-center text-slate-500 pt-10"><p>A transcript is required to analyze tone.</p></div>;
    }
    
    if (isLoading && !toneAnalysis) {
        return (
             <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!toneAnalysis) {
        return (
            <div className="text-center pt-10">
                <Icon name="context" className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 mb-4">Analyze the lecture's tone, context, and mood.</p>
                <button
                    onClick={onAnalyzeTone}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 transition mx-auto"
                >
                    <Icon name="context" className="w-5 h-5"/>
                    Analyze Tone & Context
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">Tone</h4>
                    <p className="text-xl font-bold text-sky-400">{toneAnalysis.tone}</p>
                </div>
                 <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">Context</h4>
                    <p className="text-xl font-bold text-sky-400">{toneAnalysis.context}</p>
                </div>
                 <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">Mood</h4>
                    <p className="text-xl font-bold text-sky-400">{toneAnalysis.mood}</p>
                </div>
            </div>
        </div>
    );
};

const ExportTranslateView: React.FC<{
    transcript: TranscriptLine[];
    summaryData: SummaryData | null;
    isLoading: boolean;
    onTranslate: (language: string) => Promise<string>;
}> = ({ transcript, summaryData, isLoading, onTranslate }) => {
    const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0].code);
    const [translatedText, setTranslatedText] = useState('');

    const generateMarkdown = () => {
        let md = `# Lecture Notes - ${new Date().toLocaleDateString()}\n\n`;
        if (summaryData) {
            md += `## Summary\n${summaryData.summary.map(s => `- ${s}`).join('\n')}\n\n`;
            md += `## Key Terms\n${summaryData.key_terms.map(t => `- ${t}`).join('\n')}\n\n`;
            md += `## Action Items\n${summaryData.action_items.map(a => `- ${a}`).join('\n')}\n\n`;
        }
        md += `## Full Transcript\n`;
        md += transcript.map(line => `**[${line.speaker}]**: ${line.text}`).join('\n');
        return md;
    };
    
    const downloadFile = (content: string, filename: string, mime: string) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleExportMarkdown = () => {
        const md = generateMarkdown();
        downloadFile(md, 'lecture_notes.md', 'text/markdown');
    };

    const handleExportRichText = () => {
        const text = generateMarkdown().replace(/## (.*?)\n/g, '$1\n\n').replace(/# (.*?)\n/g, '$1\n\n').replace(/- /g, '• ');
        downloadFile(text, 'lecture_notes.txt', 'text/plain');
    };

    const handleTranslateClick = async () => {
        setTranslatedText('');
        const result = await onTranslate(selectedLanguage);
        setTranslatedText(result);
    };

    return (
        <div className="space-y-6">
            <div>
                 <h3 className="text-lg font-semibold text-sky-400 mb-4">Export</h3>
                 <div className="flex gap-4">
                    <button onClick={handleExportRichText} disabled={transcript.length === 0} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 transition">
                        <Icon name="export" className="w-5 h-5"/>
                        Export as Rich Text
                    </button>
                    <button onClick={handleExportMarkdown} disabled={transcript.length === 0} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 transition">
                       <Icon name="export" className="w-5 h-5"/>
                        Export to Markdown
                    </button>
                 </div>
            </div>
            <hr className="border-slate-700" />
            <div>
                <h3 className="text-lg font-semibold text-sky-400 mb-4">Translate Transcript</h3>
                <div className="flex items-center gap-4 mb-4">
                     <select 
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition w-full">
                         {SUPPORTED_LANGUAGES.map(lang => (
                             <option key={lang.code} value={lang.code}>{lang.name}</option>
                         ))}
                     </select>
                     <button 
                        onClick={handleTranslateClick}
                        disabled={isLoading || transcript.length === 0}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 transition">
                        {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> : <Icon name="translate" className="w-5 h-5"/>}
                        Translate
                    </button>
                </div>
                {translatedText && (
                    <div className="bg-slate-900/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <h4 className="font-semibold mb-2">Translation to {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}:</h4>
                        <p className="text-slate-300 whitespace-pre-wrap">{translatedText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const AnalysisPanel: React.FC<AnalysisPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(AnalysisTab.Analysis);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 flex flex-col h-[85vh]">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold mb-1">AI Analysis & Notes</h2>
        <p className="text-slate-400 mb-6">Generate summaries, track topics, and ask questions.</p>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4 overflow-x-auto">
          <TabButton iconName="analysis" label={AnalysisTab.Analysis} activeTab={activeTab} onClick={setActiveTab} />
          <TabButton iconName="qa" label={AnalysisTab.QA} activeTab={activeTab} onClick={setActiveTab} />
          <TabButton iconName="voice" label={AnalysisTab.VoiceQA} activeTab={activeTab} onClick={setActiveTab} disabled />
          <TabButton iconName="tts" label={AnalysisTab.TextToSpeech} activeTab={activeTab} onClick={setActiveTab} disabled />
          <TabButton iconName="context" label={AnalysisTab.ContextTone} activeTab={activeTab} onClick={setActiveTab} />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto mt-4 pr-2 -mr-2 mb-6">
         {activeTab === AnalysisTab.Analysis && <AnalysisView summaryData={props.summaryData} />}
         {activeTab === AnalysisTab.QA && <QandAView chatHistory={props.chatHistory} onAskQuestion={props.onAskQuestion} isLoading={props.isLoading} suggestedQuestions={props.suggestedQuestions} />}
         {activeTab === AnalysisTab.ContextTone && <ToneAnalysisView toneAnalysis={props.toneAnalysis} onAnalyzeTone={props.onAnalyzeTone} isLoading={props.isLoading} hasTranscript={props.transcript.length > 0} />}
      </div>
       <div className="flex-shrink-0 mt-auto pt-6 border-t border-slate-700">
          <ExportTranslateView {...props} />
       </div>
    </div>
  );
};

export default AnalysisPanel;