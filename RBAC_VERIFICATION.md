# How to Verify RBAC (Authorization Middleware) Is Working

Use these steps to confirm that `/api/users` and `/api/admin` behave correctly with JWT and roles.

---

## Prerequisites

1. **Start the backend** (port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend** (port 3000):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Environment**: Both apps need `JWT_SECRET` set (e.g. in `backend/.env` and `frontend/.env.local`). Same value in both.

---

## 1. Get a JWT (login)

Login returns a token that includes `id`, `email`, and `role`. Use either backend or frontend login.

**Option A – Backend directly:**
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"saksham@gmail.com\",\"password\":\"123456\"}"
```

**Option B – Via frontend (proxies to backend):**
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"saksham@gmail.com\",\"password\":\"123456\"}"
```

Copy the `token` from the `data` field of the JSON response. You will use it as `YOUR_TOKEN` below.

---

## 2. Test `/api/users` (any authenticated user)

**With valid token → 200**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- Expect: JSON with users and **HTTP_STATUS:200**.

**Without token → 401**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/users
```
- Expect: JSON error like "Authentication token missing" and **HTTP_STATUS:401**.

**With invalid token → 403**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/users \
  -H "Authorization: Bearer invalid-token-here"
```
- Expect: JSON error like "Invalid or expired token" and **HTTP_STATUS:403**.

---

## 3. Test `/api/admin` (admin only)

**With admin token → 200**
- First ensure one user has `role = "admin"` in the database (see “Make a user admin” below).
- Login as that user and get the token.
- Then:
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/admin \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
- Expect: JSON success message and **HTTP_STATUS:200**.

**With normal user token → 403**
- Use the token from step 1 (user with role `"user"`).
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/admin \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```
- Expect: JSON error like "Forbidden: admin access required" and **HTTP_STATUS:403**.

**Without token → 401**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/api/admin
```
- Expect: **HTTP_STATUS:401**.

---

## 4. Make a user admin (for testing)

New users get `role = "user"` by default. To test `/api/admin`, set one user to admin:

**Using Prisma Studio:**
```bash
cd backend
npx prisma studio
```
- Open the `User` table, find the user, set `role` to `admin`, save.

**Using SQL:**
```bash
cd backend
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role = 'admin' WHERE email = 'saksham@gmail.com';"
```
(On Windows you can run the same SQL in your DB client or Prisma Studio.)

Then login again as that user; the new JWT will have `role: "admin"` and will work for `/api/admin`.

---

## Quick checklist

| Test | Expected |
|------|----------|
| `GET /api/users` with no header | 401 |
| `GET /api/users` with invalid token | 403 |
| `GET /api/users` with valid token (user or admin) | 200 |
| `GET /api/admin` with no header | 401 |
| `GET /api/admin` with valid **user** token | 403 |
| `GET /api/admin` with valid **admin** token | 200 |

If all of these match, RBAC and the authorization middleware are working as intended.
