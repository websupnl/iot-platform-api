import type { FastifyInstance } from "fastify";

export async function iotRoutes(app: FastifyInstance) {
  // List devices for current project
  app.get(
    "/devices",
    { preHandler: app.requireApiKey },
    async (req) => {
      return app.prisma.device.findMany({
        where: { projectId: req.project.id },
        include: { sensors: true }
      });
    }
  );

  // Create device for current project
  app.post(
    "/devices",
    { preHandler: app.requireApiKey },
    async (req, reply) => {
      const body = req.body as { name: string; type: string };

      if (!body?.name || !body?.type) {
        return reply.code(400).send({ error: "name and type are required" });
      }

      return app.prisma.device.create({
        data: {
          name: body.name,
          type: body.type,
          projectId: req.project.id
        }
      });
    }
  );

  // Create sensor under a device (must belong to project)
  app.post(
    "/devices/:deviceId/sensors",
    { preHandler: app.requireApiKey },
    async (req, reply) => {
      const { deviceId } = req.params as { deviceId: string };
      const body = req.body as { name: string; unit?: string };

      const device = await app.prisma.device.findFirst({
        where: { id: deviceId, projectId: req.project.id }
      });

      if (!device) {
        return reply.code(404).send({ error: "Device not found for this project" });
      }

      if (!body?.name) {
        return reply.code(400).send({ error: "name is required" });
      }

      return app.prisma.sensor.create({
        data: {
          name: body.name,
          unit: body.unit,
          deviceId: device.id
        }
      });
    }
  );

  // Add reading to a sensor (sensor must belong to project via device)
  app.post(
    "/sensors/:sensorId/readings",
    { preHandler: app.requireApiKey },
    async (req, reply) => {
      const { sensorId } = req.params as { sensorId: string };
      const body = req.body as { value: number };

      const sensor = await app.prisma.sensor.findFirst({
        where: {
          id: sensorId,
          device: { projectId: req.project.id }
        }
      });

      if (!sensor) {
        return reply.code(404).send({ error: "Sensor not found for this project" });
      }

      if (typeof body?.value !== "number") {
        return reply.code(400).send({ error: "value must be a number" });
      }

      return app.prisma.reading.create({
        data: { value: body.value, sensorId: sensor.id }
      });
    }
  );
}
