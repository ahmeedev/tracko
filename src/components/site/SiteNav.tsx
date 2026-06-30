import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#teams", label: "For teams" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/join">
            <Button variant="outline" size="sm">
              Join a project
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="sm">Admin login</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
