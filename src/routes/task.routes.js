const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const owner = require("../middleware/owner.middleware");
const validate = require("../validators/task.validator");
const ctrl = require("../controllers/task.controller");

router.post("/", auth, validate.validateCreate, ctrl.createTask);
router.get("/", auth, ctrl.getTasks);
router.put("/:id", auth, owner, validate.validateUpdate, ctrl.updateTask);
router.delete("/:id", auth, owner, ctrl.deleteTask);

module.exports = router;
