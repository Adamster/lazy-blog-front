"use client";

import { ErrorMessage } from "@/shared/ui/error-message";
import { Loading } from "@/shared/ui/loading";
import { UpdateAvatar } from "@/features/user/ui/update-avatar";
import { UpdatePasswordForm } from "@/features/user/ui/update-pass-form";
import { UpdateUserForm } from "@/features/user/ui/update-user-form";
import { IsAuth } from "@/features/auth/guards/is-auth";
import { useUser } from "@/shared/providers/user-provider";
import { Divider, Tab, Tabs } from "@heroui/react";
import { useUserById } from "@/features/user/model/use-user-by-id";

export default function Profile() {
  const { user } = useUser();
  const userId = user?.id || "";

  const { data: userData, isLoading } = useUserById(userId);

  if (isLoading) return <Loading />;

  return (
    <IsAuth fallback={<ErrorMessage error={"Not Found"} />}>
      <div className="layout-page">
        <div className="layout-page-content">
          <Tabs variant="solid" classNames={{ panel: "p-0 pt-4" }}>
            <Tab key="profile" title="Edit Profile">
              <UpdateUserForm userData={userData} />
            </Tab>
            <Tab key="password" title="Change Password">
              <UpdatePasswordForm />
            </Tab>
          </Tabs>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-wrapper">
            <aside className="layout-page-aside-sticky">
              <UpdateAvatar userData={userData} />
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </IsAuth>
  );
}
