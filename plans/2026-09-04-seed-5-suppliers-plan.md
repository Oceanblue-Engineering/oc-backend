# Supplier ၅ ဦး ဖန်တီး၍ Inventory Product စာရင်းနှင့် ချိတ်ဆက်ခြင်း အစီအစဉ် (Implementation Plan)

Ocean POS စနစ်၏ **Supplier Database (`SupplierProfile`)** ထဲသို့ **Supplier ၅ ဦး (Supplier Profiles)** အား ဖန်တီးပြီး တစ်ဦးစီမှ ဝယ်ယူနိုင်သော **Inventory Products** များနှင့် `inventory.suppliers` တွင် အပြန်အလှန် ချိတ်ဆက်ပေးမည် ဖြစ်ပါသည်။

## User Review Required

> [!IMPORTANT]
> - Supplier တစ်ဦးစီအား ၎င်းတို့ထံမှ မှာယူနိုင်သော သီးသန့် Inventory ကုန်ပစ္စည်း ၄ မျိုးစီဖြင့် ချိတ်ဆက်ပေးမည်ဖြစ်ရာ PO ရေးဆွဲခြင်း (`/purchasing`) မျက်နှာပြင်တွင် Supplier ရွေးချယ်လိုက်ပါက အဆိုပါ Supplier မှ ဝယ်ယူနိုင်သော ကုန်ပစ္စည်းများသာ စနစ်တကျ ကျရောက်မည် ဖြစ်ပါသည်။

## Open Questions

မေးခွန်းများမရှိပါ။ အောက်ပါ Supplier ၅ ဦး နှင့် Product ချိတ်ဆက်မှုများကို ဆောင်ရွက်ပါမည်။

---

## 🏭 ထည့်သွင်းမည့် Supplier ၅ ဦး နှင့် ချိတ်ဆက်မည့် Product စာရင်း

### ၁။ AquaTech Pool & Spa Myanmar Co., Ltd.
- **ဖုန်း:** `09950112233` | **မြို့နယ်:** လှိုင်သာယာ | **လိပ်စာ:** အမှတ် (၄၅)၊ စက်မှုဇုန် (၁)၊ လှိုင်သာယာမြို့နယ်၊ ရန်ကုန်။
- **ချိတ်ဆက်မည့် Products:**
  1. Professional UV Swimming Goggles (`POOL-GOGGLE-01`)
  2. Anti-Fog Silicone Swim Cap (`POOL-CAP-02`)
  3. Electric Pool Filter Pump 1.5HP (`POOL-PUMP-03`)
  4. Giant Inflatable Flamingo Pool Float (`POOL-FLOAT-04`)

### ၂။ BlueOcean Water Treatment & Chemicals Co., Ltd.
- **ဖုန်း:** `09421112233` | **မြို့နယ်:** ကြည့်မြင်တိုင် | **လိပ်စာ:** အမှတ် (၁၁၂)၊ ကမ်းနားလမ်း၊ ကြည့်မြင်တိုင်မြို့နယ်၊ ရန်ကုန်။
- **ချိတ်ဆက်မည့် Products:**
  1. Pool Chlorine Tablets 90% 1kg (`POOL-CHLOR-07`)
  2. Heavy Duty Leaf Skimmer Mesh Net (`POOL-NET-08`)
  3. Flexible Pool Vacuum Hose 10m (`POOL-HOSE-09`)
  4. Weighted Pool Vacuum Head Brush (`POOL-VAC-10`)

### ၃။ Golden Wave Swim Sports & Safety Supplies
- **ဖုန်း:** `09798223344` | **မြို့နယ်:** သင်္ဃန်းကျွန်း | **လိပ်စာ:** အမှတ် (၇၈)၊ သံသုမာလမ်း၊ သင်္ဃန်းကျွန်းမြို့နယ်၊ ရန်ကုန်။
- **ချိတ်ဆက်မည့် Products:**
  1. Adjustable Kids Arm Swim Rings (`POOL-ARM-05`)
  2. Professional Training Swimming Fins (`POOL-FINS-06`)
  3. EVA Foam Swimming Kickboard (`POOL-KICK-11`)
  4. Pool Water Test Kit pH & Chlorine (`POOL-TEST-12`)

### ၄။ Oceanic Marine & Lighting Solutions Ltd.
- **ဖုန်း:** `09250334455` | **မြို့နယ်:** ဒဂုံမြောက်ပိုင်း | **လိပ်စာ:** အမှတ် (၃၃)၊ ပြည်ထောင်စုလမ်း၊ ဒဂုံမြို့သစ်မြောက်ပိုင်း၊ ရန်ကုန်။
- **ချိတ်ဆက်မည့် Products:**
  1. Professional Adult Safety Life Jacket (`POOL-VEST-13`)
  2. 3-Step Stainless Steel Pool Ladder (`POOL-LAD-14`)
  3. RGB Underwater LED Pool Light 35W (`POOL-LED-15`)
  4. Dry Top Diving Snorkel & Mask Set (`POOL-SNORKEL-18`)

### ၅။ SmartPool Automation & Resort Imports
- **ဖုန်း:** `09971445566` | **မြို့နယ်:** ရန်ကင်း | **လိပ်စာ:** အမှတ် (၅၆)၊ ရန်ရှင်းလမ်း၊ ရန်ကင်းမြို့နယ်၊ ရန်ကုန်။
- **ချိတ်ဆက်မည့် Products:**
  1. Water Hammock Lounge Pool Chair (`POOL-HAMM-16`)
  2. Soft Silicone Earplugs & Nose Clip Set (`POOL-EAR-17`)
  3. Automatic Robotic Pool Cleaner (`POOL-ROBOT-19`)
  4. Inflatable Family Swimming Pool 3.05m (`POOL-INFLATABLE-20`)

---

## Verification Plan

### Automated Execution
- `oc-backend/tests/seed-5-suppliers-with-products.js` script ရေးသား၍ MongoDB Atlas သို့ တိုက်ရိုက် ထည့်သွင်းမည်။

### Verification Checks
- `SupplierProfile` မော်ဒယ်တွင်း Supplier ၅ ဦး စနစ်တကျ ရောက်ရှိမှု စစ်ဆေးမည်။
- `Inventory.suppliers` array တွင် သက်ဆိုင်ရာ `supplierId` များ အပြန်အလှန် ချိတ်ဆက်မိမှု ရှိမရှိ စစ်ဆေးမည်။
