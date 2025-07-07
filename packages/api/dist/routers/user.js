"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
var zod_1 = require("zod");
var trpc_1 = require("../trpc");
exports.userRouter = (0, trpc_1.createTRPCRouter)({
    getProfile: trpc_1.publicProcedure
        .input(zod_1.z.object({ userId: zod_1.z.string() }))
        .query(function (_a) {
        var input = _a.input, ctx = _a.ctx;
        return ctx.db.user.findUnique({
            where: { id: input.userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });
    }),
});
