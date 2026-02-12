import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async function (app: FastifyInstance) {
  const prisma = new PrismaClient();
  await prisma.$connect();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
