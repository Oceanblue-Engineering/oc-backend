# OB-backend (OceanBlue CMS Backend) — Project Instructions

> **🗣️ ဘာသာစကား သတ်မှတ်ချက် (Language Requirement):**
> ဤ app တွင် Claude Code ၏ အကြောင်းပြန်ချက်များ၊ အခြေအနေ အသစ်ပြန်တင်မှုများနှင့် အကောင်အထည်ဖော်မှု အစီအစဉ်များကို **မြန်မာဘာသာဖြင့်** ရေးသားရမည်။ ကုဒ်နှင့် technical identifier များကိုမူ English အတိုင်း ထားရမည်။

**App role:** `backend` — the single REST API / data / auth owner for the OceanBlue monorepo.
**Physical directory:** `OB-backend/`

---

## Tech Stack

| Area | Technology |
|------|-----------|
| **Runtime** | Node.js (latest LTS) |
| **Module System** | ES Modules (`"type": "module"` — uses `import`/`export`, **not** CommonJS) |
| **Framework** | Express 5 (`^5.1.0`) |
| **Database** | MongoDB with Mongoose 9 ODM (`^9.0.0`) |
| **Auth** | JWT-based with `jsonwebtoken` + `bcryptjs` (cost factor 12) |
| **File Storage** | Cloudflare R2 (shop logos) + DigitalOcean Spaces (images) via `@aws-sdk/client-s3` |
| **Real-time** | Socket.IO (room-based notifications: kitchen, waiter, cashier, manager, all) |
| **Scheduling** | node-cron (daily report generation) |
| **Deployment** | Vercel (serverless via `api/index.js` with cached MongoDB connection) |

## Project Structure

```
OB-backend/
├── api/
│   └── index.js                    # Vercel serverless entry point
├── src/
│   ├── configs/                    # Config files (PLURAL: configs/)
│   │   ├── db.config.js            # Mongoose connection + index migration
│   │   ├── cors.config.js          # CORS configuration
│   │   ├── doSpaces.config.js      # DigitalOcean Spaces S3 client
│   │   ├── cloudflareR2.config.js  # Cloudflare R2 client + upload helpers
│   │   └── timezoneConvertor.config.js  # UTC → Asia/Yangon on GET
│   ├── controllers/                # Route handlers (25 controllers)
│   ├── middlewares/                # Express middlewares (3 files)
│   ├── models/                     # Mongoose schemas (20 models)
│   ├── routes/                     # Express route definitions (22 routes)
│   ├── services/                   # Business logic (5 services)
│   ├── utils/                      # Helpers
│   ├── app.js                      # Express app setup
│   └── server.js                   # App entry point
├── rules/                          # App-specific coding rules & patterns
├── plans/                          # Implementation plan files (YYYY-MM-DD-*.md)
├── vercel.json                     # Vercel deployment config
└── package.json
```

## NPM Scripts

| Command | Environment | Watcher |
|---------|------------|---------|
| `npm run dev` | `development` | nodemon |
| `npm run prod` | `production` | nodemon |
| `npm start` | — | none (plain `node`) |

## Environment Variables

| Variable | Required | Default | Used In |
|----------|----------|---------|---------|
| `MONGODB_URI` | Yes | — | DB connection |
| `JWT_SECRET` | Yes | — | Token signing/verification |
| `JWT_EXPIRES_IN` | Yes | — | JWT expiry duration |
| `PASSWORD_CHANGE_TOKEN_EXPIRES_IN` | No | `"10m"` | Password reset token expiry |
| `PORT` | No | `5000` | Server listen port |
| `NODE_ENV` | No | — | `development`/`production` |
| `OPENROUTER_API_KEY` | Yes | — | AI chat (OpenRouter) |
| `OPENROUTER_MODEL` | No | `"google/gemini-2.5-flash"` | AI model |
| `R2_ENDPOINT` | Yes | — | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | Yes | — | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | — | R2 secret key |
| `R2_BUCKET_NAME` | Yes | — | R2 bucket |
| `R2_PUBLIC_URL` | Yes | — | R2 public base URL |
| `DO_SPACES_ENDPOINT` | Yes | — | DigitalOcean Spaces endpoint |
| `DO_SPACES_REGION` | Yes | — | DO region |
| `DO_SPACES_ACCESS_KEY` | Yes | — | DO access key |
| `DO_SPACES_SECRET_KEY` | Yes | — | DO secret key |
| `DO_SPACES_BUCKET` | Yes | — | DO bucket name |

## File Naming Convention

All files follow the pattern: **`entity.type.js`** (lowercase, dot-separated).

```
admin.controller.js            # Controller
admin.model.js                 # Model
admin.route.js                 # Route
rateLimiter.middleware.js      # Middleware
jwtToken.service.js            # Service
customError.js                 # Utility (no type suffix if standalone)
db.config.js                   # Configuration
```

## Key Conventions

### Module System
- **Always use ES Module syntax:** `import`/`export`, **never** `require()`/`module.exports`.
- Named exports for controller functions, services, utilities.
- Default exports for Mongoose models and Express routers.

### Controller Pattern
Every controller function must be wrapped with `asyncErrorHandler`:

```js
export const createEntity = asyncErrorHandler(async (req, res, next) => {
  const { field1, field2 } = req.body;

  // Validate — early return on failure
  if (!field1) return next(new CustomError(400, "field1 is required"));

  const doc = await EntityModel.create({ field1, field2 });

  res.status(201).json({
    success: true,
    message: "Entity created successfully",
    data: { entity: doc }
  });
});
```

### Response Envelope
**Success:** `{ "success": true, "message": "string", "data": { ... } }`
**List (pagination):** `{ ..., "data": { "entities": [...] }, "pagination": { currentPage, totalPages, totalItems, itemsPerPage } }`
**Error:** `{ "success": false, "message": "string" }` (dev also includes `stackTrace`, `error`).

### Error Handling
- **`CustomError`** (`src/utils/customError.js`): `statusCode`, `success` (auto from status), `isOperational: true`.
- **`asyncErrorHandler`** (`src/utils/asyncErrorHandler.js`): forwards rejected promises to `next(err)`.
- **Global error handler** (`src/controllers/error.controller.js`): dev returns full error + stack; production transforms `CastError`/duplicate-key/`ValidationError`/JWT errors.
- Forward errors with `return next(new CustomError(statusCode, "message"))`.

### Authentication & Authorization
- **`protect`** middleware (from `administrationPolicy.controller.js`): Bearer token → `jwt.verify` (promisified) → load admin, check role + soft-delete → set `req.user = { id, role, locationId }`.
- **`permissionGranted(...roles)`**: 401 if no role, 403 if not authorized.
- Route chain: `protect` always precedes `permissionGranted`.

### Route Structure
All routes mounted under `/api/v1`. Paths use kebab-case, plural nouns.

```js
router.post("/entity", protect, permissionGranted("owner", "admin"), createEntity);
router.get("/entity", protect, permissionGranted("owner", "admin", "cashier"), getEntities);
```

### Mongoose Schema Default
- Always `timestamps: true`, `id: false`, `toJSON`/`toObject: { virtuals: true }`.
- Soft-delete fields: `isDeleted: Boolean` (default `false`), `deletedAt: Date` (default `null`).
- Explicit compound/text indexes; pre-save hooks; instance/static methods.

### MongoDB Transactions
**Pattern A — `session.withTransaction()` (auto-retry)** or **Pattern B — manual `startTransaction`/`commitTransaction`/`abortTransaction`**. Always `finally { session.endSession(); }`.

### Soft Delete
- **Preferred:** `isDeleted` + `deletedAt`. **Legacy (Admin, Expense):** `softDeleted` + `deletedAt`.
- Always filter queries: `{ isDeleted: false }` / `{ softDeleted: false }`. Restore sets both fields back to inactive state.

## Critical Rules

1. **Never include `appName` in MongoDB connection strings** — the URI must be a clean `mongodb://` or `mongodb+srv://` string.
2. **Strictly check and follow all rules inside `rules/`** before beginning any task. These override this file.
3. **Before writing any code**, check `plans/` for an existing plan; if none exists, create one following the workflow below.
4. **Align all new code** with the layer templates in `rules/` (matching the existing codebase patterns).
5. **HTTP methods:** `POST` create, `GET` read, `PATCH` update (partial), `DELETE` soft-delete (hard delete only when explicitly named).

---

## Strict Workflow (MANDATORY)

1. **Language Requirement** — All responses, status updates, and implementation plans in this app MUST be written in **Myanmar (မြန်မာဘာသာ)**.
2. **Plan First Principle** — When asked to change/add/fix anything, **NEVER write or modify code directly**. First draft a detailed Implementation Plan in Myanmar.
3. **Auto-Save Plan Files** — Save every plan to `OB-backend/plans/YYYY-MM-DD-short-description-plan.md` (e.g. `2026-08-05-fix-order-total-plan.md`) before implementing.
4. **Wait for Explicit Approval** — Show the plan in Myanmar. **DO NOT touch code or run file-modifying/executing commands** until the user explicitly says **"OK"** / **"Go ahead"** / gives permission. Only then implement, following the saved plan.
