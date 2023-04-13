export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/p/create", "/p/edit/:id", "/u/edit"],
};
