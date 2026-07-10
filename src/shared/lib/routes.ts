// Central URL-shape definitions — the ONE place that knows the profile/post
// path structure, so it doesn't need re-deriving at every call site.
export const HOME_HREF = "/blog";

export function userHref(userName: string): string {
  return `/u/${userName}`;
}

export function postHref(userName: string, slug: string): string {
  return `${userHref(userName)}/${slug}`;
}

export function postEditHref(userName: string, slug: string): string {
  return `${postHref(userName, slug)}/edit`;
}
