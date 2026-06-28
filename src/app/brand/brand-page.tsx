"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UnderlineTabs } from "@/shared/ui";
import { DesignGuide } from "./design-guide";
import { LabTab } from "./lab-tab";
import { GlyphRainTab } from "./glyph-rain-lab";

const TABS = [
  { id: "guide", label: "Design Guide" },
  { id: "lab", label: "Lab" },
  { id: "glyph-rain", label: "Glyph Rain" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const isTabId = (value: string | null): value is TabId =>
  TABS.some((tab) => tab.id === value);

export default function BrandPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requested = searchParams.get("tab");
  const activeTab: TabId = isTabId(requested) ? requested : "guide";

  const selectTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "guide") params.delete("tab");
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
          {activeTab === "lab" ? (
            <LabTab />
          ) : activeTab === "glyph-rain" ? (
            <GlyphRainTab />
          ) : (
            <DesignGuide />
          )}
        </div>
      </main>
    </div>
  );
}
