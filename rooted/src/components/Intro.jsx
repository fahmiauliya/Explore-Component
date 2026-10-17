// The three short lines under the header. Change the intro text here.
export default function Intro({ onOpenRequest }) {
  return (
    <section className="intro container">
      <p className="intro__kicker">Design references, sorted clearly</p>
      <p>
        A free collection of websites, components, open-source projects and visual resources for designers and
        builders. Hand-picked and kept simple.
      </p>
      <p>
        Missing something?{' '}
        <button type="button" className="link-button" onClick={onOpenRequest}>
          Request a reference
        </button>
        .
      </p>
    </section>
  );
}
