const Task = require("../models/Task");

module.exports = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your task" });
    }

    req.task = task;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid task id" });
  }
};
