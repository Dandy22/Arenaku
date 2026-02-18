# Booking Venue Project — Setup Guide

Panduan ini untuk menjalankan project **booking-venue** di komputer baru (tim frontend/backend).

Ikuti langkah ini **berurutan**.

---

# 1. Install yang wajib

Install software berikut terlebih dahulu:

### Node.js (WAJIB)

Install:
https://nodejs.org

Gunakan versi:

```
Node >= 18
```

Cek:

```
node -v
npm -v
```

---

### Git

Install:
https://git-scm.com

Cek:

```
git --version
```

---

### VS Code

Install:
https://code.visualstudio.com

Extension yang disarankan:

- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

# 2. Clone project

```
git clone https://github.com/USERNAME/booking-venue.git
cd booking-venue
```

---

# 3. Install dependencies

WAJIB dilakukan setelah clone:

```
npm install
```

Ini akan menginstall:

- Next.js
- Prisma
- React
- semua dependency project

---

# 4. Setup environment (.env)

Buat file `.env` di root project:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_venue"
```

---

# 5. Database (PostgreSQL)

Ada 2 opsi:

## OPSI A (Direkomendasikan) — Docker

Install Docker:
https://www.docker.com

Jalankan:

```
docker run --name booking-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booking_venue \
  -p 5432:5432 \
  -d postgres
```

---

## OPSI B — PostgreSQL lokal

Install PostgreSQL lalu buat database:

```
booking_venue
```

---

# 6. Prisma setup

Generate Prisma client:

```
npx prisma generate
```

Jalankan migration:

```
npx prisma migrate dev
```

Seed database:

```
npx prisma db seed
```

---

# 7. Jalankan project

```
npm run dev
```

Buka browser:

```
http://localhost:3000
```

Test API:

```
http://localhost:3000/api/venues
```

Kalau keluar JSON → setup berhasil.

---

# Struktur Project

```
app/
api/
lib/
prisma/
```

File penting:

```
lib/prisma.ts
prisma/schema.prisma
```

---

# Troubleshooting

## Prisma error

Coba:

```
npx prisma generate
```

---

## Node modules error

```
rm -rf node_modules package-lock.json
npm install
```

---

## Port database dipakai

```
docker restart booking-db
```

---

# Rules Collaboration

JANGAN commit:

```
.env
node_modules
.next
```

Selalu pull sebelum coding:

```
git pull origin main
```

---

# Tech Stack

- Next.js (App Router)
- Prisma ORM
- PostgreSQL
- TypeScript
- Tailwind

---

# Kontak

Jika setup error:
hubungi repo owner.
