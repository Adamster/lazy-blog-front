"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute, useUser, useUserById } from "@/entities/session";
import { EditProfileTopBar } from "@/features/user/ui/edit-profile-top-bar";
import { ProfileAvatarZone } from "@/features/user/ui/profile-avatar-zone";
import { ProfileIdentityForm } from "@/features/user/ui/profile-identity-form";
import { ProfileSecurityForm } from "@/features/user/ui/profile-security-form";
import { ProfileSecurityIntro } from "@/features/user/ui/profile-security-intro";
import type { ProfileTab } from "@/features/user/ui/profile-tabs";
import { Loading } from "@/shared/ui/loading";

/**
 * Edit-profile screen — the composer's visual language re-dressed for settings.
 * A full-bleed {@link EditProfileTopBar} command band (P / S tab boxes) caps the
 * active step. Both steps render the SAME 1240 two-panel card (so switching tabs
 * never jumps the frame width): a context panel (left) + a form panel (right).
 * Identity (step 1) = avatar zone | identity form; Security (step 2) = lock
 * context panel | password form — the left panel absorbs the extra width so the
 * inputs keep the comfortable right-panel measure. The active tab lives in the
 * URL (`?tab=…`) so it survives refresh / back-forward. Breaks out of the legacy
 * clamped `<main>` via `mono-scope … mx-[calc(50%-50vw)] w-screen` (same as the
 * composer route).
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
    <ProtectedRoute>
      <div
        className="mono-scope min-h-app mx-[calc(50%-50vw)] w-screen bg-[var(--m-bg)] text-[var(--m-fg)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <EditProfileTopBar
          current={activeTab}
          onSelect={selectTab}
          profileHref={user?.userName ? `/${user.userName}` : "/"}
        />

        {/* Both steps share ONE 1240 two-panel card (grid stretch) so switching
            tabs never jumps the frame width: a context panel (left, fills via
            `md:h-full`) + the form panel (right, on `--m-card`, sets the row
            height) — one closed 2px `--m-dim` box. Identity's left is the avatar
            zone; Security's is the lock context panel. The form inputs measure
            the right panel (≈ comfortable), not the full 1240. */}
        <section className="mx-auto max-w-[1240px] px-10 pt-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {activeTab === "security" ? (
              <ProfileSecurityIntro />
            ) : (
              <ProfileAvatarZone userData={userData} />
            )}

            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="border-2 border-t-0 border-[var(--m-dim)] bg-[var(--m-card)] p-7 md:border-t-2 md:border-l-0 md:p-10"
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
    </ProtectedRoute>
  );
}
