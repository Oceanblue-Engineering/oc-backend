# Plan: Fix Project Analytics Route Prefix (404)

**Date:** 2026-08-16
**Status:** Draft
**App:** Backend (`OB-backend`)

---

## Objective

Analytics စာမျက်နှာဝင်သည့်အခါ endpoint ၃ ခုစလုံး **404 Not Found** ဖြစ်နေသည့်ပြဿနာကို ဖြေရှင်းရန်။

## Root Cause (ပြဿနာအရင်းအမြစ်)

`src/routes/projectAnalytics.route.js` တွင် route path များကို `/projects` prefix မပါဘဲ သတ်မှတ်ထားသည်—

```js
router.get("/:id/expenses", ...)
router.get("/:id/payroll-summary", ...)
router.get("/:id/financial-summary", ...)
```

ဤ router ကို `app.js` (line 96) တွင် `app.use("/api/v1", projectAnalyticsRouter)` ဖြင့် mount လုပ်ထားသည်။ ထို့ကြောင့် တကယ်မှတ်ပုံတင်သွားသည့် endpoint မှာ—

| | Path |
|---|---|
| Backend မှတ်ထားသည် (မှား) | `/api/v1/:id/financial-summary` |
| Frontend ခေါ်နေသည် (မှန်) | `/api/v1/projects/:id/financial-summary` |

`/projects` segment ကွာနေသဖြင့် route မကိုက်ဘဲ 404 handler သို့ ရောက်သွားသည်။

> မှတ်ချက်: ရှိပြီးသား `project.route.js` သည် `/projects`, `/projects/:id` ကဲ့သို့ **path အပြည့်** ကို route file ထဲတွင်ရေးပြီး `/api/v1` တွင် mount လုပ်သည့် pattern ဖြစ်သည်။ Analytics route ကလည်း ဤ pattern ကို လိုက်နာသင့်သည်။

## Files to Modify

1. **`src/routes/projectAnalytics.route.js`** — route path ၃ ခုတွင် `/projects` prefix ထည့်ရန်။

## Implementation Steps

Route path ၃ ခုကို အောက်ပါအတိုင်း ပြင်ရန်—

```js
router.get("/projects/:id/expenses", protect, permissionGranted("owner","admin","cashier"), getProjectExpenses);
router.get("/projects/:id/payroll-summary", protect, permissionGranted("owner","admin","cashier"), getProjectPayrollSummary);
router.get("/projects/:id/financial-summary", protect, permissionGranted("owner","admin","cashier"), getProjectFinancialSummary);
```

`app.js` ကို ပြင်စရာမလိုပါ (`/api/v1` mount အတိုင်းထားမည်)။

## Conflict Check

- `project.route.js` ၏ `GET /projects/:id` သည် segment တစ်ခုတည်းသာ လက်ခံသည်။ `/projects/:id/financial-summary` သည် segment နှစ်ခုပါသဖြင့် **conflict မဖြစ်ပါ**။
- `app.js` တွင် `projectRouter` (line 95) ကို `projectAnalyticsRouter` (line 96) ရှေ့တွင် mount ထားသော်လည်း path များ ကွဲပြားသဖြင့် အစီအစဉ်အရ ပြဿနာမရှိပါ။

## Edge Cases

- Invalid ObjectId → controller ထဲ၌ ရှိပြီးသား validation က ကိုင်တွယ်မည် (400)။
- Token မပါ / role မကိုက် → `protect` + `permissionGranted` က 401/403 ပြန်မည်။

## Test Plan

1. Backend server (`npm run dev`) ကို restart လုပ်ရန် (nodemon auto-reload မဖြစ်ခဲ့ပါက)။
2. Browser တွင် `/projects/<id>/analytics` ဝင်ပြီး Network tab တွင် endpoint ၃ ခုစလုံး **200 OK** ပြန်ကြောင်း စစ်ရန်။
3. Financial summary, expense chart, payroll table တို့ data ပြကြောင်း အတည်ပြုရန်။
