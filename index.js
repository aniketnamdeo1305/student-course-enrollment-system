// index.js
require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("./swagger");
const app = express();

const { enrollStudentInCourses } = require("./enrollment");
const { updateCourseTimetable } = require("./admin");
const {
    listColleges,
    listStudents,
    listCourses,
    getStudentCourses,
} = require("./queries");

app.use(express.json());

/**
 * @swagger
 * /enroll:
 *   post:
 *     summary: Enroll a student in courses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, courseIds]
 *             properties:
 *               studentId:
 *                 type: integer
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Enrolled successfully
 *       400:
 *         description: Validation error
 */
app.post("/enroll", async (req, res) => {
    try {
        const { studentId, courseIds } = req.body;
        await enrollStudentInCourses(studentId, courseIds);
        res.send({ message: "Enrolled successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

/**
 * @swagger
 * /courses/{courseId}/timetable:
 *   put:
 *     summary: Update a course's timetable
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 day_of_week:
 *                   type: string
 *                 start_time:
 *                   type: string
 *                 end_time:
 *                   type: string
 *     responses:
 *       200:
 *         description: Timetable updated
 *       400:
 *         description: Validation error
 */
app.put("/courses/:courseId/timetable", async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId, 10);
        const slots = req.body;
        await updateCourseTimetable(courseId, slots);
        res.send({ message: "Timetable updated successfully" });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});

/**
 * @swagger
 * /colleges:
 *   get:
 *     summary: List all colleges
 *     responses:
 *       200:
 *         description: List of colleges
 */
app.get("/colleges", async (req, res) => {
    const result = await listColleges();
    res.send(result);
});

/**
 * @swagger
 * /students:
 *   get:
 *     summary: List all students
 *     parameters:
 *       - in: query
 *         name: collegeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of students
 */
app.get("/students", async (req, res) => {
    const collegeId = req.query.collegeId
        ? parseInt(req.query.collegeId, 10)
        : null;
    const result = await listStudents(collegeId);
    res.send(result);
});

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List all courses
 *     parameters:
 *       - in: query
 *         name: collegeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of courses
 */
app.get("/courses", async (req, res) => {
    const collegeId = req.query.collegeId
        ? parseInt(req.query.collegeId, 10)
        : null;
    const result = await listCourses(collegeId);
    res.send(result);
});

/**
 * @swagger
 * /students/{studentId}/courses:
 *   get:
 *     summary: Get a student's enrolled courses with timetable
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of enrolled courses
 */
app.get("/students/:studentId/courses", async (req, res) => {
    const studentId = parseInt(req.params.studentId, 10);
    const result = await getStudentCourses(studentId);
    res.send(result);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📘 Swagger at http://localhost:${PORT}/api-docs`);
});
