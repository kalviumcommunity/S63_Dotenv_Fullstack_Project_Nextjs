/**
 * Script to check if backend data is being saved correctly.
 * 
 * Usage:
 *   BACKEND_URL=http://localhost:5000 node scripts/check-data.mjs
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

async function checkData() {
  console.log("🔍 Checking backend data...\n");
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  try {
    // 1. Health check
    console.log("1️⃣ Checking backend health...");
    const healthRes = await fetch(`${BACKEND_URL}/api/health`);
    const health = await healthRes.json();
    console.log("   ✅ Backend is running:", health);
    console.log("");

    // 2. Test database connection
    console.log("2️⃣ Testing database connection...");
    try {
      const dbRes = await fetch(`${BACKEND_URL}/api/test-db`);
      if (dbRes.ok) {
        const users = await dbRes.json();
        console.log(`   ✅ Database connected! Found ${Array.isArray(users) ? users.length : 0} users`);
        if (Array.isArray(users) && users.length > 0) {
          console.log("   📋 Sample users:");
          users.slice(0, 3).forEach((u, i) => {
            console.log(`      ${i + 1}. ${u.email} (${u.name || "No name"}) - Role: ${u.role}`);
          });
        }
      } else {
        console.log("   ❌ Database connection failed:", await dbRes.text());
      }
    } catch (err) {
      console.log("   ❌ Database connection error:", err.message);
    }
    console.log("");

    // 3. Check users
    console.log("3️⃣ Checking users in database...");
    try {
      // Note: This endpoint might require auth, so we'll try it
      const usersRes = await fetch(`${BACKEND_URL}/api/users`, {
        headers: {
          "Authorization": "Bearer test", // This will fail but shows endpoint exists
        },
      });
      if (usersRes.status === 401 || usersRes.status === 403) {
        console.log("   ℹ️  /api/users requires authentication (expected)");
      } else {
        const users = await usersRes.json();
        console.log("   ✅ Users:", users);
      }
    } catch (err) {
      console.log("   ℹ️  Could not fetch users (may require auth)");
    }
    console.log("");

    // 4. Check issues
    console.log("4️⃣ Checking issues in database...");
    const issuesRes = await fetch(`${BACKEND_URL}/api/issues?limit=5`);
    const issuesData = await issuesRes.json();
    if (issuesData.success) {
      console.log(`   ✅ Found ${issuesData.data?.total || 0} total issues`);
      console.log(`   📋 Showing ${issuesData.data?.issues?.length || 0} issues:`);
      if (issuesData.data?.issues?.length > 0) {
        issuesData.data.issues.forEach((issue, i) => {
          console.log(`      ${i + 1}. ${issue.publicId || issue.id}: ${issue.title}`);
          console.log(`         Status: ${issue.status}, Category: ${issue.category}`);
        });
      } else {
        console.log("      No issues found. Create one via POST /api/issues");
      }
    } else {
      console.log("   ❌ Error fetching issues:", issuesData.message);
    }
    console.log("");

    // 5. Test creating an issue (optional)
    console.log("5️⃣ Testing data creation...");
    console.log("   To test saving data, try:");
    console.log(`   curl -X POST ${BACKEND_URL}/api/issues \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"title":"Test Issue","category":"OTHER"}'`);
    console.log("");

    console.log("✅ Data check complete!");
    console.log("\n💡 Tip: Use 'npx prisma studio' to view database visually");

  } catch (err) {
    console.error("❌ Error checking data:", err.message);
    console.error("\nMake sure:");
    console.error("1. Backend server is running (npm run dev)");
    console.error("2. Database is connected (check DATABASE_URL in .env)");
    console.error("3. Backend URL is correct:", BACKEND_URL);
  }
}

checkData();
