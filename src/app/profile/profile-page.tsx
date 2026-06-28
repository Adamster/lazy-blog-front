"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute, useUser, useUserById } from "@/entities/session";
import { EditProfileTopBar } from "@/features/user/ui/edit-profile-top-bar";
import { ProfileAvatarZone } from "@/features/user/ui/profile-avatar-zone";
import { ProfileIdentityForm } from "@/features/user/ui/profile-identity-form";
import { ProfileSecurityForm } from "@/features/user/ui/profile-security-form";
import { ProfileSecurityIntro } from "@/features/user/ui/profile-security-intro";
import type { ProfileTab } from "@/features/user/ui/profile-tabs";
import { Loading } from "@/shared/ui";

// Active tab lives in the URL; breaks out of the legacy clamped `<main>` (same as the composer route).
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

        {/* Both steps share one two-panel card so switching tabs never jumps the
            frame width; the form measures the right panel, not the full 1240. */}
        <section className="mx-auto max-w-[1240px] px-6 pt-10 pb-10 md:px-10">
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
              className="border-2 border-t-0 border-[var(--m-dim)] bg-[var(--m-card)] p-10 md:border-t-2 md:border-l-0"
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
