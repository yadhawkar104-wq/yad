import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'
import { authMW } from './auth.js'

const router = Router()
router.use(authMW)

const q = (sql, params = []) => pool.query(sql, params)
const wrap = (fn) => (req, res, next) => fn(req, res).catch((e) => res.status(400).json({ error: e.message }))
const staff = (req) => ['admin', 'teacher'].includes(req.user.role)
const adminOnly = (req) => req.user.role === 'admin'
const forbid = (res) => res.status(403).json({ error: 'forbidden' })

// student ids visible to the current user (null = all, for staff)
async function studentIds(req) {
  if (req.user.role === 'student') {
    const { rows } = await q('SELECT id FROM students WHERE user_id=$1', [req.user.id])
    return rows.map((r) => r.id)
  }
  if (req.user.role === 'parent') {
    const { rows } = await q('SELECT id FROM students WHERE parent_user_id=$1', [req.user.id])
    return rows.map((r) => r.id)
  }
  return null
}
const inClause = (ids) => (ids.length ? ids.join(',') : '0')

// ---------- profile ----------
router.patch('/users/me', wrap(async (req, res) => {
  const { name, phone, avatar } = req.body
  const { rows } = await q('UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), avatar=COALESCE($3,avatar) WHERE id=$4 RETURNING id,name,email,role,provider,avatar,phone',
    [name || null, phone || null, avatar || null, req.user.id])
  res.json({ user: rows[0] })
}))

router.post('/users/me/password', wrap(async (req, res) => {
  const { current, next } = req.body
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.user.id])
  const u = rows[0]
  if (!u.password_hash) return res.status(400).json({ error: 'social_account' })
  if (!bcrypt.compareSync(current || '', u.password_hash)) return res.status(400).json({ error: 'wrong_password' })
  if (!next || next.length < 6) return res.status(400).json({ error: 'too_short' })
  await q('UPDATE users SET password_hash=$1 WHERE id=$2', [bcrypt.hashSync(next, 10), req.user.id])
  res.json({ ok: true })
}))

router.get('/contacts', wrap(async (req, res) => {
  const { rows } = await q('SELECT id, name, role, avatar FROM users WHERE id<>$1 ORDER BY name', [req.user.id])
  res.json({ contacts: rows })
}))

// ---------- students ----------
router.get('/students', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const s = (req.query.search || '').trim()
  const { rows } = await q(
    `SELECT s.*, c.name AS class_name FROM students s
     LEFT JOIN enrollments e ON e.student_id=s.id LEFT JOIN classes c ON c.id=e.class_id
     WHERE $1='' OR s.name ILIKE '%'||$1||'%' OR s.admission_no ILIKE '%'||$1||'%'
     ORDER BY s.id`, [s]
  )
  res.json({ students: rows })
}))

router.post('/students', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q(
    `INSERT INTO students (admission_no,name,grade,section,dob,guardian_name,guardian_phone,address,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [b.admission_no, b.name, b.grade, b.section || 'A', b.dob || null, b.guardian_name, b.guardian_phone, b.address, b.status || 'active']
  )
  if (b.class_id) await q('INSERT INTO enrollments (student_id,class_id) VALUES ($1,$2)', [rows[0].id, b.class_id])
  res.json({ student: rows[0] })
}))

router.put('/students/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q(
    `UPDATE students SET admission_no=$1,name=$2,grade=$3,section=$4,dob=$5,guardian_name=$6,guardian_phone=$7,address=$8,status=$9 WHERE id=$10 RETURNING *`,
    [b.admission_no, b.name, b.grade, b.section, b.dob || null, b.guardian_name, b.guardian_phone, b.address, b.status, req.params.id]
  )
  await q('DELETE FROM enrollments WHERE student_id=$1', [req.params.id])
  if (b.class_id) await q('INSERT INTO enrollments (student_id,class_id) VALUES ($1,$2)', [req.params.id, b.class_id])
  res.json({ student: rows[0] })
}))

router.delete('/students/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM students WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- teachers ----------
router.get('/teachers', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const { rows } = await q('SELECT * FROM teachers ORDER BY id')
  res.json({ teachers: rows })
}))

router.post('/teachers', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO teachers (name,email,phone,subject,hire_date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [b.name, b.email, b.phone, b.subject, b.hire_date || null])
  res.json({ teacher: rows[0] })
}))

router.put('/teachers/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE teachers SET name=$1,email=$2,phone=$3,subject=$4,hire_date=$5 WHERE id=$6 RETURNING *',
    [b.name, b.email, b.phone, b.subject, b.hire_date || null, req.params.id])
  res.json({ teacher: rows[0] })
}))

router.delete('/teachers/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM teachers WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- classes & subjects ----------
router.get('/classes', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const { rows } = await q(
    `SELECT c.*, t.name AS teacher_name, (SELECT count(*)::int FROM enrollments e WHERE e.class_id=c.id) AS student_count
     FROM classes c LEFT JOIN teachers t ON t.id=c.teacher_id ORDER BY c.id`
  )
  res.json({ classes: rows })
}))

router.post('/classes', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO classes (name,grade,teacher_id,room,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [b.name, b.grade, b.teacher_id || null, b.room, b.capacity || 30])
  res.json({ class: rows[0] })
}))

router.put('/classes/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE classes SET name=$1,grade=$2,teacher_id=$3,room=$4,capacity=$5 WHERE id=$6 RETURNING *',
    [b.name, b.grade, b.teacher_id || null, b.room, b.capacity || 30, req.params.id])
  res.json({ class: rows[0] })
}))

router.delete('/classes/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM classes WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

router.get('/subjects', wrap(async (req, res) => {
  const { rows } = await q('SELECT * FROM subjects ORDER BY id')
  res.json({ subjects: rows })
}))

// ---------- attendance ----------
router.get('/attendance', wrap(async (req, res) => {
  if (staff(req)) {
    const { class_id, date } = req.query
    if (!class_id || !date) return res.json({ records: [] })
    const { rows } = await q(
      `SELECT s.id AS student_id, s.name, a.status FROM students s
       JOIN enrollments e ON e.student_id=s.id AND e.class_id=$1
       LEFT JOIN attendance a ON a.student_id=s.id AND a.class_id=$1 AND a.date=$2
       ORDER BY s.name`, [class_id, date]
    )
    res.json({ records: rows })
  } else {
    const ids = await studentIds(req)
    const { rows } = await q(
      `SELECT a.id, a.date, a.status, c.name AS class_name FROM attendance a
       JOIN students s ON s.id=a.student_id JOIN classes c ON c.id=a.class_id
       WHERE s.user_id=$1 OR s.parent_user_id=$1 ORDER BY a.date DESC LIMIT 100`, [req.user.id]
    )
    const total = rows.length || 1
    const present = rows.filter((r) => ['present', 'late'].includes(r.status)).length
    res.json({ records: rows, rate: Math.round((present / total) * 100) })
  }
}))

router.post('/attendance', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const { class_id, date, records } = req.body
  for (const r of records) {
    await q(
      `INSERT INTO attendance (student_id,class_id,date,status) VALUES ($1,$2,$3,$4)
       ON CONFLICT (student_id,class_id,date) DO UPDATE SET status=EXCLUDED.status`,
      [r.student_id, class_id, date, r.status || 'present']
    )
  }
  res.json({ ok: true })
}))

// ---------- assignments & submissions ----------
router.get('/assignments', wrap(async (req, res) => {
  if (req.user.role === 'student') {
    const { rows } = await q(
      `SELECT a.*, c.name AS class_name, sub.name AS subject_name,
              sm.id AS my_submission_id, sm.grade AS my_grade, sm.feedback AS my_feedback, sm.status AS my_status
       FROM assignments a
       JOIN classes c ON c.id=a.class_id
       LEFT JOIN subjects sub ON sub.id=a.subject_id
       LEFT JOIN submissions sm ON sm.assignment_id=a.id AND sm.student_id=(SELECT id FROM students WHERE user_id=$1)
       WHERE a.class_id IN (SELECT e.class_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE s.user_id=$1)
       ORDER BY a.due_date DESC`, [req.user.id]
    )
    return res.json({ assignments: rows })
  }
  if (!staff(req)) return forbid(res)
  const { rows } = await q(
    `SELECT a.*, c.name AS class_name, sub.name AS subject_name,
            (SELECT count(*)::int FROM submissions s WHERE s.assignment_id=a.id) AS submission_count
     FROM assignments a JOIN classes c ON c.id=a.class_id
     LEFT JOIN subjects sub ON sub.id=a.subject_id ORDER BY a.due_date DESC`
  )
  res.json({ assignments: rows })
}))

router.post('/assignments', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const b = req.body
  const { rows } = await q(
    'INSERT INTO assignments (class_id,subject_id,title,description,due_date,points,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [b.class_id, b.subject_id || null, b.title, b.description, b.due_date || null, b.points || 100, req.user.id]
  )
  res.json({ assignment: rows[0] })
}))

router.put('/assignments/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE assignments SET class_id=$1,subject_id=$2,title=$3,description=$4,due_date=$5,points=$6 WHERE id=$7 RETURNING *',
    [b.class_id, b.subject_id || null, b.title, b.description, b.due_date || null, b.points || 100, req.params.id])
  res.json({ assignment: rows[0] })
}))

router.delete('/assignments/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  await q('DELETE FROM assignments WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

router.get('/assignments/:id/submissions', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const { rows } = await q(
    `SELECT sm.*, s.name AS student_name FROM submissions sm
     JOIN students s ON s.id=sm.student_id WHERE sm.assignment_id=$1 ORDER BY s.name`, [req.params.id]
  )
  res.json({ submissions: rows })
}))

router.post('/assignments/:id/submit', wrap(async (req, res) => {
  if (req.user.role !== 'student') return forbid(res)
  const { content } = req.body
  const { rows } = await q(
    `INSERT INTO submissions (assignment_id,student_id,content) VALUES ($1,(SELECT id FROM students WHERE user_id=$2),$3)
     ON CONFLICT (assignment_id,student_id) DO UPDATE SET content=EXCLUDED.content, submitted_at=now()
     RETURNING *`, [req.params.id, req.user.id, content]
  )
  res.json({ submission: rows[0] })
}))

router.patch('/submissions/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const { grade, feedback } = req.body
  const { rows } = await q('UPDATE submissions SET grade=$1, feedback=$2 WHERE id=$3 RETURNING *',
    [grade, feedback, req.params.id])
  res.json({ submission: rows[0] })
}))

// ---------- grades ----------
router.get('/grades', wrap(async (req, res) => {
  if (staff(req) && !req.query.student_id) {
    const { rows } = await q(
      `SELECT g.*, s.name AS student_name, sub.name AS subject_name FROM grades g
       JOIN students s ON s.id=g.student_id JOIN subjects sub ON sub.id=g.subject_id ORDER BY g.id DESC LIMIT 300`
    )
    return res.json({ grades: rows })
  }
  const ids = await studentIds(req)
  const filter = staff(req) && req.query.student_id ? `g.student_id=${parseInt(req.query.student_id)}` : `g.student_id IN (${inClause(ids || [])})`
  const { rows } = await q(
    `SELECT g.*, s.name AS student_name, sub.name AS subject_name FROM grades g
     JOIN students s ON s.id=g.student_id JOIN subjects sub ON sub.id=g.subject_id
     WHERE ${filter} ORDER BY sub.id, g.date DESC NULLS LAST`
  )
  res.json({ grades: rows })
}))

router.post('/grades', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const b = req.body
  const { rows } = await q(
    'INSERT INTO grades (student_id,subject_id,type,score,max_score,term,date) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE) RETURNING *',
    [b.student_id, b.subject_id, b.type || 'exam', b.score, b.max_score || 100, b.term || 'Term 1']
  )
  res.json({ grade: rows[0] })
}))

router.delete('/grades/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  await q('DELETE FROM grades WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- timetable ----------
router.get('/timetable', wrap(async (req, res) => {
  let classId = req.query.class_id
  if (!classId) {
    const { rows } = await q(
      `SELECT e.class_id FROM enrollments e JOIN students s ON s.id=e.student_id
       WHERE s.user_id=$1 OR s.parent_user_id=$1 LIMIT 1`, [req.user.id]
    )
    classId = rows[0]?.class_id
    if (!classId && req.user.role === 'teacher') {
      const t = await q('SELECT id FROM teachers WHERE user_id=$1', [req.user.id])
      const c = t.rows[0] ? await q('SELECT id FROM classes WHERE teacher_id=$1 LIMIT 1', [t.rows[0].id]) : { rows: [] }
      classId = c.rows[0]?.id
    }
    if (!classId && req.user.role !== 'admin') return res.json({ timetable: [], class_id: null })
  }
  const { rows } = await q(
    `SELECT t.*, sub.name AS subject_name, c.name AS class_name FROM timetable t
     JOIN subjects sub ON sub.id=t.subject_id JOIN classes c ON c.id=t.class_id
     WHERE t.class_id=$1 ORDER BY t.day, t.start_time`, [classId]
  )
  res.json({ timetable: rows, class_id: classId ? Number(classId) : null })
}))

router.post('/timetable', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q(
    'INSERT INTO timetable (class_id,subject_id,day,start_time,end_time,room) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [b.class_id, b.subject_id, b.day, b.start_time, b.end_time, b.room]
  )
  res.json({ entry: rows[0] })
}))

router.delete('/timetable/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM timetable WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- announcements ----------
router.get('/announcements', wrap(async (req, res) => {
  const aud = req.user.role === 'admin' ? null : req.user.role + 's'
  const { rows } = await q(
    `SELECT a.*, u.name AS author FROM announcements a LEFT JOIN users u ON u.id=a.author_id
     WHERE $1='' OR a.audience='all' OR a.audience=$1 ORDER BY a.created_at DESC LIMIT 100`, [aud || '']
  )
  res.json({ announcements: rows })
}))

router.post('/announcements', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO announcements (title,body,audience,author_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [b.title, b.body, b.audience || 'all', req.user.id])
  res.json({ announcement: rows[0] })
}))

router.put('/announcements/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE announcements SET title=$1,body=$2,audience=$3 WHERE id=$4 RETURNING *',
    [b.title, b.body, b.audience || 'all', req.params.id])
  res.json({ announcement: rows[0] })
}))

router.delete('/announcements/:id', wrap(async (req, res) => {
  if (!staff(req)) return forbid(res)
  await q('DELETE FROM announcements WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- events ----------
router.get('/events', wrap(async (req, res) => {
  const { rows } = await q('SELECT * FROM events ORDER BY date ASC LIMIT 100')
  res.json({ events: rows })
}))

router.post('/events', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO events (title,description,date,location) VALUES ($1,$2,$3,$4) RETURNING *',
    [b.title, b.description, b.date, b.location])
  res.json({ event: rows[0] })
}))

router.put('/events/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE events SET title=$1,description=$2,date=$3,location=$4 WHERE id=$5 RETURNING *',
    [b.title, b.description, b.date, b.location, req.params.id])
  res.json({ event: rows[0] })
}))

router.delete('/events/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM events WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- fees ----------
router.get('/fees', wrap(async (req, res) => {
  if (req.user.role === 'admin') {
    const { rows } = await q(
      `SELECT f.*, s.name AS student_name FROM fees f JOIN students s ON s.id=f.student_id ORDER BY f.id DESC LIMIT 500`
    )
    return res.json({ fees: rows })
  }
  const ids = await studentIds(req)
  const { rows } = await q(
    `SELECT f.*, s.name AS student_name FROM fees f JOIN students s ON s.id=f.student_id
     WHERE f.student_id IN (${inClause(ids || [])}) ORDER BY f.due_date DESC`
  )
  res.json({ fees: rows })
}))

router.post('/fees', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO fees (student_id,title,amount,due_date,status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [b.student_id, b.title, b.amount, b.due_date || null, b.status || 'unpaid'])
  res.json({ fee: rows[0] })
}))

router.put('/fees/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE fees SET student_id=$1,title=$2,amount=$3,due_date=$4 WHERE id=$5 RETURNING *',
    [b.student_id, b.title, b.amount, b.due_date || null, req.params.id])
  res.json({ fee: rows[0] })
}))

router.post('/fees/:id/pay', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const { rows } = await q(
    `UPDATE fees SET status = CASE WHEN status='paid' THEN 'unpaid' ELSE 'paid' END,
     paid_at = CASE WHEN status='paid' THEN NULL ELSE now() END WHERE id=$1 RETURNING *`, [req.params.id]
  )
  res.json({ fee: rows[0] })
}))

router.delete('/fees/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM fees WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

// ---------- library ----------
router.get('/books', wrap(async (req, res) => {
  const s = (req.query.search || '').trim()
  const { rows } = await q(
    `SELECT * FROM books WHERE $1='' OR title ILIKE '%'||$1||'%' OR author ILIKE '%'||$1||'%' ORDER BY id`, [s]
  )
  res.json({ books: rows })
}))

router.post('/books', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('INSERT INTO books (title,author,isbn,category,copies,available) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [b.title, b.author, b.isbn, b.category, b.copies || 1, b.copies || 1])
  res.json({ book: rows[0] })
}))

router.put('/books/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  const b = req.body
  const { rows } = await q('UPDATE books SET title=$1,author=$2,isbn=$3,category=$4,copies=$5 WHERE id=$6 RETURNING *',
    [b.title, b.author, b.isbn, b.category, b.copies || 1, req.params.id])
  res.json({ book: rows[0] })
}))

router.delete('/books/:id', wrap(async (req, res) => {
  if (!adminOnly(req)) return forbid(res)
  await q('DELETE FROM books WHERE id=$1', [req.params.id])
  res.json({ ok: true })
}))

router.post('/books/:id/borrow', wrap(async (req, res) => {
  if (req.user.role !== 'student') return forbid(res)
  const { rows } = await q(
    `INSERT INTO borrows (book_id, student_id)
     SELECT $1, id FROM students WHERE user_id=$2 AND NOT EXISTS
       (SELECT 1 FROM borrows b2 WHERE b2.student_id=(SELECT id FROM students WHERE user_id=$2) AND b2.book_id=$1 AND b2.returned_at IS NULL)
     RETURNING *`, [req.params.id, req.user.id]
  )
  if (!rows[0]) return res.status(400).json({ error: 'already_borrowed' })
  await q('UPDATE books SET available = GREATEST(available-1,0) WHERE id=$1', [req.params.id])
  res.json({ borrow: rows[0] })
}))

router.post('/borrows/return', wrap(async (req, res) => {
  if (req.user.role !== 'student') return forbid(res)
  const { rows } = await q(
    `UPDATE borrows SET returned_at=now() WHERE id=$1 AND student_id=(SELECT id FROM students WHERE user_id=$2) RETURNING *`,
    [req.body.id, req.user.id]
  )
  if (rows[0]) await q('UPDATE books SET available = LEAST(available+1, copies) WHERE id=$1', [rows[0].book_id])
  res.json({ ok: !!rows[0] })
}))

router.get('/borrows/my', wrap(async (req, res) => {
  const { rows } = await q(
    `SELECT b.*, bk.title, bk.author FROM borrows b JOIN books bk ON bk.id=b.book_id
     WHERE b.student_id=(SELECT id FROM students WHERE user_id=$1) ORDER BY b.borrowed_at DESC`, [req.user.id]
  )
  res.json({ borrows: rows })
}))

// ---------- messages ----------
router.get('/messages', wrap(async (req, res) => {
  const withId = req.query.with
  if (!withId) return res.json({ messages: [] })
  const { rows } = await q(
    `SELECT * FROM messages WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1) ORDER BY created_at ASC`,
    [req.user.id, withId]
  )
  await q('UPDATE messages SET read_at=now() WHERE sender_id=$1 AND receiver_id=$2 AND read_at IS NULL', [withId, req.user.id])
  res.json({ messages: rows })
}))

router.post('/messages', wrap(async (req, res) => {
  const { receiver_id, body } = req.body
  if (!receiver_id || !body?.trim()) return res.status(400).json({ error: 'empty' })
  const { rows } = await q('INSERT INTO messages (sender_id,receiver_id,body) VALUES ($1,$2,$3) RETURNING *',
    [req.user.id, receiver_id, body.trim()])
  res.json({ message: rows[0] })
}))

// ---------- dashboard ----------
router.get('/dashboard', wrap(async (req, res) => {
  const dow = (new Date().getDay() + 6) % 7 // 0=Mon..4=Fri
  const out = { stats: [], timetable: [], announcements: [], events: [], today: dow < 5 }
  const ann = await q(`SELECT a.*, u.name AS author FROM announcements a LEFT JOIN users u ON u.id=a.author_id
    WHERE $1='' OR a.audience='all' OR a.audience=$1 ORDER BY a.created_at DESC LIMIT 4`,
    [req.user.role === 'admin' ? '' : req.user.role + 's'])
  out.announcements = ann.rows
  out.events = (await q('SELECT * FROM events WHERE date >= CURRENT_DATE ORDER BY date ASC LIMIT 4')).rows
  const cnt = async (sql) => (await q(sql)).rows[0].c

  if (req.user.role === 'admin') {
    out.stats = [
      { k: 'students', v: await cnt('SELECT count(*)::int c FROM students'), icon: '👥' },
      { k: 'teachers', v: await cnt('SELECT count(*)::int c FROM teachers'), icon: '👨‍🏫' },
      { k: 'classes', v: await cnt('SELECT count(*)::int c FROM classes'), icon: '🏛️' },
      { k: 'feesDue', v: await cnt(`SELECT coalesce(sum(amount),0)::int c FROM fees WHERE status='unpaid'`), icon: '💳' }
    ]
    const att = await cnt(`SELECT count(*)::int c FROM attendance WHERE date=CURRENT_DATE AND status IN ('present','late')`)
    const attTotal = await cnt('SELECT count(*)::int c FROM attendance WHERE date=CURRENT_DATE')
    out.stats.push({ k: 'attendanceToday', v: attTotal ? Math.round((att / attTotal) * 100) + '%' : '—', icon: '✅' })
    out.timetable = (await q(
      `SELECT t.*, sub.name AS subject_name, c.name AS class_name FROM timetable t
       JOIN subjects sub ON sub.id=t.subject_id JOIN classes c ON c.id=t.class_id
       WHERE t.day=$1 ORDER BY t.start_time LIMIT 20`, [dow]
    )).rows
  } else if (req.user.role === 'teacher') {
    const t = (await q('SELECT id FROM teachers WHERE user_id=$1', [req.user.id])).rows[0]
    const tid = t?.id
    out.stats = [
      { k: 'myClasses', v: tid ? await cnt(`SELECT count(*)::int c FROM classes WHERE teacher_id=${tid}`) : 0, icon: '🏛️' },
      { k: 'students', v: tid ? await cnt(`SELECT count(*)::int c FROM enrollments e JOIN classes c ON c.id=e.class_id WHERE c.teacher_id=${tid}`) : 0, icon: '👥' },
      { k: 'assignments', v: await cnt('SELECT count(*)::int c FROM assignments'), icon: '📝' }
    ]
    if (tid)
      out.timetable = (await q(
        `SELECT t.*, sub.name AS subject_name, c.name AS class_name FROM timetable t
         JOIN subjects sub ON sub.id=t.subject_id JOIN classes c ON c.id=t.class_id
         WHERE t.day=$1 AND c.teacher_id=$2 ORDER BY t.start_time`, [dow, tid]
      )).rows
  } else {
    // student & parent
    const ids = await studentIds(req)
    const scope = `student_id IN (${inClause(ids || [])})`
    const grades = (await q(`SELECT score, max_score FROM grades WHERE ${scope}`)).rows
    const avg = grades.length ? Math.round((grades.reduce((a, g) => a + Number(g.score) / Number(g.max_score), 0) / grades.length) * 100) : null
    const att = (await q(`SELECT status FROM attendance WHERE ${scope}`)).rows
    const rate = att.length ? Math.round((att.filter((a) => a.status !== 'absent').length / att.length) * 100) : null
    const due = (await q(`SELECT coalesce(sum(amount),0)::int c FROM fees WHERE ${scope} AND status='unpaid'`)).rows[0].c
    out.stats = [
      { k: 'gradeAvg', v: avg === null ? '—' : avg + '%', icon: '📊' },
      { k: 'attendanceRate', v: rate === null ? '—' : rate + '%', icon: '✅' },
      { k: 'feesDue', v: due, icon: '💳' }
    ]
    if (req.user.role === 'parent') out.stats.unshift({ k: 'children', v: ids.length, icon: '👨‍👩‍👧' })
    const cls = (await q(
      `SELECT e.class_id FROM enrollments e JOIN students s ON s.id=e.student_id WHERE ${scope} LIMIT 1`
    )).rows[0]
    if (cls)
      out.timetable = (await q(
        `SELECT t.*, sub.name AS subject_name, c.name AS class_name FROM timetable t
         JOIN subjects sub ON sub.id=t.subject_id JOIN classes c ON c.id=t.class_id
         WHERE t.day=$1 AND t.class_id=$2 ORDER BY t.start_time`, [dow, cls.class_id]
      )).rows
  }
  res.json(out)
}))

export default router
