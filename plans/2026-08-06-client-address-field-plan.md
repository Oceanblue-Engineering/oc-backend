# Plan: Client Lead — Address Field ထည့်သွင်းခြင်း

**Date:** 2026-08-06
**Status:** Draft (awaiting approval)
**App(s):** Cross-app — backend (`OB-backend`) + dashboard (`OB-frontend`)

---

## Objective

Client Lead ၏ **New Inquiry** form တွင် **`address`** field အသစ် ထည့်ပေးရန်။ Backend model + create API + frontend form + translation များတွင် address အပြည့်အစုံ ပံ့ပိုးမည်။

---

## Files to Create / Modify

### Backend
- `src/models/client.model.js` — `address` String field ထည့်ရန် (trim, default "")
- `src/controllers/client.controller.js` — `createClient` at create payload + destructure တွင် `address` ထည့်ရန်
- `src/services/client.service.js` — `allowedFields` စာရင်းတွင် `address` ထည့်ရန် (update မှာလည်း editable) 

### Frontend (`OB-frontend/`)
- `services/Client/createClient.ts` — `CreateClientRequest` တွင် `address?: string` ထည့်ရန်
- `services/Client/updateClient.ts` — `UpdateClientRequest` တွင် `address?: string` ထည့်ရန် (optional, consistent)
- `components/Client/ClientModal.tsx` — New Inquiry form (Details tab) တွင် address input ထည့်ရန်
- `translations/en.ts` + `my.ts` — `clients.address` string

---

## Implementation Steps

1. **Model** — `src/models/client.model.js` တွင် `phone`/`email` အနီး `address: { type: String, trim: true, default: "" }` ထည့်ရန်။
2. **Controller** — `createClient` ၏ destructure + `Client.create` payload တွင် `address` ထည့်ရန်။
3. **Service** — `updateClientStatus` ၏ `allowedFields` array တွင် `"address"` ထည့်ရန်။
4. **Frontend Service** — `createClient.ts` / `updateClient.ts` interface များတွင် `address?: string` ထည့်ရန်။
5. **Modal** — Details tab ရှိ identity grid တွင် `address` input ထည့်ရန် (placeholder = `t("clients.address")`)။
6. **Translations** — en.ts + my.ts တွင် `clients.address` key ထည့်ရန်။

---

## Data / API Changes

- Client model တွင်း `address` field အသစ် (optional)။ API payload များ create/update တွင် support ပြုလုပ်မည်။

---

## Edge Cases & Considerations

- `address` optional — empty/absent လျှင် ပုံမှန် အလုပ်လုပ်သည် (required မဟုတ်)။
- POST `clients` + PATCH `clients/:id` နှစ်ခုလုံးတွင် support ရှိရန်။

---

## Test Plan

- Backend `node --check`।
- Frontend `npm run build` — အောင်မြင်ရန်။
- Manual: New Inquiry modal တွင် address field ပေါ်ပြီး save လျှင် client document တွင် address သိမ်းသည်။