export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/create", "/p/edit/:id*", "/u/edit"],
};
