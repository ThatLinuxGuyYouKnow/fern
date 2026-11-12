import Link from "next/link";

const GREEN = "#1e6b3f";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-2xl font-bold" style={{ color: GREEN }}>
          fern
        </span>
        <Link
          href="/create"
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ background: GREEN }}
        >
          Create your store →
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-5xl font-bold leading-tight">
            Your store,
            <br />
            your way.
          </h1>
          <p className="mt-4 text-neutral-600">
            Name it, pick a template or describe it to AI, add products — get a
            live subdomain storefront with PayPal checkout. Agents can shop it
            too.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/create"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: GREEN }}
            >
              Create your store →
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              className="rounded-full border bg-white px-6 py-3 text-sm font-medium"
            >
              How it works
            </a>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          {[
            ["1", "Name it", "Pick a store name + subdomain slug, add a logo."],
            ["2", "Style it", "Template or one-line AI theme description."],
            ["3", "Stock it", "Form or CSV bulk import, then share the link."],
          ].map(([n, t, s]) => (
            <div key={n} className="flex gap-4 border-b py-4 last:border-0">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: GREEN }}
              >
                {n}
              </span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-neutral-600">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
