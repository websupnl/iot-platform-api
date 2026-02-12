import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma";

export function buildServer() {
  const app = Fastify({
    logger: {
      level: "info"
    },
    trustProxy: true
  });

  // Prisma plugin registreren
  app.register(prismaPlugin);

  // Health endpoint
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // DB health endpoint
  app.get("/health/db", async () => {
    await app.prisma.project.count();
    return { db: "ok" };
  });

  return app;
}
