const express = require("express");
const router = express.Router();
const c = require("../controllers/studentController");

router.get("/", c.getAllStudents);
router.get("/:id", c.getStudent);
router.post("/", c.addStudent);
router.put("/:id", c.updateStudent);
router.delete("/:id", c.deleteStudent);

module.exports = router;