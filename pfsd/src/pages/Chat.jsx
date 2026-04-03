import React, { useState, useRef, useEffect, useCallback } from 'react';
import { localApi } from '@/api/localApiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RotateCcw, FileText, Loader2, Mic, MicOff, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatMessage from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import CrisisModal from '../components/shared/CrisisModal';
import { useLanguage, LANGUAGES } from '../components/shared/LanguageContext';
import { toast } from '@/components/ui/use-toast';

const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'want to die', 'end my life', 'hopeless', 'no reason to live', 'self harm', 'hurt myself'];

export default function Chat() {
  const { t, language } = useLanguage();
  const currentUserName = null;
  const messagesRef = useRef([]);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef(0);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('chat.welcome'), sentiment: null }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Voice/Mic state
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ---- VOICE ----
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setMicError('Speech recognition not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES[language]?.speech || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => { setMicError(`Mic error: ${e.error}`); setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMicError(null);
  }, [language]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ---- CAMERA ----
  const openCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      setCameraError('Camera permission denied.');
    }
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    setAnalyzingPhoto(true);

    try {
      const result = await localApi.chat.analyzePhoto(dataUrl);
      setAnalyzingPhoto(false);
      setCapturedPhoto(null);
      const aiMsg = `📸 [Photo shared] I can see you look ${result.detected_mood}. ${result.brief_observation}`;
      handleSend(aiMsg, true);
    } catch (error) {
      console.error('Photo analysis failed:', error);
      setAnalyzingPhoto(false);
      setCapturedPhoto(null);
      alert('Unable to analyze photo. Please try again.');
    }
  };

  // ---- CHAT ----
  const detectCrisis = (text) => {
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
  };

  const handleSend = async (text, isSystem = false) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    if (!isSystem && isTyping) {
      return;
    }

    setInput('');

    if (!isSystem && detectCrisis(messageText)) {
      setShowCrisis(true);
      toast({
        title: t('notifications.supportAlertTitle'),
        description: t('notifications.supportAlertDesc'),
        variant: 'destructive',
      });
    }

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setThinkingLabel('AI is thinking...');

    const requestId = ++requestIdRef.current;
    activeRequestRef.current = requestId;

    try {
      const nextHistory = [...messagesRef.current, userMessage]
        .filter((m) => m && m.role && m.content)
        .map((m) => ({ role: m.role, content: m.content, emotion: m.emotion }));

      const response = await localApi.chat.send(
        messageText,
        nextHistory,
        language,
        { userEmail: 'anonymous', userName: currentUserName }
      );

      setIsTyping(false);
      setThinkingLabel('');

      if (activeRequestRef.current !== requestId) {
        return;
      }

      const fullText = response.response || '';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullText,
        sentiment: response.detected_sentiment,
        emotion: response.emotion || response.detected_sentiment || 'neutral',
        sentiment_score: response.sentiment_score
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setThinkingLabel('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting to the backend right now. Please try again in a moment.",
        sentiment: 'neutral',
        sentiment_score: 0
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping) {
        handleSend();
      }
    }
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: t('chat.freshStart'), sentiment: null }]);
    setSummary(null);
  };

  const generateSummary = async () => {
    if (messages.length < 3) return;
    setLoadingSummary(true);
    try {
      // Just create a simple summary from messages
      const topics = new Set();
      const emotions = new Set();
      messages.forEach(m => {
        if (m.sentiment) emotions.add(m.sentiment);
        // Simple topic extraction
        const words = m.content.toLowerCase().split(' ');
        words.slice(0, 3).forEach(w => topics.add(w));
      });

      setSummary({
        topics: Array.from(topics).slice(0, 5),
        emotions_detected: Array.from(emotions),
        key_insight: 'You shared your feelings and concerns. Keep practicing self-awareness.',
        suggested_actions: [
          'Continue journaling your thoughts',
          'Practice the breathing exercises',
          'Take a mindful break'
        ],
        overall_tone: 'Reflective and open'
      });
    } catch (error) {
      console.error('Summary generation failed:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const QUICK_PROMPTS = [
    t('chat.placeholder').includes('...') ? "I'm feeling anxious today" : "I'm feeling anxious today",
    "I need motivation",
    "Help me relax",
    "I want to talk about my day",
  ];

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center animate-pulse-glow shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800 dark:text-gray-100">{t('chat.title')}</h1>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                {t('chat.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex gap-1 items-center">
            {messages.length > 2 && (
              <Button variant="ghost" size="sm" onClick={generateSummary} disabled={loadingSummary}
                className="text-gray-400 hover:text-purple-600 text-xs rounded-xl">
                {loadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><FileText className="w-3.5 h-3.5 mr-1" />{t('chat.summary')}</>}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={resetChat} className="text-gray-400 hover:text-gray-600">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
          {isTyping && <TypingIndicator />}
          {isTyping && (
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2">{thinkingLabel}</div>
          )}
          {analyzingPhoto && (
            <div className="flex items-center gap-2 text-sm text-purple-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your photo...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 md:px-6 pb-2">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button key={i} onClick={() => !isTyping && handleSend(prompt)}
                disabled={isTyping}
                className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative bg-black rounded-3xl overflow-hidden max-w-sm w-full">
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full" style={{ transform: 'scaleX(-1)', maxHeight: '400px', objectFit: 'cover' }} />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent">
                <button onClick={closeCamera}
                  className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={captureAndAnalyze}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      {(micError || cameraError) && (
        <div className="flex-shrink-0 px-4 md:px-6">
          <div className="max-w-3xl mx-auto bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2 text-xs text-red-600 dark:text-red-400">
            {micError || cameraError}
          </div>
        </div>
      )}

      {/* Summary Panel */}
      {summary && (
        <div className="flex-shrink-0 px-4 md:px-6 pb-2">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Conversation Summary
              </p>
              <button onClick={() => setSummary(null)} className="text-gray-400 text-xs hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><span className="font-medium">Tone:</span> {summary.overall_tone}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><span className="font-medium">Key Insight:</span> {summary.key_insight}</p>
            {summary.suggested_actions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {summary.suggested_actions.map((a, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 border border-purple-100 dark:border-purple-800">{a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          {/* Camera button */}
          <button onClick={openCamera}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
            <Camera className="w-4 h-4" />
          </button>

          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? t('chat.listening') : t('chat.placeholder')}
              className={`w-full rounded-xl border-purple-100 dark:border-purple-900 focus:border-purple-400 bg-white dark:bg-gray-800 pr-10 ${isListening ? 'border-red-300 dark:border-red-700' : ''}`}
              disabled={isTyping}
            />
            {isListening && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Mic button */}
          <button onClick={toggleMic}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40'
            }`}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <Button onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90 rounded-xl px-4 h-10">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isListening && (
          <p className="text-center text-xs text-red-500 mt-1.5 animate-pulse">{t('chat.listening')}</p>
        )}
      </div>

      <CrisisModal open={showCrisis} onClose={() => setShowCrisis(false)} />
    </div>
  );
}