# TishkGasha — Private School Management System

A full-stack school management web app (English / Kurdish / Arabic with RTL).

## Stack
- **Frontend:** Vite + React 18 + Tailwind CSS (dev server on port 3000, proxies `/api`)
- **Backend:** Express + PostgreSQL (`server/`, API on port 8000)
- **Auth:** email & password (bcrypt + JWT), plus Google / Microsoft / Facebook OAuth (needs API keys, see below), and post-signup role selection (admin / teacher / student / parent)

## Run (Base44 sandbox)
```
docker compose -f docker-compose.base44.yml up -d
```
- Web: http://localhost:3000 · API: http://localhost:8000
- DB schema and demo data are created automatically on first boot (`server/db.js`).

## Demo accounts (password `Demo@2026`)
- admin@tishk.edu · teacher@tishk.edu · student@tishk.edu · parent@tishk.edu

## Social login setup
Set `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET` in the app secrets.
Redirect URIs: `https://<api-public-host>/api/auth/<google|microsoft|facebook>/callback`.
Without keys the buttons show a "not configured" notice; everything else works.

## Modules
Students, Teachers, Classes, Attendance, Assignments (+submissions & grading), Grades/report cards, Timetable, Announcements, Events, Fees, Library, Messaging, Profile — with role-based access.
