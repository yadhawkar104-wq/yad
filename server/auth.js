import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const router = Router()
const secret = () => process.env.JWT_SECRET || 'tishk-dev-secret'
const APP_URL = () => process.env.APP_URL || 'http://localhost:3000'
const API_URL = () => process.env.API_URL || 'http://localhost:8000'

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email }, secret(), { expiresIn: '30d' })

export function authMW(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, secret())
    pool
      .query('SELECT id, name, email, role, provider, avatar, phone FROM users WHERE id=$1', [payload.id])
      .then(({ rows }) => {
        if (!rows[0]) return res.status(401).json({ error: 'unauthorized' })
        req.user = rows[0]
        next()
      })
      .catch(next)
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

const userOut = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, provider: u.provider, avatar: u.avatar, phone: u.phone })

// Register with email & password (role chosen right after)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ error: 'Please fill all fields (password at least 6 characters).' })
    const hash = bcrypt.hashSync(password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), hash]
    )
    const user = rows[0]
    res.json({ token: sign(user), user: userOut(user) })
  } catch (e) {
    if (String(e.code) === '23505') return res.status(400).json({ error: 'An account with this email already exists.' })
    res.status(400).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [(email || '').trim().toLowerCase()])
    const user = rows[0]
    if (!user || !user.password_hash) return res.status(400).json({ error: 'Invalid email or password.' })
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(400).json({ error: 'Invalid email or password.' })
    res.json({ token: sign(user), user: userOut(user) })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/me', authMW, (req, res) => res.json({ user: req.user }))

// Choose a role after signup / first social login
router.post('/select-role', authMW, async (req, res) => {
  try {
    const { role } = req.body
    if (!['admin', 'teacher', 'student', 'parent'].includes(role))
      return res.status(400).json({ error: 'Invalid role' })
    await pool.query('UPDATE users SET role=$1 WHERE id=$2', [role, req.user.id])
    if (role === 'teacher') {
      await pool.query(
        `INSERT INTO teachers (user_id, name, email, phone) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [req.user.id, req.user.name, req.user.email, req.user.phone]
      )
    }
    if (role === 'student') {
      const { rows } = await pool.query('SELECT count(*)::int AS c FROM students')
      await pool.query(
        `INSERT INTO students (user_id, admission_no, name) VALUES ($1,$2,$3)`,
        [req.user.id, 'TG-' + (new Date().getFullYear()) + '-' + (5000 + rows[0].c), req.user.name]
      )
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id])
    res.json({ token: sign(rows[0]), user: userOut(rows[0]) })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ---- Social login (Google / Microsoft / Facebook) ----
const providers = {
  google: {
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    async profile(accessToken) {
      const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + accessToken } })
      const p = await r.json()
      return { email: p.email, name: p.name || 'User' }
    }
  },
  microsoft: {
    clientId: () => process.env.MICROSOFT_CLIENT_ID,
    clientSecret: () => process.env.MICROSOFT_CLIENT_SECRET,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'openid email profile User.Read',
    async profile(accessToken) {
      const r = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: 'Bearer ' + accessToken } })
      const p = await r.json()
      return { email: p.mail || p.userPrincipalName, name: p.displayName || 'User' }
    }
  },
  facebook: {
    clientId: () => process.env.FACEBOOK_APP_ID,
    clientSecret: () => process.env.FACEBOOK_APP_SECRET,
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scope: 'email',
    async profile(accessToken) {
      const r = await fetch('https://graph.facebook.com/v19.0/me?fields=name,email&access_token=' + accessToken)
      const p = await r.json()
      return { email: p.email, name: p.name || 'User' }
    }
  }
}

router.get('/:provider/start', async (req, res) => {
  const p = req.params.provider
  const cfg = providers[p]
  if (!cfg || !cfg.clientId())
    return res.redirect(APP_URL() + '/login?social_error=' + encodeURIComponent(p))
  const redirect_uri = API_URL() + '/api/auth/' + p + '/callback'
  res.redirect(
    cfg.authUrl +
      '?client_id=' + encodeURIComponent(cfg.clientId()) +
      '&redirect_uri=' + encodeURIComponent(redirect_uri) +
      '&response_type=code&scope=' + encodeURIComponent(cfg.scope)
  )
})

router.get('/:provider/callback', async (req, res) => {
  const p = req.params.provider
  const cfg = providers[p]
  const redirect_uri = API_URL() + '/api/auth/' + p + '/callback'
  try {
    if (!req.query.code || !cfg || !cfg.clientId()) throw new Error('not_configured')
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId(),
        client_secret: cfg.clientSecret(),
        code: req.query.code,
        grant_type: 'authorization_code',
        redirect_uri
      })
    })
    const tok = await tokenRes.json()
    if (!tok.access_token) throw new Error('token_exchange_failed')
    const info = await cfg.profile(tok.access_token)
    if (!info.email) return res.redirect(APP_URL() + '/login?social_error=no_email')
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, provider) VALUES ($1,$2,$3)
       ON CONFLICT (email) DO UPDATE SET provider=EXCLUDED.provider, name=COALESCE(users.name, EXCLUDED.name)
       RETURNING *`,
      [info.name, info.email.toLowerCase(), p]
    )
    const user = rows[0]
    res.redirect(APP_URL() + '/auth/callback?token=' + sign(user))
  } catch (e) {
    res.redirect(APP_URL() + '/login?social_error=' + encodeURIComponent(p))
  }
})

export default router
