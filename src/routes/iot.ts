import type { FastifyInstance } from "fastify";

export async function iotRoutes(app: FastifyInstance) {

  // List devices
  app.get("/devices", { preHandler: app.requireApiKey }, async (req) => {
    return app.prisma.device.findMany({
      where: { projectId: req.project.id },
      include: { sensors: true }
    });
  });

  // Create device
  app.post("/devices", { preHandler: app.requireApiKey }, async (req, reply) => {
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
  });

  // Create sensor
  app.post("/devices/:deviceId/sensors", { preHandler: app.requireApiKey }, async (req, reply) => {
    const { deviceId } = req.params as { deviceId: string };
    const body = req.body as { name: string; unit?: string };

    const device = await app.prisma.device.findFirst({
      where: { id: deviceId, projectId: req.project.id }
    });

    if (!device) {
      return reply.code(404).send({ error: "Device not found" });
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
  });

  // Add reading
  app.post("/sensors/:sensorId/readings", { preHandler: app.requireApiKey }, async (req, reply) => {
    const { sensorId } = req.params as { sensorId: string };
    const body = req.body as { value: number };

    const sensor = await app.prisma.sensor.findFirst({
      where: {
        id: sensorId,
        device: { projectId: req.project.id }
      }
    });

    if (!sensor) {
      return reply.code(404).send({ error: "Sensor not found" });
    }

    if (typeof body?.value !== "number") {
      return reply.code(400).send({ error: "value must be a number" });
    }

    return app.prisma.reading.create({
      data: { value: body.value, sensorId: sensor.id }
    });
  });

    app.post("/ingest", async (request, reply) => {

    const body = request.body as {
      apiKey: string
      sensorId: string
      value: number
    };

    if (!body?.apiKey || !body?.sensorId || body.value === undefined) {
      return reply.code(400).send({
        error: "apiKey, sensorId and value required"
      });
    }

    // API key controleren
    const apiKey = await app.prisma.apiKey.findUnique({
      where: { key: body.apiKey }
    });

    if (!apiKey) {
      return reply.code(401).send({
        error: "Invalid API key"
      });
    }

    // Sensor controleren
    const sensor = await app.prisma.sensor.findUnique({
      where: { id: body.sensorId }
    });

    if (!sensor) {
      return reply.code(404).send({
        error: "Sensor not found"
      });
    }

    // Reading opslaan
    const reading = await app.prisma.reading.create({
      data: {
        value: body.value,
        sensorId: sensor.id
      }
    });

    return {
      success: true,
      reading
    };

  });

}

export async function iotRoutes(app: FastifyInstance) {

  // ----------------------------
  // Ingest data
  // ----------------------------

  app.post("/api/ingest", async (req, reply) => {
    ...
  })


  // ----------------------------
  // Get sensor readings
  // ----------------------------

  app.get("/api/sensors/:sensorId/readings", async (req, reply) => {

    const { sensorId } = req.params as {
      sensorId: string
    };

    const readings = await app.prisma.reading.findMany({
      where: { sensorId },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    return readings;

  });

}
