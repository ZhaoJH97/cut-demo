import { AudioPlayer } from '@/components/audio-player';
import { samples } from '@/lib/samples';

export function ListeningDemo() {
  return (
    <section className="samples-shell" id="samples">
      <div className="sample-list">
        {samples.map((sample, sampleIndex) => (
          <article className="sample-block" key={sample.id}>
            <header className="sample-header">
              <h2>Example {sampleIndex + 1}</h2>
              <span>Piano · Guitar · Bass · Drums</span>
            </header>
            <div className="comparison-list">
              {sample.versions.map((version) => <AudioPlayer key={version.id} {...version} />)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
