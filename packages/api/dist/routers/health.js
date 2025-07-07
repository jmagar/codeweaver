"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
var trpc_1 = require("../trpc");
exports.healthRouter = (0, trpc_1.createTRPCRouter)({
    check: trpc_1.publicProcedure.query(function () { return ({ ok: true }); }),
});
