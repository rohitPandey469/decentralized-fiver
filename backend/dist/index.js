"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKER_JWT_SECRET = exports.JWT_SECRET = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./routers/user"));
const worker_1 = __importDefault(require("./routers/worker"));
exports.JWT_SECRET = "rohit123";
exports.WORKER_JWT_SECRET = exports.JWT_SECRET + "worker";
app.use(express_1.default.json()); // to access req.body in controllers
app.use((0, cors_1.default)());
app.use("/v1/user", user_1.default);
app.use("/v1/worker", worker_1.default);
app.listen(3000);
