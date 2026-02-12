import { FastifyInstance } from "fastify";
import crypto from "crypto";

export async function projectRoutes(app: FastifyInstance) {

  // Create project
  app.post("/projects", async (req, reply) => {
    const { name, slug } = req.body as { name: string; slug: string };

    const project = await app.prisma.project.create({
      data: { name, slug }
    });

    return project;
  });

  // Generate API key for project
  app.post("/projects/:projectId/apikey", async (req, reply) => {
    const { projectId } = req.params as { projectId: string };

    const key = crypto.randomBytes(32).toString("hex");

    const apiKey = await app.prisma.apiKey.create({
      data: {
        key,
        projectId
      }
    });

    return apiKey;
  });
}
