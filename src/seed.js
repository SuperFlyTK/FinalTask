const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("./config/db");
const User = require("./models/User");
const Task = require("./models/Task");

const SEED_USERS = [
  {
    username: "admin",
    email: "admin@demo.com",
    password: "Admin123!",
    role: "admin"
  },
  {
    username: "user",
    email: "user@demo.com",
    password: "User123!",
    role: "user"
  }
];

const TASK_TITLES = [
  "Finish project outline",
  "Review security checklist",
  "Write API docs",
  "Prepare demo script",
  "Fix pagination bug",
  "Add input validation",
  "Refactor controller logic",
  "Polish UI layout",
  "Test role permissions",
  "Seed demo data",
  "Optimize query performance",
  "Improve error handling",
  "Update README",
  "Check deployment env vars",
  "Verify JWT expiration",
  "Add due dates",
  "Update admin panel",
  "Clean up CSS",
  "Run smoke tests",
  "Prepare defense answers",
  "Create backup plan",
  "Double-check CRUD"
];

const STATUS = ["pending", "in_progress", "done"];
const PRIORITY = ["low", "medium", "high"];

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function upsertUser(seed) {
  const hashed = await bcrypt.hash(seed.password, 10);
  return User.findOneAndUpdate(
    { email: seed.email },
    {
      username: seed.username,
      email: seed.email,
      password: hashed,
      role: seed.role
    },
    { new: true, upsert: true }
  );
}

async function seed() {
  await connectDB();

  const users = [];
  for (const seedUser of SEED_USERS) {
    const user = await upsertUser(seedUser);
    users.push(user);
  }

  const userAccount = users.find((u) => u.role === "user");
  const adminAccount = users.find((u) => u.role === "admin");

  await Task.deleteMany({ owner: { $in: [userAccount._id, adminAccount._id] } });

  const baseDate = new Date();
  const tasks = TASK_TITLES.map((title, i) => ({
    title,
    description: `Task ${i + 1} description`,
    status: STATUS[i % STATUS.length],
    priority: PRIORITY[i % PRIORITY.length],
    dueDate: addDays(baseDate, i + 1),
    owner: userAccount._id
  }));

  tasks.push(
    {
      title: "Admin audit review",
      description: "Review system activity logs",
      status: "in_progress",
      priority: "high",
      dueDate: addDays(baseDate, 3),
      owner: adminAccount._id
    },
    {
      title: "Admin access test",
      description: "Verify admin permissions",
      status: "pending",
      priority: "medium",
      dueDate: addDays(baseDate, 5),
      owner: adminAccount._id
    }
  );

  await Task.insertMany(tasks);

  console.log("Seed complete");
  console.log("Admin: admin@demo.com / Admin123!");
  console.log("User: user@demo.com / User123!");

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed error:", err);
  await mongoose.disconnect();
  process.exit(1);
});
