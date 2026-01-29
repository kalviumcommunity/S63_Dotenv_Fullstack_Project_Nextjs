import { prisma } from './prisma';

// Optimised: no over-fetching
export async function getProjectsForUser(userId: number) {
  return prisma.project.findMany({
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
export async function getTasksByProject(projectId: number, page = 1) {
  const take = 10;
  const skip = (page - 1) * take;

  return prisma.task.findMany({
    where: { projectId },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });
}