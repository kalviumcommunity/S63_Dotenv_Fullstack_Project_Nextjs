This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Centralized Error Handling

API errors are handled by a single **centralized error handler** (`handleError` in `src/lib/errorHandler.ts`). Route handlers use it in `catch` blocks so that:

- All API errors go through one place.
- Responses stay consistent (`success: false`, JSON only).
- **Development** vs **production** behavior differs only by how much we expose to the client.

### Concept

- **Centralized handler**: One utility (`handleError(error, context)`) is used across API routes. It logs the full error internally and returns a JSON response. Zod validation and auth/RBAC continue to use `responseHandler.sendError` for their own status codes and messages; unexpected errors are passed to `handleError`.
- **Structured logging**: A small logger (`src/lib/logger.ts`) writes JSON to the console: `level`, `message`, `meta`, `timestamp`. Internal logs always contain full error details (including stack) for observability, regardless of environment.

### Dev vs production behavior

| | Development | Production |
|---|-------------|------------|
| **Client response** | Actual error message + stack | Generic message only |
| **Stack trace** | Included in response | Never sent to client |
| **Internal log** | Full error + stack | Full error + stack |

- **Development**: Easier debugging. Response includes `message` and `stack`. Example: `"Database connection failed!"` plus stack.
- **Production**: Safe for users. Response is only a generic message (e.g. "Something went wrong. Please try again later."). No stack or internal details are exposed.
- **Why hide stack in production**: Stack traces reveal file paths, structure, and sometimes secrets. Exposing them would hurt security and user trust. Internal logs still keep full details for your team (e.g. CloudWatch, log aggregators).

### Observability and user trust

- **Observability**: Structured logs (JSON with level, message, meta, timestamp) make it easy to search and alert. Full errors are always logged server-side, so you can debug production issues without exposing them to clients.
- **User trust**: Production clients only see a short, safe message. They get a consistent, professional experience and no sensitive technical details.

### Testing in Development vs Production

**Development mode** (`npm run dev`, default `NODE_ENV=development`):

```bash
# Trigger an error (e.g. throw in GET /api/users or call a route that throws)
curl -X GET http://localhost:3000/api/users
```

Example response when an error is thrown (e.g. "Database connection failed!"):

```json
{
  "success": false,
  "message": "Database connection failed!",
  "stack": "Error: Database connection failed! at ..."
}
```

**Production mode** (`NODE_ENV=production`):

Same request; response is redacted:

```json
{
  "success": false,
  "message": "Something went wrong. Please try again later."
}
```

**Internal log** (console or your log sink, e.g. CloudWatch) – same in both environments; full details for debugging:

```json
{
  "level": "error",
  "message": "Error in GET /api/users",
  "meta": {
    "message": "Database connection failed!",
    "stack": "Error: Database connection failed!\n    at ..."
  },
  "timestamp": "2025-10-29T16:45:00Z"
}
```

To see the development error response locally, trigger an error in a route (e.g. temporarily `throw new Error("Database connection failed!")` in `GET /api/users`). Normal requests (e.g. with valid JWT) still return success; only thrown errors go through the centralized handler.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
