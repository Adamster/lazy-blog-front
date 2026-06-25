"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UnderlineTabs } from "@/shared/ui";
import { BrandTab } from "./brand-tab";
import { ComponentsTab } from "./components-tab";
import { LabTab } from "./lab-tab";

const TABS = [
  { id: "brand", label: "Brand" },
  { id: "components", label: "Components" },
  { id: "lab", label: "Lab" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const isTabId = (value: string | null): value is TabId =>
  TABS.some((tab) => tab.id === value);

export default function BrandPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active tab lives in the URL (`?tab=…`) so it survives refresh / back-forward.
  const requested = searchParams.get("tab");
  const activeTab: TabId = isTabId(requested) ? requested : "brand";

  const selectTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "brand") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div
      className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <main className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
        {/* Mono tab bar — 2px dim baseline, accent underline on the active tab. */}
        <UnderlineTabs
          className="mb-10"
          ariaLabel="Brand reference"
          tabs={TABS}
          current={activeTab}
          onSelect={selectTab}
          panelIdPrefix="panel-"
        />

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "components" ? (
            <ComponentsTab />
          ) : activeTab === "lab" ? (
            <LabTab />
          ) : (
            <BrandTab />
          )}
        </div>
      </main>
    </div>
  );
}
