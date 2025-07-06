CREATE TABLE colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    college_id INT NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id)
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    college_id INT NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(id),
    UNIQUE (code, college_id)
);

CREATE TABLE course_timetables (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);


CREATE OR REPLACE FUNCTION enforce_same_college_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  student_college_id INT;
  course_college_id INT;
BEGIN
  SELECT college_id INTO student_college_id
  FROM students
  WHERE id = NEW.student_id;

  SELECT college_id INTO course_college_id
  FROM courses
  WHERE id = NEW.course_id;

  IF student_college_id IS NULL OR course_college_id IS NULL THEN
    RAISE EXCEPTION 'Student or course does not exist';
  ELSIF student_college_id != course_college_id THEN
    RAISE EXCEPTION 'Cannot enroll: student and course belong to different colleges';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_same_college
BEFORE INSERT OR UPDATE ON student_courses
FOR EACH ROW
EXECUTE FUNCTION enforce_same_college_enrollment();

CREATE OR REPLACE FUNCTION prevent_timetable_clash()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM course_timetables new_ct
    JOIN student_courses sc ON sc.student_id = NEW.student_id
    JOIN course_timetables existing_ct ON existing_ct.course_id = sc.course_id
    WHERE new_ct.course_id = NEW.course_id
      AND new_ct.day_of_week = existing_ct.day_of_week
      AND new_ct.start_time < existing_ct.end_time
      AND existing_ct.start_time < new_ct.end_time
  ) THEN
    RAISE EXCEPTION 'Timetable clash: overlapping course found for student %', NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_timetable_clash
BEFORE INSERT OR UPDATE ON student_courses
FOR EACH ROW
EXECUTE FUNCTION prevent_timetable_clash();

