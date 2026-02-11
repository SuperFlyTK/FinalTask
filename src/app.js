const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const ensureDefaultUsers = require("./config/bootstrap");
require("./config/env");

const app = express();

connectDB().then(() => {
  ensureDefaultUsers().catch((err) =>
    console.error("Default users error:", err.message)
  );
});

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/tasks", require("./routes/task.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// static frontend
app.use(express.static(path.join(__dirname, "../public")));

const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
