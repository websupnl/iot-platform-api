import type { FastifyInstance } from "fastify";

export async function iotRoutes(app: FastifyInstance) {

  // ============================
  // List devices
  // ============================

  app.get("/devices", { preHandler: app.requireApiKey }, async (req) => {

    return app.prisma.device.findMany({
      where: { projectId: req.project.id },
      include: {
        sensors: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

  });


  // ============================
  // Create device
  // ============================

  app.post("/devices", { preHandler: app.requireApiKey }, async (req, reply) => {

    const body = req.body as {
      name: string
      type: string
    };

    if (!body?.name || !body?.type) {
      return reply.code(400).send({
        error: "name and type are required"
      });
    }

    const device = await app.prisma.device.create({
      data: {
        name: body.name,
        type: body.type,
        projectId: req.project.id
      }
    });

    return device;

  });


  // ============================
  // Create sensor
  // ============================

  app.post("/devices/:deviceId/sensors", { preHandler: app.requireApiKey }, async (req, reply) => {

    const { deviceId } = req.params as { deviceId: string };

    const body = req.body as {
      name: string
      unit?: string
    };

    if (!body?.name) {
      return reply.code(400).send({
        error: "name is required"
      });
    }

    const device = await app.prisma.device.findFirst({
      where: {
        id: deviceId,
        projectId: req.project.id
      }
    });

    if (!device) {
      return reply.code(404).send({
        error: "Device not found"
      });
    }

    const sensor = await app.prisma.sensor.create({
      data: {
        name: body.name,
        unit: body.unit,
        deviceId: device.id
      }
    });

    return sensor;

  });


  // ============================
  // Add reading (secured)
  // ============================

  app.post("/sensors/:sensorId/readings", { preHandler: app.requireApiKey }, async (req, reply) => {

    const { sensorId } = req.params as { sensorId: string };

    const body = req.body as {
      value: number
    };

    if (typeof body?.value !== "number") {
      return reply.code(400).send({
        error: "value must be a number"
      });
    }

    const sensor = await app.prisma.sensor.findFirst({
      where: {
        id: sensorId,
        device: {
          projectId: req.project.id
        }
      }
    });

    if (!sensor) {
      return reply.code(404).send({
        error: "Sensor not found"
      });
    }

    const reading = await app.prisma.reading.create({
      data: {
        value: body.value,
        sensorId: sensor.id
      }
    });

    return reading;

  });


  // ============================
  // Device ingest endpoint
  // ============================

  app.post("/ingest", async (request, reply) => {

    const body = request.body as {
      apiKey: string
      device: string
      sensor: string
      value: number
      unit?: string
    };

    if (!body?.apiKey || !body?.device || !body?.sensor || body.value === undefined) {
      return reply.code(400).send({
        error: "apiKey, device, sensor and value required"
      });
    }

    // Validate API key
    const apiKey = await app.prisma.apiKey.findUnique({
      where: { key: body.apiKey },
      include: { project: true }
    });

    if (!apiKey) {
      return reply.code(401).send({
        error: "Invalid API key"
      });
    }

    const projectId = apiKey.projectId;

    // ============================
    // Find or create device
    // ============================

    let device = await app.prisma.device.findFirst({
      where: {
        name: body.device,
        projectId
      }
    });

    if (!device) {

      device = await app.prisma.device.create({
        data: {
          name: body.device,
          type: "generic",
          projectId
        }
      });

    }

    // ============================
    // Find or create sensor
    // ============================

    let sensor = await app.prisma.sensor.findFirst({
      where: {
        name: body.sensor,
        deviceId: device.id
      }
    });

    if (!sensor) {

      sensor = await app.prisma.sensor.create({
        data: {
          name: body.sensor,
          unit: body.unit,
          deviceId: device.id
        }
      });

    }

    // ============================
    // Save reading
    // ============================

    const reading = await app.prisma.reading.create({
      data: {
        value: body.value,
        sensorId: sensor.id
      }
    });

    return {
      success: true,
      device,
      sensor,
      reading
    };

  });


  // ============================
  // Get sensor readings
  // ============================

  app.get("/sensors/:sensorId/readings", { preHandler: app.requireApiKey }, async (req) => {

    const { sensorId } = req.params as { sensorId: string };

    const readings = await app.prisma.reading.findMany({
      where: {
        sensorId,
        sensor: {
          device: {
            projectId: req.project.id
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    return readings;

  });

}