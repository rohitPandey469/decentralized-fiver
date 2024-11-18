import express from "express";
const app = express();
import cors from "cors";
import userRouter from "./routers/user";
import workerRouter from "./routers/worker";

export const JWT_SECRET = "rohit123";
export const WORKER_JWT_SECRET = JWT_SECRET + "worker";

app.use(express.json()); // to access req.body in controllers
app.use(cors());

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(3000);
