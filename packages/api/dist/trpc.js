"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.publicProcedure = exports.createTRPCRouter = void 0;
var server_1 = require("@trpc/server");
var superjson_1 = __importDefault(require("superjson"));
var zod_1 = require("zod");
// Initialize tRPC with our Context type and custom transformer/error formatter
var t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
    errorFormatter: function (_a) {
        var shape = _a.shape, error = _a.error;
        return __assign(__assign({}, shape), { data: __assign(__assign({}, shape.data), { zodError: error.cause instanceof zod_1.ZodError ? error.cause.flatten() : null }) });
    },
});
exports.createTRPCRouter = t.router;
exports.publicProcedure = t.procedure;
// Simple auth wrapper – will be extended once NextAuth is in place
exports.protectedProcedure = t.procedure.use(function (_a) {
    var ctx = _a.ctx, next = _a.next;
    if (!ctx.session) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
});
