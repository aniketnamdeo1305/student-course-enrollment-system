// admin.js
const db = require("./db");

async function updateCourseTimetable(courseId, newSlots) {
    if (!Array.isArray(newSlots) || newSlots.length === 0) {
        throw new Error("Timetable update requires at least one slot");
    }

    // Check if course exists
    const courseRes = await db.query("SELECT * FROM courses WHERE id = $1", [
        courseId,
    ]);
    if (courseRes.rows.length === 0) {
        throw new Error(`Course with ID ${courseId} does not exist`);
    }

    const course = courseRes.rows[0];

    // Get students enrolled in the course
    const studentRes = await db.query(
        "SELECT DISTINCT student_id FROM student_courses WHERE course_id = $1",
        [courseId]
    );
    const studentIds = studentRes.rows.map((row) => row.student_id);

    // If no one is enrolled, skip clash check
    if (studentIds.length > 0) {
        // Get all other course timetables for these students
        const conflictRes = await db.query(
            `SELECT sc.student_id, ct.day_of_week, ct.start_time, ct.end_time
       FROM student_courses sc
       JOIN course_timetables ct ON ct.course_id = sc.course_id
       WHERE sc.student_id = ANY($1::int[]) AND sc.course_id != $2`,
            [studentIds, courseId]
        );
        const existingSlots = conflictRes.rows;

        // Check each new slot for clash
        for (const newSlot of newSlots) {
            for (const ex of existingSlots) {
                if (
                    newSlot.day_of_week === ex.day_of_week &&
                    newSlot.start_time < ex.end_time &&
                    ex.start_time < newSlot.end_time
                ) {
                    throw new Error(
                        `Cannot update timetable: student ${ex.student_id} has a conflict on ${newSlot.day_of_week} (${newSlot.start_time} - ${newSlot.end_time})`
                    );
                }
            }
        }
    }

    // Delete existing timetable
    await db.query("DELETE FROM course_timetables WHERE course_id = $1", [
        courseId,
    ]);

    // Insert new slots
    const insertPromises = newSlots.map((slot) =>
        db.query(
            `INSERT INTO course_timetables (course_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)`,
            [courseId, slot.day_of_week, slot.start_time, slot.end_time]
        )
    );

    await Promise.all(insertPromises);
}

module.exports = {
    updateCourseTimetable,
};
