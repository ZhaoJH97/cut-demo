'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';

type RollNote = { time: number; duration: number; midi: number; velocity: number };
type RollTrack = { notes: RollNote[] };
type MidiRollProps = { src: string; currentTime: number; duration: number; label: string };

const trackNames = ['Piano', 'Guitar', 'Bass', 'Drums'];
const trackColors = ['#1f5fbf', '#c65b16', '#177d55', '#75419a'];
const minPitch = 24;
const maxPitch = 84;

function mixWithWhite(hex: string, strength: number) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const amount = Math.max(0, Math.min(1, strength));
  return `rgb(${Math.round(255 - (255 - r) * amount)}, ${Math.round(255 - (255 - g) * amount)}, ${Math.round(255 - (255 - b) * amount)})`;
}

function pitchName(value: number) {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return `${names[value % 12]}${Math.floor(value / 12) - 1}`;
}

function velocityStrength(velocity: number) {
  const normalized = Math.max(0, Math.min(1, (velocity - 0.16) / 0.84));
  return Math.pow(normalized, 1.55);
}

export function MidiRoll({ src, currentTime, duration, label }: MidiRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [tracks, setTracks] = useState<RollTrack[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTracks(null);
    setError(false);
    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load MIDI');
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const midi = new Midi(buffer);
        setTracks(midi.tracks.slice(0, 4).map((track) => ({
          notes: track.notes.map((note) => ({ time: note.time, duration: note.duration, midi: note.midi, velocity: note.velocity })),
        })));
      })
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame || !tracks) return;

    const width = Math.max(320, frame.clientWidth);
    const height = width < 560 ? 476 : 536;
    const ratio = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.textBaseline = 'middle';

    const labelWidth = width < 560 ? 44 : 58;
    const rightPadding = 8;
    const top = 30;
    const drumGap = 13;
    const drumHeight = 86;
    const bottom = 10;
    const pitchedHeight = height - top - drumGap - drumHeight - bottom;
    const plotWidth = width - labelWidth - rightPadding;
    const plotDuration = Math.max(duration, 60);
    const pitchSpan = maxPitch - minPitch + 1;
    const pitchStep = pitchedHeight / pitchSpan;

    for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
      const row = maxPitch - pitch;
      const y = top + row * pitchStep;
      const blackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
      context.fillStyle = blackKey ? '#f2f5f8' : '#ffffff';
      context.fillRect(labelWidth, y, plotWidth, pitchStep + 0.25);

      if (pitch % 12 === 0) {
        context.strokeStyle = '#cbd3dc';
        context.lineWidth = 0.85;
        context.beginPath();
        context.moveTo(labelWidth, y);
        context.lineTo(width - rightPadding, y);
        context.stroke();
        context.fillStyle = '#66717e';
        context.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
        context.fillText(pitchName(pitch), 7, y + pitchStep / 2);
      } else {
        context.strokeStyle = '#edf0f3';
        context.lineWidth = 0.45;
        context.beginPath();
        context.moveTo(labelWidth, y);
        context.lineTo(width - rightPadding, y);
        context.stroke();
      }
    }

    const finalSecond = Math.ceil(plotDuration);
    for (let second = 0; second <= finalSecond; second++) {
      const x = labelWidth + (second / plotDuration) * plotWidth;
      const major = second % 10 === 0;
      const medium = second % 5 === 0;
      context.strokeStyle = major ? '#b9c3ce' : medium ? '#d7dde4' : '#f0f2f5';
      context.lineWidth = major ? 1 : 0.55;
      context.beginPath();
      context.moveTo(x, top - 10);
      context.lineTo(x, height - bottom);
      context.stroke();
      if (major) {
        context.fillStyle = '#616b77';
        context.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
        context.fillText(`${second}s`, x + 3, 10);
      }
    }

    tracks.slice(0, 3).forEach((track, trackIndex) => {
      track.notes.forEach((note) => {
        if (note.midi < minPitch || note.midi > maxPitch) return;
        const x = labelWidth + (note.time / plotDuration) * plotWidth;
        const noteWidth = Math.max(2.4, (note.duration / plotDuration) * plotWidth);
        const centerY = top + (maxPitch - note.midi + 0.5) * pitchStep;
        const strength = velocityStrength(note.velocity);
        const noteHeight = Math.max(2.4, pitchStep * (0.42 + strength * 0.46));
        const y = centerY - noteHeight / 2;

        context.fillStyle = mixWithWhite(trackColors[trackIndex], 0.10 + strength * 0.90);
        context.fillRect(x, y, noteWidth, noteHeight);
        context.strokeStyle = mixWithWhite(trackColors[trackIndex], 0.46 + strength * 0.54);
        context.lineWidth = strength > 0.62 ? 0.8 : 0.45;
        context.strokeRect(x + 0.25, y + 0.25, Math.max(0.5, noteWidth - 0.5), Math.max(0.5, noteHeight - 0.5));
      });
    });

    const drumTop = top + pitchedHeight + drumGap;
    context.fillStyle = '#f5f1f8';
    context.fillRect(labelWidth, drumTop, plotWidth, drumHeight);
    context.strokeStyle = '#d5ccdf';
    context.lineWidth = 1;
    context.strokeRect(labelWidth, drumTop, plotWidth, drumHeight);
    context.fillStyle = trackColors[3];
    context.font = '600 10px Arial, sans-serif';
    context.fillText('Drums', 7, drumTop + drumHeight / 2);

    tracks[3]?.notes.forEach((note) => {
      const x = labelWidth + (note.time / plotDuration) * plotWidth;
      const drumPitch = Math.max(35, Math.min(82, note.midi));
      const centerY = drumTop + 6 + ((82 - drumPitch) / 47) * (drumHeight - 12);
      const strength = velocityStrength(note.velocity);
      const noteHeight = 2.2 + strength * 3.8;
      const noteWidth = Math.max(2.2, (Math.max(note.duration, 0.08) / plotDuration) * plotWidth);
      context.fillStyle = mixWithWhite(trackColors[3], 0.10 + strength * 0.90);
      context.fillRect(x, centerY - noteHeight / 2, noteWidth, noteHeight);
    });

    const playheadX = labelWidth + (Math.min(currentTime, plotDuration) / plotDuration) * plotWidth;
    context.strokeStyle = '#d2222d';
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(playheadX, top - 10);
    context.lineTo(playheadX, height - bottom);
    context.stroke();
  }, [tracks, currentTime, duration]);

  useEffect(() => {
    draw();
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <figure className="midi-figure">
      <div className="midi-figure-head">
        <span>Multi-track MIDI piano roll</span>
        <span className="velocity-key"><span>soft</span><i /><span>loud</span></span>
      </div>
      <div className="midi-canvas-frame" ref={frameRef}>
        {!tracks && !error && <div className="midi-loading">Loading MIDI visualization…</div>}
        {error && <div className="midi-loading">MIDI preview unavailable</div>}
        <canvas ref={canvasRef} role="img" aria-label={`${label} multi-track MIDI piano roll; note length represents duration and color intensity represents velocity`} />
      </div>
      <figcaption>
        <span className="encoding-note">Note length = duration · color intensity and thickness = velocity</span>
        <span className="track-key">{trackNames.map((name, index) => <span key={name}><i style={{ background: trackColors[index] }} />{name}</span>)}</span>
      </figcaption>
    </figure>
  );
}
