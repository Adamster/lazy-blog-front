import { FireIcon, BoltIcon } from "@heroicons/react/24/solid";

/**
 * "This Month" stats panel for the home page.
 *
 * NOTE: there is no stats API yet — this renders a placeholder layout that is
 * structurally ready to receive real data later (most popular post / most
 * active user of the month). When the endpoint exists, pass the resolved values
 * into `StatCell` via props and drop the `pending` flag.
 */

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  title?: string;
  meta?: string;
  pending?: boolean;
  className?: string;
}

function StatCell({
  icon,
  label,
  title,
  meta,
  pending = false,
  className = "",
}: StatCellProps) {
  return (
    <div className={`flex flex-col gap-3 p-5 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
        <span className="text-acid">{icon}</span>
        {label}
      </div>

      {pending ? (
        <div className="flex flex-col gap-2">
          <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-xs tracking-[0.15em] text-zinc-400 uppercase dark:text-zinc-500">
            Coming soon
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          <span className="font-display truncate text-xl font-bold">
            {title}
          </span>
          {meta && (
            <span className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {meta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function HomeStats() {
  return (
    <section className="border-ink dark:border-paper mb-10 border-2">
      <div className="border-ink bg-ink dark:border-paper dark:bg-paper border-b-2 px-4 py-2">
        <h2 className="font-display text-paper dark:text-ink text-sm font-bold tracking-[0.2em] uppercase">
          This Month
        </h2>
      </div>

      <div className="grid sm:grid-cols-2">
        <StatCell
          icon={<FireIcon className="h-4 w-4" />}
          label="Most popular post"
          pending
        />
        <StatCell
          icon={<BoltIcon className="h-4 w-4" />}
          label="Most active user"
          pending
          className="border-ink dark:border-paper border-t-2 sm:border-t-0 sm:border-l-2"
        />
      </div>
    </section>
  );
}
