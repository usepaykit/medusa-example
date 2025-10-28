import { defineMiddlewares } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/hooks/payment/*",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
});
