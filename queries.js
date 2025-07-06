// queries.js
const db = require("./db");

// List all colleges
async function listColleges() {
    const res = await db.query("SELECT id, name FROM colleges ORDER BY id");
    return res.rows;
}

// List all students (optionally by college)
async function listStudents(collegeId = null) {
    const query = collegeId
        ? "SELECT id, name, college_id FROM students WHERE college_id = $1 ORDER BY id"
        : "SELECT id, name, college_id FROM students ORDER BY id";
    const res = await db.query(query, collegeId ? [collegeId] : []);
    return res.rows;
}

// List all courses (optionally by college)
async function listCourses(collegeId = null) {
    const query = collegeId
        ? "SELECT id, code, college_id FROM courses WHERE college_id = $1 ORDER BY id"
        : "SELECT id, code, college_id FROM courses ORDER BY id";
    const res = await db.query(query, collegeId ? [collegeId] : []);
    return res.rows;
}

// Get student enrolled courses with timetable
async function getStudentCourses(studentId) {
    const res = await db.query(
        `SELECT c.id AS course_id, c.code, ct.day_of_week, ct.start_time, ct.end_time
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     LEFT JOIN course_timetables ct ON ct.course_id = c.id
     WHERE sc.student_id = $1
     ORDER BY c.id, ct.day_of_week`,
        [studentId]
    );
    return res.rows;
}

module.exports = {
    listColleges,
    listStudents,
    listCourses,
    getStudentCourses,
};
