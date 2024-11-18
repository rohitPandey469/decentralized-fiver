import { PrismaClient } from "@prisma/client";
import { response, Router } from "express";
import jwt from "jsonwebtoken";
// import { S3Client } from "@aws-sdk/client-s3";
// import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { authMiddleware } from "../middleware";
import { JWT_SECRET } from "./../index";
import { createTaskInput } from "../types";
import { TOTAL_DECIMALS } from "../config";

export const DEFAULT_TITLE = "Select the most clickable thumbnail";

// const s3Client = new S3Client({
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY_ID ?? "",
//     secretAccessKey: process.env.ACCESS_SECRET ?? "",
//   },
//   region: "us-east-1",
// });

const prismaClient = new PrismaClient();

const router = Router();

router.get("/task", authMiddleware, async (req, res) => {
  // @ts-ignore
  const taskId: string = req.query.taskId;
  // @ts-ignore
  const userId: string = req.query.userId;

  const taskDetails = await prismaClient.task.findFirst({
    where: {
      user_id: Number(userId),
      id: Number(taskId),
    },
    include: {
      options: true,
    },
  });

  if (!taskDetails) {
    return res.status(411).json({
      message: "You dont have access to this task",
    });
  }

  const responses = await prismaClient.submission.findMany({
    where: {
      task_id: Number(taskId),
    },
    include: {
      option: true,
    },
  });

  const result: Record<
    string,
    {
      count: number;
      option: {
        imageUrl: string;
      };
    }
  > = {};

  taskDetails.options.forEach((option) => {
    result[option.id] = {
      count: 1,
      option: {
        imageUrl: option.image_url,
      },
    };
  });

  responses.forEach((submission) => {
    result[submission.option_id].count++;
  });

  res.json({
    result,
  });
});

router.post("/task", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  //validate the inputs from the user - using zod
  const body = req.body;

  const parseData = createTaskInput.safeParse(body);

  if (!parseData.success) {
    return res.status(411).json({
      message: "You've sent the wrong inputs",
    });
  }

  // Either every query will succeed or fail
  // @ts-ignore
  let response = await prismaClient.$transaction(async (tx) => {
    const repsonse = await tx.task.create({
      data: {
        title: parseData.data.title ?? DEFAULT_TITLE,
        amount: 1 * TOTAL_DECIMALS,
        signature: parseData.data.signature,
        user_id: userId,
      },
    });

    await tx.option.createMany({
      data: parseData.data.options.map((x) => ({
        image_url: x.imageUrl,
        task_id: repsonse.id,
      })),
    });

    return response;
  });

  res.json({
    id: response.id,
  });
});

// PreSigned URL technique for s3
// router.get("/presignedUrl", authMiddleware, async (req, res) => {
//   // @ts-ignore
//   const userId = req.userId;

//   const { url, fields } = await createPresignedPost(s3Client, {
//     Bucket: "demo",
//     Key: `fiver/${userId}/${Math.random()}/image.jpg`,
//     Conditions: [["content-length-range", 0, 5 * 1024 * 1024]],
//     Expires: 3600,
//   });

//   res.json({
//     preSignedUrl: url,
//     fields,
//   });
// });

router.get("/presignedUrl", async (req, res) => {
});
router.post("/signin", async (req, res) => {
  // Todo : Add sign verification logic here
  const hardcodedWalletAddress = "3Sp96nopAy6NMLYLM99gUZst1LZQXQjyAQ57WsdMUCQx";

  const existingUser = await prismaClient.user.findFirst({
    where: {
      address: hardcodedWalletAddress,
    },
  });

  if (existingUser) {
    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      JWT_SECRET
    );

    res.json({ token });
  } else {
    const user = await prismaClient.user.create({
      data: {
        address: hardcodedWalletAddress,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    res.json({ token });
  }
});

export default router;
