import React, { useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, Modality, LiveServerMessage, Blob } from '@google/genai';
import { TranscriptLine } from '../types';
import { Icon } from './Icon';

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Based on Gemini documentation
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

interface TranscriptionPanelProps {
  isListening: boolean;
  transcript: TranscriptLine[];
  onStartStop: () => void;
  onNewSpeaker: () => void;
  onSummarize: () => void;
  addTranscriptLine: (text: string) => void;
  isLoading: boolean;
  ai: GoogleGenAI | null;
}

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  isListening,
  transcript,
  onStartStop,
  onNewSpeaker,
  onSummarize,
  addTranscriptLine,
  isLoading,
  ai
}) => {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentTranscriptionRef = useRef('');

  const cleanupAudio = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
  }, []);

  const stopTranscription = useCallback(async () => {
    cleanupAudio();
    if(sessionRef.current){
        const session = await sessionRef.current;
        session.close();
        sessionRef.current = null;
    }
  }, [cleanupAudio]);

  useEffect(() => {
    if (isListening && ai && !sessionRef.current) {
      const startTranscription = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          
          sessionRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
              onopen: () => {
                 mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
                 scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                 
                 scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                     const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                     const pcmBlob = createBlob(inputData);
                     if (sessionRef.current) {
                         sessionRef.current.then((session) => {
                             session.sendRealtimeInput({ media: pcmBlob });
                         });
                     }
                 };

                 mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                 scriptProcessorRef.current.connect(audioContextRef.current.destination);
              },
              // FIX: Correctly accumulate transcription chunks and handle turnComplete.
              onmessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                  const text = message.serverContent.inputTranscription.text;
                  currentTranscriptionRef.current += text;
                }
                if (message.serverContent?.turnComplete) {
                  if (currentTranscriptionRef.current.trim()) {
                    addTranscriptLine(currentTranscriptionRef.current);
                  }
                  currentTranscriptionRef.current = '';
                }
              },
              onerror: (e: ErrorEvent) => {
                console.error('Live session error:', e);
                stopTranscription();
              },
              onclose: (e: CloseEvent) => {
                console.log('Live session closed');
                cleanupAudio();
              },
            },
            config: {
              responseModalities: [Modality.AUDIO], // required, though we ignore audio output
              inputAudioTranscription: {},
            },
          });
        } catch (error) {
          console.error('Failed to start transcription:', error);
          onStartStop(); // Toggle back the state
        }
      };
      startTranscription();
    } else if (!isListening && sessionRef.current) {
      stopTranscription();
    }
  // FIX: Added missing dependencies to prevent stale closures.
  }, [isListening, ai, addTranscriptLine, onStartStop, stopTranscription, cleanupAudio]);

  useEffect(() => {
    return () => {
        if (isListening) {
           stopTranscription();
        }
    };
  }, [isListening, stopTranscription]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 flex flex-col h-[85vh]">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold mb-1">Live Transcription</h2>
        <p className="text-slate-400 mb-6">Visualizing the soundscape of your lecture.</p>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={onStartStop}
            disabled={!ai}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } disabled:bg-slate-600 disabled:cursor-not-allowed`}
          >
            <Icon name={isListening ? 'stop' : 'start'} className="w-5 h-5" />
            <span>{isListening ? 'Stop' : 'Start'}</span>
          </button>
          <button 
            onClick={onNewSpeaker}
            className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 bg-sky-600/80 hover:bg-sky-700 transition-colors duration-200">
            <Icon name="speaker" className="w-5 h-5" />
            <span>New Speaker</span>
          </button>
          <div className="flex-grow"></div>
          <button 
            onClick={onSummarize}
            disabled={transcript.length === 0 || isLoading}
            className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 bg-slate-700 hover:bg-slate-600 transition-colors duration-200 disabled:bg-slate-600/50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : (
                <Icon name="summarize" className="w-5 h-5" />
            )}
            <span>Summarize Transcript</span>
          </button>
        </div>
        <hr className="border-slate-700" />
      </div>
      <div className="flex-grow overflow-y-auto mt-4 pr-2 -mr-2">
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>{isListening ? "Listening..." : "Click 'Start' to begin transcription."}</p>
          </div>
        ) : (
          transcript.map((line, index) => (
            <p key={index} className="mb-3">
              <span className="text-sky-400 font-mono text-sm">
                [{formatTimestamp(line.timestamp)}]
              </span>
              <span className="text-indigo-400 font-semibold ml-2">[{line.speaker}]</span>
              <span className="ml-2 text-slate-200">{line.text}</span>
            </p>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};

export default TranscriptionPanel;