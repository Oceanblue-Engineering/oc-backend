# Plan: Client — Conversation Logs + Audit Trail (Activity History)

**Date:** 2026-08-06
**Status:** Implemented
**App(s):** Cross-app — backend (`OB-backend`) + dashboard (`OB-frontend`)

---

## Objective

Client entity အတွက် unified **Conversation Logs** (embedded) + **Audit Trail** (separate collection) system ကို တည်ဆောက်သည်။ Client တစ်ခုခုတွင် ပြုလုပ်သော actions (create, update, status change, log add) များကို timeline အဖြစ် မှတ်တမ်းတင်ပြီး frontend detail/modal တွင် tabbed view (Details / Conversation Logs / Audit Trail) ဖြင့် ပြသမည်။

---

## Files to Create / Modify

### Backend (`OB-backend/`)
**Create:**
- `src/models/auditLog.model.js` — AuditLog schema (entityId, action, details, user, timestamp)

**Modify:**
- `src/services/client.service.js` — `createAudit` helper + audit logging in update (UPDATE / STATUS_CHANGE)
- `src/controllers/client.controller.js` — CREATE audit log; add `addClientLog` (POST /:id/logs); update `getClientById` to include audit logs; log CREATE
- `src/routes/client.route.js` — add `POST /clients/:id/logs`
- `src/services/client.service.js` — `createAudit` helper

### Frontend (`OB-frontend/`)
**Modify:**
- `components/Client/ClientModal.tsx` — add tabbed view (Details / Conversation Logs / Audit Trail)
- `services/Client/` — add `addClientLog.ts`, `fetchClientAudit.ts` (or extend fetchClientById)
- `translations/en.ts` + `my.ts` — new `clientLogs` / `auditTrail` strings

---

## Implementation Steps

### 1. Backend — `auditLog.model.js`
```js
import mongoose from "mongoose";
const auditLogSchema = new mongoose.Schema(
  {
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    action: { type: String, required: true }, // CREATE | UPDATE | STATUS_CHANGE | LOG_ADDED
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    user: { type: String, default: "system" },
  },
  { timestamps: true, id: false }
);
auditLogSchema.index({ entityId: 1, createdAt: -1 });
const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
```

### 2. Backend — `createAudit` helper (in client.service.js)
```js
export const createAudit = async ({ entityId, action, details, user, session }) => {
  return AuditLog.create([{ entityId, action, details, user: user || "system" }], { session });
};
```

### 3. Backend — Controller updates
- **createClient:** after create → `createAudit({ entityId: client._id, action: "CREATE", details: { name } })`.
- **updateClient:** compare old vs new status → if changed, `createAudit({ action: "STATUS_CHANGE", details: { oldStatus, newStatus } })`, else `UPDATE` with changed fields. user = `req.user?.name`.
- **getClientById:** fetch AuditLog by `entityId`, sort `{ createdAt: -1 }`; return `{ client, auditLogs }`.
- **addClientLog (new):** push `{ text, date }` into `conversationLogs`, save, then `createAudit({ action: "LOG_ADDED", details: { text } })`.

### 4. Backend — Routes
- `router.post("/clients/:id/logs", protect, permissionGranted("owner","admin"), addClientLog)`
- GET `/clients/:id` now returns auditLogs too.

### 5. Frontend — services
- `addClientLog.ts` — POST `/clients/:id/logs` { text }
- `fetchClientById.ts` — include `auditLogs` in response type.

### 6. Frontend — ClientModal tabs
- Add `activeTab` state ("details" | "logs" | "audit").
- **Details:** existing editable fields.
- **Conversation Logs:** timeline (newest first) + input + "Add Log" button → `addClientLog`.
- **Audit Trail:** vertical timeline of actions; STATUS_CHANGE shows "Changed status from X to Y"; show user + date.

### 7. Translations
- `clientLogs` / `auditTrail` strings in en.ts + my.ts.

---

## Data / API Changes

| Change | Detail |
|--------|--------|
| New model | `AuditLog` (separate collection `auditlogs`) |
| New API | `POST /api/v1/clients/:id/log` |
| Modified API | `GET /api/v1/clients/:id` → returns `{ client, auditLogs }` |
| Actions | `CREATE`, `UPDATE`, `STATUS_CHANGE`, `LOG_ADDED` |

---

## Edge Cases & Considerations

- Audit log create ကို same transaction ထဲ ထည့်ရန် (သို့) create ပြီးနောက် သီးခြား — simple use case အတွက် create ပြီးနောက် log (non-blocking) ထား; update အတွက် service session ထဲတွင် log ထည့်နိုင်သည်။
- `STATUS_CHANGE` ကို Signed ဖြစ်ချိန်တွင်လည်း log လုပ်မည် (POS credit auto-create) — details ထဲ ထည့်ပါမည်။
- Logs empty လျှင် "No activity yet" ပြမည်။
- i18n — messages အားလုံးတွင်။

---

## Test Plan

- Backend `node --check` + manual API test (create → audit CREATE; status change → STATUS_CHANGE; add log → LOG_ADDED; GET returns auditLogs).
- Frontend `npm run build`.
- Manual: modal tabs (Details/Conversation/Logs/Audit) — add log လုပ်လျှင် timeline ပေါ်သည်; status change လျှင် audit trail တွင်ပြသည်။