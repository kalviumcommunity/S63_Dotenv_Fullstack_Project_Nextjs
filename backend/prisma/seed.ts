import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "Saksham",
      email: "saksham@example.com",
      projects: {
        create: {
          name: "Next.js Fullstack Project",
          tasks: {
            create: [
              { title: "Design DB Schema", status: "DONE" },
              { title: "Setup Prisma", status: "IN_PROGRESS" }
            ]
          }
        }
      }
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());