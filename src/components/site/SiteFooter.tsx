import Link from "next/link";
import { Wallet } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-stone-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Wallet className="size-5" strokeWidth={2.5} />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Track<span className="text-brand-400">o</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Project-wise expense and budget tracking. Admins own the numbers,
              teams log spend through a single shared key — no extra accounts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Product"
              items={[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how" },
                { label: "For teams", href: "#teams" },
              ]}
            />
            <FooterCol
              title="Get started"
              items={[
                { label: "Admin login", href: "/admin" },
                { label: "Join a project", href: "/join" },
              ]}
            />
            <FooterCol
              title="Account"
              items={[{ label: "Create admin", href: "/admin/signup" }]}
            />
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Tracko. Built for tidy budgets.</p>
          <p>Powered by Next.js + AWS</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-sm text-stone-300 transition-colors hover:text-brand-400"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
