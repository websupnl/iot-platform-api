import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma.js";
import { projectRoutes } from "./routes/project.js";
import authPlugin from "./plugins/auth.js";
import { iotRoutes } from "./routes/iot.js";


export function buildServer() {
  const app = Fastify({
    logger: {
      level: "info"
    },
    trustProxy: true
  });
  app.register(prismaPlugin);
  app.register(authPlugin);

  app.register(projectRoutes);
  app.register(iotRoutes, { prefix: "/api" });

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
