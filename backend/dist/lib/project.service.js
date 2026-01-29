"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectWithTasks = createProjectWithTasks;
const prisma_1 = require("./prisma");
async function createProjectWithTasks(data) {
    try {
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1️⃣ Project create
            const project = await tx.project.create({
                data: {
                    name: data.name,
                    userId: data.userId,
                },
            });
            // 2️⃣ Dependent tasks create
            await tx.task.createMany({
                data: data.tasks.map(task => ({
                    title: task.title,
                    status: 'PENDING',
                    projectId: project.id,
                })),
            });
            return project;
        });
        return result;
    }
    catch (error) {
        console.error('Transaction failed → rollback executed');
        throw error;
    }
}
