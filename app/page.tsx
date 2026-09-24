import { ListeningDemo } from '@/components/listening-demo';

export default function Home() {
  return (
    <main>
      <header className="paper-header">
        <h1>CUT: Chromatic-temporal U-Transformer for Expressive Multi-track MIDI Parameter Estimation</h1>
        <p className="demo-note">
          <strong>Ground Truth</strong> is the human performance reference; <strong>Ours</strong> is the prediction produced by CUT; <strong>Baseline</strong> is the prediction produced by the basic Transformer model; and <strong>Anchor</strong> uses fixed velocity and fixed note duration without expressive parameter estimation. All audio examples are synthesized from their corresponding MIDI files using the same SoundFont and identical synthesis settings.
        </p>
      </header>
      <ListeningDemo />
    </main>
  );
}
