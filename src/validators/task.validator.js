const STATUS = ["pending", "in_progress", "done"];
const PRIORITY = ["low", "medium", "high"];

function isValidDate(value) {
  if (!value) return true;
  return !Number.isNaN(Date.parse(value));
}

function validateCommonFields(req, res) {
  const { title, description, status, priority, dueDate } = req.body;

  if (title !== undefined && (!title || title.trim().length < 3)) {
    return res.status(400).json({ message: "Invalid title" });
  }

  if (description !== undefined && description.length > 500) {
    return res.status(400).json({ message: "Description is too long" });
  }

  if (status !== undefined && !STATUS.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (priority !== undefined && !PRIORITY.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

  if (dueDate !== undefined && !isValidDate(dueDate)) {
    return res.status(400).json({ message: "Invalid due date" });
  }

  return null;
}

exports.validateCreate = (req, res, next) => {
  const { title } = req.body;
  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: "Invalid title" });
  }

  const error = validateCommonFields(req, res);
  if (error) return error;

  next();
};

exports.validateUpdate = (req, res, next) => {
  const allowed = ["title", "description", "status", "priority", "dueDate"];
  const hasAnyField = allowed.some((key) => req.body[key] !== undefined);

  if (!hasAnyField) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const error = validateCommonFields(req, res);
  if (error) return error;

  next();
};
