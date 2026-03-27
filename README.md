# TeacherMate

Ung dung tao de trac nghiem bang AI, hoc sinh lam bai online, he thong cham diem va AI nhan xet.

## Stack

- Next.js (App Router) + TypeScript
- API Routes
- Gemini API (`gemini-1.5-flash`)
- Neon Serverless Postgres (tuy chon)

## Chay local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mo: `http://localhost:3000`

## Bien moi truong

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
DATABASE_URL=
DATABASE_URL_UNPOOLED=
AI_NO_KEY_PROVIDER=pollinations
```

- Khong co `DATABASE_URL`/`DATABASE_URL_UNPOOLED`: app dung memory store de demo.
- Khong co `GEMINI_API_KEY`: app tu dong goi AI no-key (Pollinations).
- Neu AI no-key loi hoac JSON sai format: app moi fallback de mau.

## Luong su dung

1. Vao `/create`
2. Chon lop, mon, chuyen de, so cau, muc do, Bloom, yeu cau chi tiet
3. Bam **Tao de**
4. Chuyen den `/exam/{id}` cho hoc sinh lam bai
5. Nop bai -> xem ket qua tai `/exam/{id}/result?resultId=...`

## Deploy Vercel

1. Push repo len GitHub
2. Import project vao Vercel
3. Add env vars:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional)
   - `DATABASE_URL` (hoac `DATABASE_URL_UNPOOLED`)
4. Deploy
