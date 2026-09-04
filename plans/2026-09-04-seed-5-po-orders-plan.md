# Purchase Order (PO) ၅ ခု ဖန်တီးခြင်း အစီအစဉ် (Implementation Plan)

Ocean POS စနစ်၏ **Purchasing မော်ဂျူး (`Purchasing`)** ထဲသို့ **Purchase Order (PO) ၅ ခု** အား သက်ဆိုင်ရာ Supplier ၅ ဦး နှင့် ၎င်းတို့ထံမှ မှာယူနိုင်သော **Inventory Products** များဖြင့် စနစ်တကျ ရေးဆွဲ ဖန်တီးပေးမည် ဖြစ်ပါသည်။

## User Review Required

> [!IMPORTANT]
> - PO ၅ ခု ရေးဆွဲရာတွင် `createPurchase` API ၏ Supplier-Product Linkage Validation အား အပြည့်အဝ ကိုက်ညီစေပြီး လက်ငင်းပေးချေမှု (`paid`) နှင့် အကြွေးပေးချေမှု (`credit`) ဘောင်ချာများပါဝင်အောင် ဖန်တီးပေးမည် ဖြစ်သဖြင့် ပစ္စည်းဝယ်ယူမှုစာရင်း (`/purchasing`) မျက်နှာပြင်တွင် တိုက်ရိုက် ကြည့်ရှု အသုံးပြုနိုင်မည် ဖြစ်ပါသည်။

## Open Questions

မေးခွန်းများမရှိပါ။ အောက်ပါ PO ၅ ခု စာရင်းကို ဖန်တီးပါမည်။

---

## 📋 ဖန်တီးမည့် Purchase Order (PO) ၅ ခု စာရင်း

### ၁။ PO Order #1 (AquaTech Pool & Spa Myanmar Co., Ltd.)
- **Supplier:** `AquaTech Pool & Spa Myanmar Co., Ltd.`
- **ပစ္စည်းများ:**
  1. Professional UV Swimming Goggles (`POOL-GOGGLE-01`) x 20 pcs @ 15,000 = 300,000 MMK
  2. Anti-Fog Silicone Swim Cap (`POOL-CAP-02`) x 30 pcs @ 6,000 = 180,000 MMK
- **စုစုပေါင်း ပမာဏ:** ၄၈၀,၀၀၀ MMK | **ပေးချေမှု:** `paid` (လက်ငင်း အပြီးချေ)

### ၂။ PO Order #2 (BlueOcean Water Treatment & Chemicals Co., Ltd.)
- **Supplier:** `BlueOcean Water Treatment & Chemicals Co., Ltd.`
- **ပစ္စည်းများ:**
  1. Pool Chlorine Tablets 90% 1kg (`POOL-CHLOR-07`) x 15 packs @ 18,000 = 270,000 MMK
  2. Heavy Duty Leaf Skimmer Mesh Net (`POOL-NET-08`) x 10 pcs @ 12,000 = 120,000 MMK
- **စုစုပေါင်း ပမာဏ:** ၃၉၀,၀၀၀ MMK | **ပေးချေမှု:** `paid` (လက်ငင်း အပြီးချေ)

### ၃။ PO Order #3 (Golden Wave Swim Sports & Safety Supplies)
- **Supplier:** `Golden Wave Swim Sports & Safety Supplies`
- **ပစ္စည်းများ:**
  1. Adjustable Kids Arm Swim Rings (`POOL-ARM-05`) x 40 pairs @ 4,000 = 160,000 MMK
  2. Professional Training Swimming Fins (`POOL-FINS-06`) x 10 pairs @ 28,000 = 280,000 MMK
- **စုစုပေါင်း ပမာဏ:** ၄၄၀,၀၀၀ MMK | **ပေးချေမှု:** `credit` (ပေးပြီး: ၂၀၀,၀၀၀ MMK, ကျန်: ၂၄၀,၀၀၀ MMK)

### ၄။ PO Order #4 (Oceanic Marine & Lighting Solutions Ltd.)
- **Supplier:** `Oceanic Marine & Lighting Solutions Ltd.`
- **ပစ္စည်းများ:**
  1. Professional Adult Safety Life Jacket (`POOL-VEST-13`) x 15 pcs @ 25,000 = 375,000 MMK
  2. RGB Underwater LED Pool Light 35W (`POOL-LED-15`) x 5 sets @ 55,000 = 275,000 MMK
- **စုစုပေါင်း ပမာဏ:** ၆၅၀,၀၀၀ MMK | **ပေးချေမှု:** `credit` (ပေးပြီး: ၃၀၀,၀၀၀ MMK, ကျန်: ၃၅၀,၀၀၀ MMK)

### ၅။ PO Order #5 (SmartPool Automation & Resort Imports)
- **Supplier:** `SmartPool Automation & Resort Imports`
- **ပစ္စည်းများ:**
  1. Automatic Robotic Pool Cleaner (`POOL-ROBOT-19`) x 2 units @ 850,000 = 1,700,000 MMK
  2. Inflatable Family Swimming Pool 3.05m (`POOL-INFLATABLE-20`) x 4 sets @ 95,000 = 380,000 MMK
- **စုစုပေါင်း ပမာဏ:** ၂,၀၈၀,၀၀၀ MMK | **ပေးချေမှု:** `paid` (လက်ငင်း အပြီးချေ)

---

## Verification Plan

### Automated Execution
- `oc-backend/tests/seed-5-po-orders.js` script ရေးသား၍ MongoDB Atlas သို့ တိုက်ရိုက် ရေးဆွဲ ထည့်သွင်းမည်။

### Verification Checks
- `Purchasing` မော်ဒယ်တွင်း PO ၅ ခုစလုံး PO နံပါတ်များ (`PO-20260904-0001` စသည်ဖြင့်)၊ ပစ္စည်း အရေအတွက်၊ စုစုပေါင်း သီးခြား ပမာဏနှင့် Status များ မှန်ကန်စွာ သိမ်းဆည်းနိုင်မှု ရှိမရှိ စစ်ဆေးမည်။
- UI (`/purchasing`) တွင် ကြည့်ရှုနိုင်မှု စစ်ဆေးမည်။
