const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const ctrl = require("../controllers/admin.controller");

router.get("/users", auth, role("admin"), ctrl.getAllUsers);
router.get("/tasks", auth, role("admin"), ctrl.getAllTasks);
router.delete("/users/:id", auth, role("admin"), ctrl.deleteUser);
router.delete("/tasks/:id", auth, role("admin"), ctrl.deleteTask);

module.exports = router;
