"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IsAuth, useUser, useUserById } from "@/entities/session";
import { EditProfileTopBar } from "@/features/user/ui/edit-profile-top-bar";
import { ProfileAvatarZone } from "@/features/user/ui/profile-avatar-zone";
import { ProfileIdentityForm } from "@/features/user/ui/profile-identity-form";
import { ProfileSecurityForm } from "@/features/user/ui/profile-security-form";
import type { ProfileTab } from "@/features/user/ui/profile-tabs";
import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";

/**
 * Edit-profile screen — the composer's visual language re-dressed for settings.
 * A full-bleed {@link EditProfileTopBar} command band (P / S tab boxes) caps a
 * 1240 two-panel card that mirrors the composer Step-1 cover|form layout: the
 * avatar zone (left, the constant identity anchor — present on both tabs) and
 * the active section form (right). The active tab lives in the URL (`?tab=…`) so
 * it survives refresh / back-forward. Breaks out of the legacy clamped `<main>`
 * via `mono-scope … mx-[calc(50%-50vw)] w-screen` (same as the composer route).
 */
export default function Profile() {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const { data: userData, isLoading } = useUserById(userId);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: ProfileTab =
    searchParams.get("tab") === "security" ? "security" : "profile";

  const selectTab = (tab: ProfileTab) => {
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
    <IsAuth
      loadingFallback={<Loading />}
      fallback={<ErrorMessage error={"Not Found"} />}
    >
      <div
        className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <EditProfileTopBar current={activeTab} onSelect={selectTab} />

        {/* 1240 canvas — two adjacent equal-height panels (grid stretch): the
            avatar (left, fills via `md:h-full`) and the active section form
            (right, on `--m-card`, sets the row height). One closed 2px box with
            a continuous accent top edge across both panels. */}
        <section className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <ProfileAvatarZone userData={userData} />

            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="border-2 border-t-0 border-[var(--m-dim)] bg-[var(--m-card)] p-7 md:border-t-2 md:border-l-0 md:border-t-[var(--m-accent)] md:p-10"
            >
              {activeTab === "security" ? (
                <ProfileSecurityForm />
              ) : (
                <ProfileIdentityForm userData={userData} />
              )}
            </div>
          </div>
        </section>
      </div>
    </IsAuth>
  );
}
