import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    requireAdminKey: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function adminAuth(app: FastifyInstance) {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    app.log.warn("ADMIN_API_KEY is not set. Admin routes will not be protected correctly.");
  }

  app.decorate("requireAdminKey", async (req, reply) => {
    const key = req.headers["x-admin-key"];

    if (!adminKey || key !== adminKey) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});