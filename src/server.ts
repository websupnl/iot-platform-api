import Fastify from "fastify";

export function buildServer() {
  const app = Fastify({
    logger: {
      level: "info"
    },
    trustProxy: true
  });

  // Health endpoint
  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
