# Electronics Club Management System
## ระบบบริหารจัดการชมรมวิชาชีพอิเล็กทรอนิกส์

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)

---

## 📋 คุณสมบัติ (Phase 1)

| โมดูล | ฟีเจอร์ |
|-------|---------|
| 🔐 ระบบสมาชิก | สมัครสมาชิก, เข้าสู่ระบบ, JWT Auth, แบ่งสิทธิ์ Admin/Committee/Member |
| 📰 ข่าวสาร | CRUD พร้อมอัปโหลดรูป, ค้นหา, กรองหมวดหมู่, pagination |
| 📅 ปฏิทินกิจกรรม | Calendar view แบบ custom, กิจกรรมหลายประเภท, CRUD |
| 📁 คลังเอกสาร | อัปโหลด PDF/Word/Excel/PPT, ค้นหา, กรอง, ดาวน์โหลด |
| 📊 Dashboard | สถิติ, ข่าวล่าสุด, กิจกรรมที่กำลังมา, กราฟสมาชิก |

---

## 🚀 การติดตั้งและรันระบบ

### ขั้นตอนที่ 1: ตั้งค่าฐานข้อมูล MySQL

1. เปิด MySQL client (MySQL Workbench หรือ phpMyAdmin หรือ terminal)
2. รัน SQL schema:
```sql
SOURCE database/schema.sql;
```
หรือ import ผ่าน phpMyAdmin: เลือก Import → เลือกไฟล์ `database/schema.sql`

**ข้อมูล Admin เริ่มต้น:**
- Email: `admin@electronics-club.ac.th`
- Password: `password`

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

```bash
cd backend
copy .env.example .env
```

แก้ไขไฟล์ `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=รหัสผ่าน MySQL ของคุณ
DB_NAME=electronics_club
JWT_SECRET=เปลี่ยน_key_นี้ให้ปลอดภัย
```

### ขั้นตอนที่ 3: ติดตั้ง Dependencies และรัน

```bash
cd backend
npm install
npm run dev
```

เปิดเบราว์เซอร์: **http://localhost:5000**

---

## 🗂️ โครงสร้างโปรเจกต์

```
electronics-club/
├── backend/
│   ├── server.js              ← Express entry point
│   ├── config/database.js     ← MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js            ← JWT middleware
│   │   └── upload.js          ← Multer file upload
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── news.routes.js
│   │   ├── events.routes.js
│   │   ├── documents.routes.js
│   │   └── dashboard.routes.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html             ← หน้าหลัก
│   ├── login.html
│   ├── register.html
│   ├── news.html
│   ├── events.html
│   ├── documents.html
│   ├── profile.html
│   ├── dashboard.html
│   ├── css/
│   │   ├── main.css           ← Design system
│   │   └── sidebar.css
│   └── js/
│       ├── api.js             ← API client + helpers
│       ├── layout.js          ← Sidebar/navbar injector
│       ├── sidebar.js         ← Sidebar manager
│       ├── news.js
│       ├── calendar.js
│       └── documents.js
├── uploads/                   ← ไฟล์ที่อัปโหลด (auto-created)
│   ├── news/
│   ├── documents/
│   ├── avatars/
│   └── projects/
└── database/
    └── schema.sql             ← MySQL schema + seed data
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | สมัครสมาชิก | Public |
| POST | `/api/auth/login` | เข้าสู่ระบบ | Public |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน | 🔐 |
| GET | `/api/news` | รายการข่าว | Public |
| POST | `/api/news` | เพิ่มข่าว + รูป | 🔐 Committee+ |
| PUT | `/api/news/:id` | แก้ไขข่าว | 🔐 Committee+ |
| DELETE | `/api/news/:id` | ลบข่าว | 🔐 Committee+ |
| GET | `/api/events` | รายการกิจกรรม | Public |
| POST | `/api/events` | เพิ่มกิจกรรม | 🔐 Committee+ |
| GET | `/api/documents` | รายการเอกสาร | 🔐 |
| POST | `/api/documents` | อัปโหลดเอกสาร | 🔐 |
| GET | `/api/documents/:id/download` | ดาวน์โหลด | 🔐 |
| GET | `/api/dashboard/stats` | สถิติ Dashboard | 🔐 Admin/Committee |

---

## 🎨 Design System

- **Primary Color:** `#1565C0` (Deep Blue)
- **Accent:** `#FFD600` (Electric Yellow)
- **Background:** `#07101F` (Dark Navy)
- **Font:** Inter (Google Fonts)
- **Theme:** Dark mode with glassmorphism elements

---

## 🔮 Phase 2 (กำลังพัฒนา)

- [ ] ระบบเวรทิ้งขยะ + แจ้งเตือน LINE Bot 15:30 น.
- [ ] ระบบโครงการและผลงาน
- [ ] Gallery รูปภาพกิจกรรม
- [ ] ระบบแจ้งเตือนในแอป

---

## 🛡️ Security

- JWT tokens (7 วัน expiry)
- bcrypt password hashing (salt 10)
- Role-based access control
- File type whitelist validation
- SQL injection prevention (parameterized queries)
- CORS configuration

---

## 📦 Dependencies

```json
{
  "express": "^4.19",
  "mysql2": "^3.9",
  "jsonwebtoken": "^9.0",
  "bcryptjs": "^2.4",
  "multer": "^1.4",
  "dotenv": "^16.4",
  "cors": "^2.8",
  "express-validator": "^7.1",
  "node-cron": "^3.0"
}
```
