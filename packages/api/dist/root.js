"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
var trpc_1 = require("./trpc");
var health_1 = require("./routers/health");
var user_1 = require("./routers/user");
exports.appRouter = (0, trpc_1.createTRPCRouter)({
    health: health_1.healthRouter,
    user: user_1.userRouter,
});
