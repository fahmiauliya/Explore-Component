// The short intro at the top of the page. Change the text here.
export default function Hero({ onOpenRequest }) {
  return (
    <section className="hero">
      <h1 className="hero__title">Design references, sorted clearly</h1>
      <p className="hero__subtitle">
        A free collection of websites, components, open-source projects and visual resources for designers and builders.
      </p>
      <button type="button" className="button button--dark" onClick={onOpenRequest}>
        Request a reference
      </button>
    </section>
  );
}
