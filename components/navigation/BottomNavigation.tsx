'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
}

const tabs: NavTab[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Oportunidades', href: '/oportunidades', icon: Search },
  { label: 'Candidaturas', href: '/candidaturas', icon: FileText },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-active={active ? 'true' : 'false'}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200 ${
                active
                  ? 'text-[#024F86]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#38B1E4] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-all duration-200"
              />
              <span
                className={`text-[10px] font-montserrat leading-tight transition-all duration-200 ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for notch devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
