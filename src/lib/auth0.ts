import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Central Auth0 client config used by API routes.
export const auth0 = new Auth0Client({
  appBaseUrl:
    process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? undefined,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
  },
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
  },
});
