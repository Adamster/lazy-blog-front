"use client";

import { apiClient } from "@/api/api-client";
import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/components/loading";
import { UpdateAvatar } from "@/components/profile/update-avatar";
import { UpdatePassword } from "@/components/profile/update-password";
import { UpdateProfile } from "@/components/profile/update-profile";
import IsAuth from "@/guards/is-auth";
import { useUser } from "@/providers/user-provider";
import { Divider, Tab, Tabs } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

const PageEditClient = () => {
  const { user } = useUser();
  const userId = user?.id || "";

  const { data: userData, isLoading } = useQuery({
    queryKey: ["getUserById", userId],
    queryFn: () => apiClient.users.getUserById({ id: userId }),
    enabled: Boolean(userId),
  });

  if (isLoading) return <Loading />;

  return (
    <IsAuth fallback={<ErrorMessage error={"Not Found"} />}>
      <div className="layout-page">
        <div className="layout-page-content">
          <Tabs variant="solid" classNames={{ panel: "p-0 pt-4" }}>
            <Tab key="profile" title="Edit Profile">
              <UpdateProfile userData={userData} />
            </Tab>
            <Tab key="password" title="Change Password">
              <UpdatePassword />
            </Tab>
          </Tabs>
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            <aside className="layout-page-aside-content-sticky">
              <UpdateAvatar userData={userData} />
            </aside>
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </IsAuth>
  );
};

export default PageEditClient;
