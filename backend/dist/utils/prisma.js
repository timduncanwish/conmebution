"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const path = __importStar(require("path"));
// Singleton pattern for Prisma client
const prismaClientSingleton = () => {
    // Use absolute path to database
    const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
    const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({
        url: dbPath,
    });
    return new prisma_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error']
    });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.default = prisma;
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
