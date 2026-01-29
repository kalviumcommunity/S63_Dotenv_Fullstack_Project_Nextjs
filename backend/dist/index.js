"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./lib/prisma");
const app = (0, express_1.default)();
app.use(express_1.default.json());
/**
* Health check route
*/
app.get("/health", (_req, res) => {
    res.json({ status: "Backend running" });
});
/**
* Prisma DB test route
*/
app.get("/test-db", async (_req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
