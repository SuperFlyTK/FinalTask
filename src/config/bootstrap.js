const bcrypt = require("bcrypt");
const User = require("../models/User");
const Task = require("../models/Task");

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

async function ensureDefaultUsers() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  const userEmail = process.env.DEFAULT_USER_EMAIL;
  const userPassword = process.env.DEFAULT_USER_PASSWORD;

  if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
    console.log(
      "Default users not created (missing DEFAULT_* env vars)."
    );
    return;
  }

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    admin = await User.create({
      username: "admin",
      email: adminEmail,
      password: hashed,
      role: "admin"
    });
    console.log("Default admin created");
  }

  let user = await User.findOne({ email: userEmail });
  if (!user) {
    const hashed = await bcrypt.hash(userPassword, 10);
    user = await User.create({
      username: "user",
      email: userEmail,
      password: hashed,
      role: "user"
    });
    console.log("Default user created");
  }

  const existingUserTasks = await Task.countDocuments({ owner: user._id });
  const existingAdminTasks = await Task.countDocuments({ owner: admin._id });

  if (existingUserTasks === 0 && existingAdminTasks === 0) {
    const baseDate = new Date();
    const tasks = TASK_TITLES.map((title, i) => ({
      title,
      description: `Task ${i + 1} description`,
      status: STATUS[i % STATUS.length],
      priority: PRIORITY[i % PRIORITY.length],
      dueDate: addDays(baseDate, i + 1),
      owner: user._id
    }));

    tasks.push(
      {
        title: "Admin audit review",
        description: "Review system activity logs",
        status: "in_progress",
        priority: "high",
        dueDate: addDays(baseDate, 3),
        owner: admin._id
      },
      {
        title: "Admin access test",
        description: "Verify admin permissions",
        status: "pending",
        priority: "medium",
        dueDate: addDays(baseDate, 5),
        owner: admin._id
      }
    );

    await Task.insertMany(tasks);
    console.log("Default demo tasks created");
  }
}

module.exports = ensureDefaultUsers;
