const Student = require("../models/Student");


exports.addStudent = async (req, res) => {
  try {
    const { studentId, name, email, department, semester, contact } = req.body;

    if (
      !studentId?.trim() ||
      !name?.trim() ||
      !email?.trim() ||
      !department?.trim() ||
      semester === undefined ||
      semester === null ||
      semester === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const student = await Student.create({
      studentId: String(studentId).trim(),
      name: String(name).trim(),
      email: String(email).trim(),
      department: String(department).trim(),
      semester: Number(semester),
      contact: contact ? String(contact).trim() : ""
    });

    console.log("Student saved:", student.studentId);

    return res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student
    });
  } catch (err) {
    console.error("addStudent error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists"
      });
    }

    if (
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while adding student"
    });
  }
};


exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    console.error("getAllStudents error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error("getStudent error:", err);
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
    console.error("updateStudent error:", err);
    if (err.name === "ValidationError")
      return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("deleteStudent error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};