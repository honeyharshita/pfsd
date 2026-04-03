import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Clock, Sparkles, Headphones, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sessions = [
  { id: 1, title: 'Morning Calm', duration: 5, emoji: '🌅', color: 'from-amber-400 to-orange-500', musicId: 'jfKfPfyJRdk', musicDesc: 'Lofi Morning Vibes', instructions: ['Sit comfortably', 'Set intention for the day', 'Focus on gratitude'] },
  { id: 2, title: 'Stress Relief', duration: 10, emoji: '🌊', color: 'from-blue-400 to-cyan-500', musicId: 'q76bMs-NwRk', musicDesc: 'Ocean Wave Sounds', instructions: ['Feel tension leaving your body', 'Breathe out stress', 'Let thoughts drift away'] },
  { id: 3, title: 'Deep Relaxation', duration: 15, emoji: '🧘', color: 'from-purple-400 to-indigo-500', musicId: 'lTRiuFIWV54', musicDesc: 'Deep Meditation Piano', instructions: ['Relax every muscle', 'Sink into stillness', 'Be present in this moment'] },
  { id: 4, title: 'Sleep Well', duration: 20, emoji: '🌙', color: 'from-indigo-400 to-violet-500', musicId: '1ZYbU82GVz4', musicDesc: 'Sleep Meditation Music', instructions: ['Let your eyelids grow heavy', 'Release the day', 'Drift into peaceful sleep'] },
  { id: 5, title: 'Focus Boost', duration: 10, emoji: '🎯', color: 'from-teal-400 to-green-500', musicId: '5qap5aO4i9A', musicDesc: 'Lofi Focus Music', instructions: ['Clear your mind', 'Set one clear goal', 'Channel your energy'] },
  { id: 6, title: 'Anxiety Ease', duration: 8, emoji: '🦋', color: 'from-pink-400 to-rose-500', musicId: 'yIQd2Ya0Ziw', musicDesc: 'Anxiety Relief Sounds', instructions: ['Breathe slowly and deeply', 'Ground yourself in the present', 'You are safe and calm'] },
];

const musicPlaylists = [
  { id: 1, title: 'Peaceful Piano', emoji: '🎹', desc: 'Soft piano melodies for deep calm', musicId: 'jfKfPfyJRdk' },
  { id: 2, title: 'Nature Sounds', emoji: '🌿', desc: 'Rain, birds, and ocean waves', musicId: 'q76bMs-NwRk' },
  { id: 3, title: 'Ambient Space', emoji: '🌌', desc: 'Deep ambient textures for focus', musicId: 'UfcAVejslrU' },
  { id: 4, title: 'Healing Frequencies', emoji: '🔔', desc: '432Hz & binaural beats', musicId: '1ZYbU82GVz4' },
  { id: 5, title: 'Lo-Fi Chill', emoji: '🎧', desc: 'Relaxing lo-fi beats', musicId: '5qap5aO4i9A' },
];

export default function Meditation() {
  const [activeSession, setActiveSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [activeMusicId, setActiveMusicId] = useState(null);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { setIsPlaying(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      const breathInterval = setInterval(() => {
        setBreathPhase(p => p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale');
      }, 4000);
      return () => { clearInterval(intervalRef.current); clearInterval(breathInterval); };
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, timeLeft]);

  const startSession = (session) => {
    setActiveSession(session);
    setTimeLeft(session.duration * 60);
    setIsPlaying(true);
    setActiveMusicId(session.musicId);
    setActivePlaylist(null);
  };

  const endSession = () => {
    setActiveSession(null);
    setIsPlaying(false);
    setActiveMusicId(null);
  };

  const openPlaylist = (playlist) => {
    setActivePlaylist(playlist);
    setActiveMusicId(playlist.musicId);
    setActiveSession(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const breathText = {
    inhale: 'Breathe in slowly... 🌬️',
    hold: 'Hold gently... ✨',
    exhale: 'Release slowly... 🍃',
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-500" /> Meditation & Music
          </h1>
          <p className="text-gray-500 mt-1">Guided meditation with matching music for each session</p>
        </div>

        {/* Active Session */}
        <AnimatePresence>
          {activeSession && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 md:p-8 mb-10">
              <div className="text-center">
                {/* Breathing circle */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ scale: breathPhase === 'inhale' ? 1.4 : breathPhase === 'hold' ? 1.4 : 1, opacity: breathPhase === 'hold' ? 0.8 : 1 }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className={`w-44 h-44 rounded-full bg-gradient-to-br ${activeSession.color} flex items-center justify-center shadow-2xl`}
                  >
                    <div className="text-white text-center">
                      <p className="text-3xl mb-1">{activeSession.emoji}</p>
                      <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
                      <p className="text-xs opacity-80 capitalize">{isPlaying ? breathPhase : 'Paused'}</p>
                    </div>
                  </motion.div>
                </div>

                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{activeSession.title}</h2>
                <p className="text-sm text-purple-500 mb-4">{isPlaying ? breathText[breathPhase] : 'Paused — press play to continue'}</p>

                {/* Session tips */}
                <div className="flex justify-center gap-3 flex-wrap mb-6">
                  {activeSession.instructions.map((tip, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 bg-white/50 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300">{tip}</span>
                  ))}
                </div>

                <div className="flex justify-center gap-3 mb-6">
                  <Button onClick={() => setIsPlaying(!isPlaying)}
                    className={`rounded-full w-14 h-14 bg-gradient-to-br ${activeSession.color} shadow-lg`}>
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                  </Button>
                  <Button variant="outline" onClick={endSession} className="rounded-xl px-5">
                    <X className="w-4 h-4 mr-1" /> End
                  </Button>
                  <Button variant="ghost" onClick={() => setMusicEnabled(!musicEnabled)}
                    className={cn("rounded-xl px-4", musicEnabled ? "text-purple-600" : "text-gray-400")}>
                    {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* Music Player */}
              {musicEnabled && activeMusicId && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-4 h-4 text-purple-500" />
                    <p className="text-xs font-medium text-gray-500">Now playing: <span className="text-purple-600 dark:text-purple-400">{activeSession.musicDesc}</span></p>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black" style={{ height: 80 }}>
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activeMusicId}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                      allow="autoplay; encrypted-media"
                      className="w-full"
                      style={{ height: 80, border: 'none' }}
                      title="Meditation Music"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Player (when no session active) */}
        <AnimatePresence>
          {activePlaylist && !activeSession && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activePlaylist.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{activePlaylist.title}</p>
                    <p className="text-xs text-gray-500">{activePlaylist.desc}</p>
                  </div>
                </div>
                <button onClick={() => { setActivePlaylist(null); setActiveMusicId(null); }}
                  className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activePlaylist.musicId}?autoplay=1&controls=1&rel=0&modestbranding=1`}
                  allow="autoplay; encrypted-media"
                  className="w-full"
                  style={{ height: 90, border: 'none' }}
                  title={activePlaylist.title}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions Grid */}
        <div className="mb-10">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Guided Sessions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <motion.button key={session.id} whileHover={{ y: -3 }} onClick={() => startSession(session)}
                className={cn("glass-card rounded-2xl p-5 text-left hover:shadow-lg transition-all border-2",
                  activeSession?.id === session.id ? "border-purple-300 dark:border-purple-600" : "border-transparent"
                )}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${session.color} flex items-center justify-center mb-3 text-2xl shadow-lg`}>
                  {session.emoji}
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{session.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" /> {session.duration} min
                </div>
                <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
                  <Headphones className="w-3 h-3" /> {session.musicDesc}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Music Playlists */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-purple-500" /> Calming Music
            <span className="text-xs text-gray-400 font-normal ml-2">Click to play in background</span>
          </h2>
          <div className="space-y-3">
            {musicPlaylists.map((playlist) => (
              <motion.div key={playlist.id} whileHover={{ x: 4 }}
                className={cn("glass-card rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all border-2",
                  activePlaylist?.id === playlist.id ? "border-purple-300 dark:border-purple-600" : "border-transparent"
                )}
                onClick={() => openPlaylist(playlist)}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{playlist.emoji}</span>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">{playlist.title}</h4>
                    <p className="text-sm text-gray-500">{playlist.desc}</p>
                  </div>
                </div>
                <Button size="sm" variant={activePlaylist?.id === playlist.id ? "default" : "outline"} className="rounded-xl">
                  {activePlaylist?.id === playlist.id ? <><Volume2 className="w-3.5 h-3.5 mr-1" /> Playing</> : <><Play className="w-3.5 h-3.5 mr-1" /> Play</>}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}