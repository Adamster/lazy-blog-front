import { ErrorMessage } from "@/components/errors/error-message";
import { Loading } from "@/shared/ui/loading";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { Divider, User } from "@heroui/react";
import { formatDate2 } from "@/shared/lib/utils";
import { PostsList } from "@/features/posts/ui/posts-list";
import { GenerateMeta } from "@/shared/lib/head/meta-data";
import { GetServerSideProps } from "next";
import { usePostsByUser } from "@/features/user/model/use-posts-by-user";
import { UserResponse } from "@/shared/api/openapi";
import { getUserDataSSR } from "@/features/user/model/get-user-data.ssr";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { user } = params as { user: string };
  const userServer = await getUserDataSSR(user);
  return {
    props: userServer,
  };
};

export default function UserClient(userServer: UserResponse) {
  const query = usePostsByUser(userServer.userName || "");

  const posts = query.data?.pages.flatMap((page) => page.postItems) || [];
  const totalPosts = query.data?.pages[0].totalPostCount || null;
  const user = query.data?.pages[0].user || null;

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;

  return (
    <>
      <GenerateMeta
        title={userServer.userName}
        description={`Explore articles and stories shared by ${
          userServer.userName
        }. ${userServer.biography ? userServer.biography : ""}`}
        url={`/${userServer.userName}`}
        image={userServer.avatarUrl ? userServer.avatarUrl : ""}
        type="profile"
        card="summary"
      />

      <div className="layout-page">
        <div className="layout-page-content">
          <PostsList query={query} posts={posts} author={user} hideAuthor />

          {posts.length === 0 && (
            <p>
              No posts yet, probably <strong>{user?.userName}</strong> lost in
              procrastination.
            </p>
          )}
        </div>

        <div className="layout-page-aside">
          <Divider className="layout-page-divider" orientation="vertical" />

          <div className="layout-page-aside-content">
            {user && (
              <aside className="layout-page-aside-content-sticky">
                <User
                  className="mb-1"
                  key={user.id}
                  avatarProps={{
                    size: "lg",
                    src: user.avatarUrl || undefined,
                    name: `${user.firstName?.charAt(0)}${user.lastName?.charAt(
                      0
                    )}`,
                  }}
                  name={`${user.firstName} ${user.lastName}`}
                  description={"@" + user.userName}
                />

                {user?.biography && (
                  <div>
                    <p className="text-sm text-gray">About:</p>
                    <p className="whitespace-pre-line">{user?.biography}</p>
                  </div>
                )}

                <Divider />

                <div className="flex items-center gap-4 text-gray">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">
                      {formatDate2(user.createdOnUtc || "")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span className="ml-1 text-sm">{totalPosts}</span>
                  </div>
                </div>
              </aside>
            )}
          </div>

          <Divider className="layout-page-divider-mobile" />
        </div>
      </div>
    </>
  );
}
