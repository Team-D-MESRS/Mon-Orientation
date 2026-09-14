'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PAGES_INFORMATION } from './navigation';

export function NavInformations() {
  const pathname = usePathname();
  return (
    <nav aria-label="Pages d'information" className="print:hidden">
      <ul className="flex flex-wrap lg:flex-col gap-2v lg:sticky lg:top-24">
        {PAGES_INFORMATION.map(({ href, label }) => {
          const actif = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? 'page' : undefined}
                className={`block px-3v py-2v rounded-bj-sm text-sm font-medium transition-colors ${
                  actif ? 'bg-bj-green text-white' : 'bg-white border border-bj-gray-925 text-bj-gray-200 hover:border-bj-green'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
