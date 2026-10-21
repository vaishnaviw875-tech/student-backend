const Student = require("../models/Student");

exports.addStudent = async (req, res) => {
  try {
    const { studentId, name, email, department, semester } = req.body;
    if (!studentId || !name || !email || !department || !semester) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }
    await Student.create(req.body);
    res.status(201).json({ success: true, message: "Student added successfully" });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: "Student ID already exists" });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully", data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};