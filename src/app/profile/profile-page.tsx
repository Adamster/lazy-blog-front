"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { useUserById } from "@/features/user/model/use-user-by-id";
import { UpdateAvatar } from "@/features/user/ui/update-avatar";
import { UpdatePasswordForm } from "@/features/user/ui/update-pass-form";
import { UpdateUserForm } from "@/features/user/ui/update-user-form";
import { useUser } from "@/features/user/provider/user-provider";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

const TABS = [
  { id: "profile", label: "Edit profile" },
  { id: "password", label: "Change password" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Profile() {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const { data: userData, isLoading } = useUserById(userId);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active tab lives in the URL (`?tab=…`) so it survives refresh / back-forward.
  const requested = searchParams.get("tab");
  const activeTab: TabId = requested === "password" ? "password" : "profile";

  const selectTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "profile") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  if (isLoading) return <Loading />;

  return (
    <IsAuth fallback={<ErrorMessage error={"Not Found"} />}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10 px-10 pt-10 pb-10 md:flex-row md:gap-0">
        <div className="w-full md:w-3/5 md:pr-10">
          {/* Mono tab bar — 2px dim baseline, accent underline on the active tab. */}
          <div
            role="tablist"
            aria-label="Profile settings"
            className="flex items-stretch gap-7 border-b-2 border-[var(--m-dim)]"
          >
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => selectTab(tab.id)}
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
            className="pt-10"
          >
            {activeTab === "password" ? (
              <UpdatePasswordForm />
            ) : (
              <UpdateUserForm userData={userData} />
            )}
          </div>
        </div>

        <div className="w-full md:w-2/5 md:border-l-2 md:border-[var(--m-dim)] md:pl-10">
          <div className="md:sticky md:top-[5.5rem]">
            <UpdateAvatar userData={userData} />
          </div>
        </div>
      </div>
    </IsAuth>
  );
}
