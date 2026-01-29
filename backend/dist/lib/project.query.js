"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsForUser = getProjectsForUser;
exports.getTasksByProject = getTasksByProject;
const prisma_1 = require("./prisma");
// Optimised: no over-fetching
async function getProjectsForUser(userId) {
    return prisma_1.prisma.project.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
// Pagination + index usage
async function getTasksByProject(projectId, page = 1) {
    const take = 10;
    const skip = (page - 1) * take;
    return prisma_1.prisma.task.findMany({
        where: { projectId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
    });
}
