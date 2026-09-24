'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MidiRoll } from '@/components/midi-roll';

type AudioPlayerProps = {
  id: string;
  label: string;
  audio: string;
  midi: string;
  waveform: number[];
  durationSeconds: number;
  tone: 'gt' | 'ours' | 'base' | 'anchor';
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function AudioPlayer({ id, label, audio, midi, waveform, durationSeconds, tone }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const progress = duration ? Math.min(1, time / duration) : 0;

  useEffect(() => {
    const stopOtherPlayers = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id && audioRef.current) audioRef.current.pause();
    };
    window.addEventListener('cut-audio-play', stopOtherPlayers);
    return () => window.removeEventListener('cut-audio-play', stopOtherPlayers);
  }, [id]);

  const toggle = async () => {
    const player = audioRef.current;
    if (!player) return;
    if (player.paused) {
      window.dispatchEvent(new CustomEvent('cut-audio-play', { detail: id }));
      await player.play();
    } else player.pause();
  };

  return (
    <div className={cn('audio-card', `tone-${tone}`, playing && 'is-playing')}>
      <audio
        ref={audioRef}
        src={audio}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setTime(0); }}
      />
      <div className="audio-card-head">
        <span className="version-label">{label}</span>
        <a className="midi-link" href={midi} download aria-label={`Download ${label} MIDI`} title="Download MIDI"><Download /> MIDI</a>
      </div>
      <div className="player-row">
        <Button className="play-button" size="icon-lg" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${label}`}>
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </Button>
        <div className="wave-wrap">
          <div className="waveform" aria-hidden="true">
            {waveform.map((height, index) => <i key={index} className={index / waveform.length <= progress ? 'played' : undefined} style={{ height: `${Math.max(12, height * 100)}%` }} />)}
          </div>
          <input className="seek-range" type="range" min="0" max={duration || 1} step="0.01" value={time} onChange={(e) => { const next = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = next; setTime(next); }} aria-label={`Seek ${label}`} />
        </div>
        <time>{formatTime(time)} <span>/ {formatTime(duration)}</span></time>
      </div>
      <MidiRoll src={midi} currentTime={time} duration={durationSeconds} label={label} />
    </div>
  );
}
