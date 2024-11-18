import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export const getNextTask = async (userId: Number) => {
  const task = await prismaClient.task.findFirst({
    where: {
      submissions: {
        none: {
          worker_id: Number(userId),
        },
      },
      done: false,
    },
    select: {
      id : true,
      amount : true,
      title: true,
      options: true,
    },
  });

  return task;
};
