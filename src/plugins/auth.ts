import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Project } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    requireApiKey: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    project: Project;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("project", null as any);

  app.decorate("requireApiKey", async (req, reply) => {
    const raw = req.headers["x-api-key"];
    const key = Array.isArray(raw) ? raw[0] : raw;

    if (!key) {
      return reply.code(401).send({ error: "Missing x-api-key" });
    }

    const apiKey = await app.prisma.apiKey.findUnique({
      where: { key: String(key) },
      include: { project: true }
    });

    if (!apiKey) {
      return reply.code(401).send({ error: "Invalid x-api-key" });
    }

    req.project = apiKey.project;
  });
});
