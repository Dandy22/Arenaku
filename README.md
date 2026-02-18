# Booking Venue — Setup Guide

Panduan setup project **booking-venue** untuk tim. Ikuti langkah ini **berurutan**.

---

## Tech Stack

| Teknologi    | Versi           | Fungsi                             |
| ------------ | --------------- | ---------------------------------- |
| Next.js      | 16 (App Router) | Framework backend & frontend       |
| TypeScript   | 5               | Bahasa pemrograman                 |
| Prisma ORM   | 7               | Query builder & migration database |
| PostgreSQL   | 16              | Database utama                     |
| bcrypt       | 6               | Hash password                      |
| jsonwebtoken | 9               | JWT autentikasi                    |
| Tailwind CSS | 4               | Styling frontend                   |

---

## 1. Install Software yang Dibutuhkan

### Node.js (WAJIB, minimal v18)

```
https://nodejs.org
```

Cek instalasi:

```bash
node -v
npm -v
```

### Bun (WAJIB untuk seed database)

```bash
curl -fsSL https://bun.sh/install | bash
```

Restart terminal lalu cek:

```bash
bun --version
```

### Git

```
https://git-scm.com
```

Cek:

```bash
git --version
```

### VS Code (Direkomendasikan)

```
https://code.visualstudio.com
```

Extension yang disarankan:

- **Prisma** — syntax highlighting schema.prisma
- **ESLint** — linting kode
- **Prettier** — format kode otomatis
- **Tailwind CSS IntelliSense** — autocomplete class Tailwind

---

## 2. Clone Project

```bash
git clone https://github.com/USERNAME/booking-venue.git
cd booking-venue
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Setup Environment (.env)

Buat file `.env` di root project (sejajar dengan `package.json`):

```env
# Koneksi database PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_venue"

# Secret key untuk JWT token — WAJIB ada, jangan dihapus
JWT_SECRET="booking_venue_secret_kunci_rahasia_2024"
```

> ⚠️ File `.env` TIDAK boleh di-commit ke Git. Sudah ada di `.gitignore`.

---

## 5. Setup Database (PostgreSQL)

Ada 2 opsi — pilih salah satu:

### OPSI A — Docker (Direkomendasikan untuk tim)

Install Docker: https://www.docker.com

Jalankan container PostgreSQL:

```bash
docker run --name booking-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booking_venue \
  -p 5432:5432 \
  -d postgres:16
```

Setelah itu update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_venue"
```

Untuk menjalankan ulang container yang sudah ada:

```bash
docker start booking-db
```

---

### OPSI B — PostgreSQL Lokal (macOS dengan Homebrew)

Install PostgreSQL:

```bash
brew install postgresql@16
brew services start postgresql@16
```

Buat database:

```bash
createdb booking_venue
```

Update `.env` sesuai username PostgreSQL kamu:

```env
DATABASE_URL="postgresql://USERNAME_KAMU@localhost:5432/booking_venue"
```

Untuk menjalankan ulang setelah restart komputer:

```bash
brew services start postgresql@16
```

---

## 6. Konfigurasi Prisma

Pastikan file `prisma.config.ts` di root project isinya seperti ini:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun ./prisma/seed.ts", // ← wajib ada untuk npx prisma db seed
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

---

## 7. Setup Prisma (Lakukan Sekali Saja)

Jalankan perintah berikut **secara berurutan**:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Jalankan migration (buat semua tabel di database)
npx prisma migrate dev

# 3. Isi data awal untuk testing
npx prisma db seed
```

Jika seed berhasil, output akan seperti ini:

```
✅ Customer created: customer@mail.com
✅ Admin created: admin@mail.com
✅ Vendor created: vendor@mail.com
🎉 Seeding completed successfully!
```

### Akun Demo (hasil seed)

| Role     | Email             | Password |
| -------- | ----------------- | -------- |
| CUSTOMER | customer@mail.com | 123456   |
| VENDOR   | vendor@mail.com   | 123456   |
| ADMIN    | admin@mail.com    | admin123 |

---

## 8. Jalankan Project

```bash
npm run dev
```

Buka browser atau Postman:

```
http://localhost:3000
```

Test API (tidak perlu login):

```
GET http://localhost:3000/api/venues
GET http://localhost:3000/api/events
```

Kalau keluar JSON → setup berhasil ✅

---

## Struktur Project

Project ini menggunakan arsitektur **Three-Tier**:

```
booking-venue/
├── app/
│   └── api/                    ← Tier 1: Route Handlers (terima request HTTP)
│       ├── auth/login/
│       ├── auth/register/
│       ├── bookings/
│       ├── events/
│       ├── fields/
│       ├── profile/
│       ├── users/
│       └── venues/
│
├── lib/
│   ├── auth.ts                 ← Helper JWT (verifyToken, getUserFromToken)
│   ├── prisma.ts               ← Koneksi database (singleton)
│   ├── services/               ← Tier 2: Business Logic (aturan bisnis)
│   │   ├── auth.service.ts
│   │   ├── booking.service.ts
│   │   ├── event.service.ts
│   │   ├── field.service.ts
│   │   └── venue.service.ts
│   └── repositories/           ← Tier 3: Data Access (query database)
│       ├── booking.repository.ts
│       ├── event.repository.ts
│       ├── field.repository.ts
│       ├── user.repository.ts
│       └── venue.repository.ts
│
├── prisma/
│   ├── schema.prisma           ← Definisi tabel database
│   └── seed.ts                 ← Data awal untuk testing
│
├── prisma.config.ts            ← Konfigurasi Prisma
└── .env                        ← Environment variables (JANGAN di-commit!)
```

---

## API Endpoints

| Endpoint                | Method | Auth | Akses    |
| ----------------------- | ------ | ---- | -------- |
| `/api/auth/register`    | POST   | ❌   | Publik   |
| `/api/auth/login`       | POST   | ❌   | Publik   |
| `/api/venues`           | GET    | ❌   | Publik   |
| `/api/events`           | GET    | ❌   | Publik   |
| `/api/fields?venueId=x` | GET    | ❌   | Publik   |
| `/api/venues`           | POST   | ✅   | VENDOR   |
| `/api/fields`           | POST   | ✅   | VENDOR   |
| `/api/bookings`         | POST   | ✅   | CUSTOMER |
| `/api/bookings`         | GET    | ✅   | CUSTOMER |
| `/api/events`           | POST   | ✅   | Semua    |
| `/api/events/join`      | POST   | ✅   | Semua    |
| `/api/profile`          | GET    | ✅   | Semua    |
| `/api/users`            | GET    | ✅   | ADMIN    |

Untuk endpoint yang butuh auth, tambahkan header:

```
Authorization: Bearer <token_dari_login>
```

---

## Troubleshooting

### `No seed command configured`

Pastikan `prisma.config.ts` sudah ada baris `seed: "bun ./prisma/seed.ts"` di dalam `migrations`.

### `PrismaClientInitializationError`

Semua file yang menggunakan `new PrismaClient()` wajib pakai adapter pg:

```typescript
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

### `spawn bun ENOENT`

Bun belum terinstall atau belum terdeteksi. Jalankan:

```bash
curl -fsSL https://bun.sh/install | bash
exec /bin/zsh   # atau exec /bin/bash
bun --version
```

### Error node_modules / dependency

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5432 sudah dipakai (Docker)

```bash
docker restart booking-db
```

### Database tidak bisa dikoneksi (macOS)

```bash
brew services restart postgresql@16
```

### `JWT_SECRET` error

Pastikan file `.env` ada dan berisi `JWT_SECRET`. Jika tidak ada, login akan selalu gagal.

---

## Rules Kolaborasi

**JANGAN commit file berikut:**

```
.env
node_modules/
.next/
```

**Alur kerja harian:**

```bash
# Sebelum mulai coding — selalu pull dulu
git pull origin main

# Buat branch baru untuk fitur
git checkout -b feat/nama-fitur

# Setelah selesai
git add .
git commit -m "feat: deskripsi perubahan"
git push origin feat/nama-fitur
```

---

## Kontak

Jika ada masalah saat setup, hubungi repo owner.
