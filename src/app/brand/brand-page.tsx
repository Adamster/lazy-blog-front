"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrandTab } from "./brand-tab";
import { ComponentsTab } from "./components-tab";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const TABS = [
  { id: "brand", label: "Brand" },
  { id: "components", label: "Components" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BrandPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Active tab lives in the URL (`?tab=…`) so it survives refresh / back-forward.
  const requested = searchParams.get("tab");
  const activeTab: TabId = requested === "components" ? "components" : "brand";

  const selectTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "brand") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  // Roving-tabindex arrow navigation across the tablist.
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + TABS.length) % TABS.length;
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
        {/* Mono tab bar — 2px dim baseline, accent underline on the active tab. */}
        <div
          role="tablist"
          aria-label="Brand reference"
          className="mb-10 flex items-stretch gap-7 border-b-2 border-[var(--m-dim)]"
        >
          {TABS.map((tab, index) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={`-mb-0.5 border-b-2 pb-3 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${focusRing} ${
                  isActive
                    ? "border-[var(--m-accent)] text-[var(--m-fg)]"
                    : "border-transparent text-[var(--m-muted2)] hover:text-[var(--m-fg)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "components" ? <ComponentsTab /> : <BrandTab />}
        </div>
      </main>
    </div>
  );
}
