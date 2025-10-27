import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import { stripe } from "@paykit-sdk/stripe";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@paykit-sdk/medusajs",
      options: {
        provider: stripe(),
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        debug: process.env.NODE_ENV === "development",
      },
    },
  ],
});
