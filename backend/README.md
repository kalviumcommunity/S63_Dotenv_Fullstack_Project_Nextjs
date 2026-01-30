# Backend API Server (Next.js)

This is a Next.js API-only backend server running on port 5000.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Run migrations (if needed):
```bash
npx prisma migrate deploy
```

4. Start development server:
```bash
npm run dev
```

The server will start on http://localhost:5000

## API Routes

- `GET /api/health` - Health check
- `GET /api/test-db` - Test database connection
- `POST /api/auth/signup` - User signup
- `POST /api/auth/login` - User login

## Environment Variables

Create a `.env` file with:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
PORT=5000
JWT_SECRET=your-secret-key
```
