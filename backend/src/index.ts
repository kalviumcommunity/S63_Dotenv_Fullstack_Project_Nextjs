import express from "express";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
dotenv.config();
const app = express();
app.use(express.json());


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
const users = await prisma.user.findMany();
res.json(users);
} catch (error) {
console.error(error);
res.status(500).json({ error: "Database query failed" });
}
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
console.log(`Backend running on port ${PORT}`);
});