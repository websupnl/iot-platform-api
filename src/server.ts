import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma.js";
import { projectRoutes } from "./routes/project.js";

export function buildServer() {
  const app = Fastify({
    logger: {
      level: "info"
    },
    trustProxy: true
  });

  // Prisma plugin registreren
  app.register(prismaPlugin);

  // Project routes registreren
  app.register(projectRoutes);

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
