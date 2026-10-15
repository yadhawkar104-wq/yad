import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg
export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT,
  provider TEXT NOT NULL DEFAULT 'local',
  avatar TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  hire_date DATE
);
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  parent_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admission_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  grade TEXT,
  section TEXT DEFAULT 'A',
  dob DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  room TEXT,
  capacity INTEGER DEFAULT 30
);
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT
);
CREATE TABLE IF NOT EXISTS enrollments (
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, class_id)
);
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  UNIQUE (student_id, class_id, date)
);
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  points INTEGER DEFAULT 100,
  created_by INTEGER
);
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'exam',
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 100,
  term TEXT DEFAULT 'Term 1',
  date DATE
);
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT
);
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  audience TEXT NOT NULL DEFAULT 'all',
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT
);
CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  category TEXT,
  copies INTEGER NOT NULL DEFAULT 1,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS borrows (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
`

async function ins(table, obj) {
  const keys = Object.keys(obj)
  const vals = keys.map((k) => obj[k])
  const ph = keys.map((_, i) => `$${i + 1}`).join(',')
  const { rows } = await pool.query(
    `INSERT INTO ${table} (${keys.join(',')}) VALUES (${ph}) RETURNING *`,
    vals
  )
  return rows[0]
}

export async function initDB() {
  await pool.query(SCHEMA)
  const { rows } = await pool.query('SELECT count(*)::int AS c FROM users')
  if (rows[0].c === 0) await seed()
  console.log('DB ready')
}

async function seed() {
  console.log('Seeding demo data...')
  const pw = bcrypt.hashSync('Demo@2026', 10)
  const admin = await ins('users', { name: 'School Admin', email: 'admin@tishk.edu', password_hash: pw, role: 'admin' })
  const tUser = await ins('users', { name: 'Dilan Ahmed', email: 'teacher@tishk.edu', password_hash: pw, role: 'teacher' })
  const sUser = await ins('users', { name: 'Ranj Muhammad', email: 'student@tishk.edu', password_hash: pw, role: 'student' })
  const pUser = await ins('users', { name: 'Bakhtiar Omer', email: 'parent@tishk.edu', password_hash: pw, role: 'parent' })

  const teacherDefs = [
    ['Dilan Ahmed', 'dilan@tishk.edu', 'Mathematics', '2021-09-01', tUser.id],
    ['Karwan Ali', 'karwan@tishk.edu', 'English', '2020-09-01', null],
    ['Lana Hussein', 'lana@tishk.edu', 'Kurdish', '2019-09-01', null],
    ['Sara Omer', 'sara@tishk.edu', 'Arabic', '2022-09-01', null],
    ['Aram Salih', 'aram@tishk.edu', 'Science', '2018-09-01', null],
    ['Hemin Kareem', 'hemin@tishk.edu', 'Computer', '2023-09-01', null]
  ]
  const teachers = []
  for (const [name, email, subject, hire, uid] of teacherDefs) {
    teachers.push(
      await ins('teachers', { user_id: uid, name, email, phone: '0770' + (1000000 + teachers.length * 111111), subject, hire_date: hire })
    )
  }

  const subjectDefs = [
    ['Mathematics', 'MTH'], ['English', 'ENG'], ['Kurdish', 'KUR'], ['Arabic', 'ARB'],
    ['Science', 'SCI'], ['Physics', 'PHY'], ['Chemistry', 'CHM'], ['Computer', 'CMP'],
    ['History', 'HIS'], ['Geography', 'GEO'], ['Art', 'ART'], ['Sports', 'PET']
  ]
  const subjects = []
  for (const [name, code] of subjectDefs) subjects.push(await ins('subjects', { name, code }))

  const classDefs = [
    [teachers[0], '7-A', 'Grade 7', '101'],
    [teachers[2], '8-A', 'Grade 8', '102'],
    [teachers[1], '9-A', 'Grade 9', '201'],
    [teachers[4], '10-A', 'Grade 10', '202']
  ]
  const classes = []
  for (const [t, name, grade, room] of classDefs)
    classes.push(await ins('classes', { name, grade, teacher_id: t.id, room, capacity: 30 }))

  const studentDefs = [
    ['Ranj Muhammad', 'Grade 9', 'Kamil Muhammad'],
    ['Awin Salih', 'Grade 9', 'Salih Ahmed'],
    ['Zana Farid', 'Grade 9', 'Farid Khidhir'],
    ['Hoshyar Nabi', 'Grade 9', 'Nabi Rashid'],
    ['Lava Karim', 'Grade 7', 'Karim Salar'],
    ['Botan Aziz', 'Grade 7', 'Aziz Hamid'],
    ['Shilan Jamal', 'Grade 8', 'Jamal Nader'],
    ['Karo Wali', 'Grade 8', 'Wali Ahmad'],
    ['Nalin Bakhtiar', 'Grade 10', 'Bakhtiar Nader'],
    ['Sipan Diyar', 'Grade 10', 'Diyar Ali'],
    ['Rojin Haider', 'Grade 10', 'Haider Omar'],
    ['Awat Sabir', 'Grade 7', 'Sabir Jalal']
  ]
  const students = []
  for (let i = 0; i < studentDefs.length; i++) {
    const [name, grade, guardian] = studentDefs[i]
    students.push(
      await ins('students', {
        user_id: i === 0 ? sUser.id : null,
        parent_user_id: i === 0 ? pUser.id : null,
        admission_no: 'TG-2026-' + (101 + i),
        name,
        grade,
        section: 'A',
        dob: '201' + (i % 6) + '-0' + (1 + (i % 9)) + '-1' + (i % 9),
        guardian_name: guardian,
        guardian_phone: '0771' + (2000000 + i * 12345),
        address: 'Erbil, Kurdistan'
      })
    )
  }

  const gradeToClass = { 'Grade 7': classes[0], 'Grade 8': classes[1], 'Grade 9': classes[2], 'Grade 10': classes[3] }
  for (const s of students)
    await pool.query('INSERT INTO enrollments (student_id, class_id) VALUES ($1,$2)', [s.id, gradeToClass[s.grade].id])

  const periods = [['08:00', '09:00'], ['09:00', '10:00'], ['10:15', '11:15'], ['11:15', '12:15'], ['12:30', '13:30']]
  const tt = []
  classes.forEach((c, ci) => {
    for (let day = 0; day < 5; day++)
      periods.forEach(([st, en], pi) => {
        const subj = subjects[(ci * 5 + day * 3 + pi) % subjects.length]
        tt.push(ins('timetable', { class_id: c.id, subject_id: subj.id, day, start_time: st, end_time: en, room: c.room }))
      })
  })
  await Promise.all(tt)

  await ins('assignments', { class_id: classes[2].id, subject_id: subjects[0].id, title: 'Algebra worksheet 3', description: 'Solve exercises 1-20 from chapter 3.', due_date: '2026-10-25', points: 20, created_by: tUser.id })
  await ins('assignments', { class_id: classes[2].id, subject_id: subjects[1].id, title: 'Essay: My future career', description: 'Write a 300-word essay about your dream job.', due_date: '2026-10-28', points: 25, created_by: tUser.id })
  await ins('assignments', { class_id: classes[0].id, subject_id: subjects[4].id, title: 'Plant cell diagram', description: 'Draw and label a plant cell.', due_date: '2026-10-22', points: 15, created_by: admin.id })

  const g9 = students.slice(0, 4)
  for (const s of g9)
    for (const si of [0, 1, 4, 5]) {
      const score = 70 + ((s.id * 7 + si * 13) % 26)
      await pool.query(
        `INSERT INTO grades (student_id, subject_id, type, score, max_score, term, date) VALUES ($1,$2,$3,$4,100,'Term 1',CURRENT_DATE - 7)`,
        [s.id, subjects[si].id, si % 2 ? 'quiz' : 'exam', score]
      )
    }

  for (const c of classes) {
    const { rows } = await pool.query('SELECT student_id FROM enrollments WHERE class_id=$1', [c.id])
    for (const r of rows) {
      const st = r.student_id % 5 === 0 ? 'absent' : r.student_id % 7 === 0 ? 'late' : 'present'
      await pool.query('INSERT INTO attendance (student_id, class_id, date, status) VALUES ($1,$2,CURRENT_DATE,$3)', [r.student_id, c.id, st])
    }
  }

  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    await ins('fees', { student_id: s.id, title: 'Tuition — Term 1', amount: 4500000, due_date: '2026-11-01', status: i % 2 ? 'paid' : 'unpaid', paid_at: i % 2 ? new Date() : null })
    if (i % 3 === 0) await ins('fees', { student_id: s.id, title: 'Transport', amount: 600000, due_date: '2026-10-20', status: 'unpaid' })
  }

  const bookDefs = [
    ['Advanced Mathematics', 'J. Stewart', 'Mathematics'], ['Physics for Students', 'H. Ali', 'Science'],
    ['Kurdish Literature', 'P. Salih', 'Literature'], ['English Grammar in Use', 'R. Murphy', 'Languages'],
    ['World History', 'L. Karim', 'History'], ['Geography Atlas', 'UNESCO', 'Geography'],
    ['Introduction to Chemistry', 'A. Kanaan', 'Science'], ['Computer Basics', 'M. Hiwa', 'Computer'],
    ['Art & Design', 'S. Lana', 'Art'], ['Short Stories for Kids', 'Various', 'Literature']
  ]
  let bi = 0
  for (const [title, author, category] of bookDefs)
    await ins('books', { title, author, isbn: '978-1-' + (4000000 + bi++), category, copies: 5, available: 5 })

  await ins('announcements', { title: 'Welcome to the 2026–2027 school year!', body: 'We are delighted to welcome all students and parents to TishkGasha Private School. Classes begin Sunday.', audience: 'all', author_id: admin.id })
  await ins('announcements', { title: 'Parent–teacher meetings', body: 'Meetings will be held next Thursday from 9:00 to 13:00. Please attend.', audience: 'parents', author_id: admin.id })
  await ins('announcements', { title: 'Science fair registration is open', body: 'Register at the science lab before October 20.', audience: 'students', author_id: admin.id })
  await ins('announcements', { title: 'Staff meeting', body: 'All teachers: meeting on Saturday at 10:00 in the conference room.', audience: 'teachers', author_id: admin.id })

  await ins('events', { title: 'Science Fair', description: 'Student projects exhibition', date: '2026-10-25', location: 'Main Hall' })
  await ins('events', { title: 'Parents Meeting', description: 'Discuss first-term progress', date: '2026-10-30', location: 'Conference Room' })
  await ins('events', { title: 'Sports Day', description: 'Annual athletics competition', date: '2026-11-05', location: 'School Stadium' })
  await ins('events', { title: 'Midterm Exams', description: 'First-term midterm exams begin', date: '2026-11-12', location: 'All classrooms' })

  await ins('messages', { sender_id: admin.id, receiver_id: tUser.id, body: 'Welcome aboard! Your classes are ready.' })
  await ins('messages', { sender_id: admin.id, receiver_id: sUser.id, body: 'Welcome to TishkGasha! Check your timetable.' })
  console.log('Seed complete')
}
