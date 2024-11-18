"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TITLE = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { S3Client } from "@aws-sdk/client-s3";
// import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
const middleware_1 = require("../middleware");
const index_1 = require("./../index");
const types_1 = require("../types");
const config_1 = require("../config");
const firebaseConfig_1 = require("../firebaseConfig");
exports.DEFAULT_TITLE = "Select the most clickable thumbnail";
// const s3Client = new S3Client({
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY_ID ?? "",
//     secretAccessKey: process.env.ACCESS_SECRET ?? "",
//   },
//   region: "us-east-1",
// });
const prismaClient = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const taskId = req.query.taskId;
    // @ts-ignore
    const userId = req.query.userId;
    const taskDetails = yield prismaClient.task.findFirst({
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
    const responses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId),
        },
        include: {
            option: true,
        },
    });
    const result = {};
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
}));
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    //validate the inputs from the user - using zod
    const body = req.body;
    const parseData = types_1.createTaskInput.safeParse(body);
    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs",
        });
    }
    // Either every query will succeed or fail
    // @ts-ignore
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const repsonse = yield tx.task.create({
            data: {
                title: (_a = parseData.data.title) !== null && _a !== void 0 ? _a : exports.DEFAULT_TITLE,
                amount: 1 * config_1.TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId,
            },
        });
        yield tx.option.createMany({
            data: parseData.data.options.map((x) => ({
                image_url: x.imageUrl,
                task_id: repsonse.id,
            })),
        });
        return response;
    }));
    res.json({
        id: response.id,
    });
}));
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
router.get("/presignedUrl", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const { fileName, contentType } = req.body;
    try {
        const fileRef = firebaseConfig_1.storage.bucket().file(fileName);
        const url = yield fileRef.getSignedUrl({
            action: "write",
            expires: "03-08-2025", // Set a reasonable expiration date (replace with your desired date)
        });
        res.json({ preSignedUrl: url });
    }
    catch (error) {
        console.log(error);
        res.json({ error });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo : Add sign verification logic here
    const hardcodedWalletAddress = "3Sp96nopAy6NMLYLM99gUZst1LZQXQjyAQ57WsdMUCQx";
    const existingUser = yield prismaClient.user.findFirst({
        where: {
            address: hardcodedWalletAddress,
        },
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id,
        }, index_1.JWT_SECRET);
        res.json({ token });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: hardcodedWalletAddress,
            },
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
        }, index_1.JWT_SECRET);
        res.json({ token });
    }
}));
exports.default = router;
