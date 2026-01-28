import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();


async function main() {
/**
* 1️⃣ Create basic users (idempotent)
*/
await prisma.user.createMany({
data: [
{ name: "Alice", email: "alice@example.com" },
{ name: "Bob", email: "bob@example.com" }
],
skipDuplicates: true
});


/**
* 2️⃣ Create Saksham with project + tasks
* (check first to avoid duplication)
*/
const sakshamExists = await prisma.user.findUnique({
where: { email: "saksham@example.com" }
});


if (!sakshamExists) {
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


console.log("✅ Seed data inserted successfully");
}


main()
.catch((error) => {
console.error("❌ Seeding failed:", error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});