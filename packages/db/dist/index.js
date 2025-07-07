"use strict";
// Basic database client export
// This would typically export a Prisma client instance
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var client_1 = require("@prisma/client");
// Ensure the Prisma client is not recreated during HMR/dev reloads
var globalForPrisma = globalThis;
exports.db = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ["error", "warn"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.db;
}
