import Link from 'next/link';

const navItems = [
  { label: 'Oportunidades', href: '#catalogo' },
  { label: 'Instituições', href: '#instituicoes' },
  { label: 'Como funciona', href: '#como-funciona' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-400 text-lg">
            ☁️
          </span>
          <div className="text-lg font-semibold text-white">Nubo Hub</div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition hover:text-white"
              scroll={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <button className="rounded-full px-4 py-2 text-white/80 transition hover:text-white">
            Login
          </button>
          <button className="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 px-5 py-2 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105">
            Começar
          </button>
        </div>
      </div>
    </header>
  );
}
