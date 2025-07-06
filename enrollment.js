// enrollment.js
const db = require("./db");

async function enrollStudentInCourses(studentId, courseIds) {
    if (!studentId || !Array.isArray(courseIds) || courseIds.length === 0) {
        throw new Error("Invalid studentId or empty course list");
    }

    // Get student
    const studentRes = await db.query("SELECT * FROM students WHERE id = $1", [
        studentId,
    ]);
    if (studentRes.rows.length === 0) {
        throw new Error(`Student with ID ${studentId} does not exist`);
    }
    const student = studentRes.rows[0];

    // Get all courses
    const courseRes = await db.query(
        `SELECT id, college_id FROM courses WHERE id = ANY($1::int[])`,
        [courseIds]
    );

    if (courseRes.rows.length !== courseIds.length) {
        throw new Error("Some course IDs do not exist");
    }

    // Validate college match
    for (const course of courseRes.rows) {
        if (course.college_id !== student.college_id) {
            throw new Error(
                `Course ${course.id} does not belong to the student's college`
            );
        }
    }

    // Check timetable clash
    const newTimetablesRes = await db.query(
        `SELECT day_of_week, start_time, end_time FROM course_timetables WHERE course_id = ANY($1::int[])`,
        [courseIds]
    );
    const newSlots = newTimetablesRes.rows;

    const existingTimetablesRes = await db.query(
        `SELECT ct.day_of_week, ct.start_time, ct.end_time
     FROM student_courses sc
     JOIN course_timetables ct ON sc.course_id = ct.course_id
     WHERE sc.student_id = $1`,
        [studentId]
    );
    const existingSlots = existingTimetablesRes.rows;

    for (const newSlot of newSlots) {
        for (const existing of existingSlots) {
            if (
                newSlot.day_of_week === existing.day_of_week &&
                newSlot.start_time < existing.end_time &&
                existing.start_time < newSlot.end_time
            ) {
                throw new Error(
                    `Timetable clash on ${newSlot.day_of_week} (${newSlot.start_time} - ${newSlot.end_time})`
                );
            }
        }
    }

    const insertPromises = courseIds.map((cid) =>
        db.query(
            `INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
            [studentId, cid]
        )
    );

    await Promise.all(insertPromises);
}

module.exports = {
    enrollStudentInCourses,
};
