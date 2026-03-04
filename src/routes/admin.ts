import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";

function generateApiKey() {
  return crypto.randomBytes(32).toString("hex");
}

export async function adminRoutes(app: FastifyInstance) {

  // ----------------------------
  // Projects
  // ----------------------------

  app.get("/admin/projects", async () => {
    return app.prisma.project.findMany({
      include: {
        devices: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  });

  app.post("/admin/projects", async (req, reply) => {

    const body = req.body as {
      name: string
      slug: string
    };

    if (!body?.name || !body?.slug) {
      return reply.code(400).send({
        error: "name and slug are required"
      });
    }

    const project = await app.prisma.project.create({
      data: {
        name: body.name,
        slug: body.slug,
        apiKey: generateApiKey()
      }
    });

    return project;
  });

  app.delete("/admin/projects/:projectId", async (req, reply) => {

    const { projectId } = req.params as {
      projectId: string
    };

    await app.prisma.project.delete({
      where: { id: projectId }
    });

    return { success: true };
  });

  // ----------------------------
  // Devices
  // ----------------------------

  app.get("/admin/projects/:projectId/devices", async (req) => {

    const { projectId } = req.params as {
      projectId: string
    };

    return app.prisma.device.findMany({
      where: { projectId },
      include: { sensors: true }
    });

  });

  app.post("/admin/projects/:projectId/devices", async (req, reply) => {

    const { projectId } = req.params as {
      projectId: string
    };

    const body = req.body as {
      name: string
      type: string
    };

    if (!body?.name || !body?.type) {
      return reply.code(400).send({
        error: "name and type required"
      });
    }

    const device = await app.prisma.device.create({
      data: {
        name: body.name,
        type: body.type,
        projectId
      }
    });

    return device;

  });

  // ----------------------------
  // Sensors
  // ----------------------------

  app.post("/admin/devices/:deviceId/sensors", async (req, reply) => {

    const { deviceId } = req.params as {
      deviceId: string
    };

    const body = req.body as {
      name: string
      unit?: string
    };

    if (!body?.name) {
      return reply.code(400).send({
        error: "sensor name required"
      });
    }

    const sensor = await app.prisma.sensor.create({
      data: {
        name: body.name,
        unit: body.unit,
        deviceId
      }
    });

    return sensor;

  });

}