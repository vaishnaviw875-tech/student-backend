const student = await Student.create({
  studentId: String(studentId).trim(),
  name: String(name).trim(),
  email: String(email).trim(),
  department: String(department).trim(),
  semester: Number(semester),
  contact: req.body.contact ? String(req.body.contact).trim() : ""
});

console.log("Student saved:", student.studentId);