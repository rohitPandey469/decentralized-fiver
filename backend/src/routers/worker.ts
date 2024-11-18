import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { WORKER_JWT_SECRET } from "..";
import jwt from "jsonwebtoken";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";

const TOTAL_SUBMISSIONS = 100;

const router = Router();

const prismaClient = new PrismaClient();

router.post("/payout", workerMiddleware, async (req, res) => {
  // @ts-ignore
  const userId: string = req.userId;

  const worker = await prismaClient.worker.findFirst({
    where: {
      id: Number(userId),
    },
  });

  if (!worker) {
    return res.status(403).json({
      message: "User not found",
    });
  }

  const address = worker.address;
  // Need to add some logic on blockchain
  const txnId = "0x56584848";

  // Step - 1 : Lock it to avoid double transcations
  await prismaClient
    .$transaction(async (tx) => {
      await tx.worker.update({
        where: {
          id: Number(userId),
        },
        data: {
          pending_amount: {
            decrement: worker.pending_amount,
          },
          locked_amount: {
            increment: worker.pending_amount,
          },
        },
      });

      await tx.payouts.create({
        data: {
          user_id: Number(userId),
          amount: worker.pending_amount,
          status: "Processing",
          signature: txnId,
        },
      });
    })
    .then(() => {
      // Step - 2 : Send the txn to solana blockchain
    });

  res.json({
    message: "Processing payout",
    amount: worker.pending_amount,
  });
});

router.get("/balance", workerMiddleware, async (req, res) => {
  //@ts-ignore
  const userId: string = req.userId;

  const worker = await prismaClient.worker.findFirst({
    where: {
      id: Number(userId),
    },
  });

  res.json({
    pendingAmount: worker?.pending_amount,
    lockedAmount: worker?.locked_amount,
  });
});

router.post("/submission", workerMiddleware, async (req, res) => {
  // @ts-ignore
  const userId: string = req.userId;

  const body = req.body;
  const parseBody = createSubmissionInput.safeParse(body);

  if (parseBody.success) {
    const task = await getNextTask(Number(userId));
    if (!task || task?.id !== Number(parseBody.data.taskId)) {
      return res.status(411).json({
        message: "Incorrect task id",
      });
    }

    const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

    const submission = await prismaClient.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          option_id: Number(parseBody.data.selection),
          worker_id: Number(userId),
          task_id: Number(parseBody.data.taskId),
          amount: Number(amount),
        },
      });

      await tx.worker.update({
        where: {
          id: Number(userId),
        },
        data: {
          pending_amount: {
            increment: Number(amount),
          },
        },
      });

      return submission;
    });

    const nextTask = await getNextTask(Number(userId));
    res.json({
      nextTask,
      amount,
    });
  } else {
  }
});

router.get("/nextTask", workerMiddleware, async (req, res) => {
  // @ts-ignore
  const userId: string = req.userId;

  const task = await getNextTask(Number(userId));

  if (!task) {
    res.status(411).json({
      message: "No more tasks left for you to review",
    });
  } else {
    res.status(411).json({
      task,
    });
  }
});

router.post("/signin", async (req, res) => {
  // Todo : Add sign verification logic here
  const hardcodedWalletAddress = "3Sp96nopAy6NMLYLM99gUZst1LZQXQjyAQ57WsdMUCQx";

  const existingUser = await prismaClient.worker.findFirst({
    where: {
      address: hardcodedWalletAddress,
    },
  });

  if (existingUser) {
    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      WORKER_JWT_SECRET
    );

    res.json({ token });
  } else {
    const user = await prismaClient.worker.create({
      data: {
        address: hardcodedWalletAddress,
        pending_amount: 0,
        locked_amount: 0,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      WORKER_JWT_SECRET
    );

    res.json({ token });
  }
});

export default router;
