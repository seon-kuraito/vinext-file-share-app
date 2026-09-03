const links = [
  {
    href: "https://github.com/cloudflare/vinext",
    label: "vinext",
  },
  {
    href: "https://developers.cloudflare.com/workers/",
    label: "Workers",
  },
];

export const revalidate = 300;

export default function Home() {
  return (
    <main className="page">
      <section className="page__inner">
        <div className="hero">
          <p className="hero__eyebrow">vinext + Cloudflare Workers</p>
          <h1 className="hero__title">
            Build Next.js-style apps with Vite and deploy them to the edge.
          </h1>
          <p className="hero__lead">
            This App Router project is wired for vinext and Cloudflare Workers.
          </p>
        </div>

        <div className="cards">
          <div className="card">
            <h2 className="card__title">Develop</h2>
            <p className="card__text">Run the vinext dev server locally.</p>
            <code className="card__code">pnpm run dev</code>
          </div>
          <div className="card">
            <h2 className="card__title">Build</h2>
            <p className="card__text">Create Worker-ready production output.</p>
            <code className="card__code">pnpm run build</code>
          </div>
          <div className="card">
            <h2 className="card__title">Deploy</h2>
            <p className="card__text">Ship the generated Worker with Wrangler.</p>
            <code className="card__code">pnpm run deploy</code>
          </div>
        </div>

        <nav className="links">
          {links.map((link) => (
            <a
              className="links__item"
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
          <a className="links__item" href="/api/hello">
            API route
          </a>
        </nav>
      </section>
    </main>
  );
}
