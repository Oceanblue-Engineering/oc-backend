# Inventory ထဲသို့ ရေကူးကန်သုံးပစ္စည်း ၂၀ မျိုး ထည့်သွင်းခြင်း အစီအစဉ် (Implementation Plan)

Ocean POS စနစ်၏ **Inventory (ကုန်ပစ္စည်း မာစတာ စာရင်း)** ထဲသို့ **ရေကူးကန်သုံးပစ္စည်း ၂၀ မျိုး (Swimming Pool Equipment & Accessories)** အား ကုန်ပစ္စည်း အမည်၊ Product Code၊ SKU၊ Barcode၊ ဝယ်ဈေး/ရောင်းဈေး၊ Unit နှင့် ဆိုင်ခန်းစတော့ (Storefront Stock) များပါဝင်အောင် သည့်သွင်းပေးမည် ဖြစ်ပါသည်။

## User Review Required

> [!IMPORTANT]
> - ရေကူးကန်သုံး ပစ္စည်း ၂၀ မျိုးအား Inventory မာစတာ စာရင်းတွင်း ရောက်ရှိစေရုံသာမက POS ကောင်တာနှင့် ဆိုင်ခန်းစတော့များတွင် တိုက်ရိုက် အရောင်းပြနိုင်ရန် ဆိုင်ခန်းစတော့ (Storefront Stock) ပါ အလိုအလျောက် ဖြည့်တင်းပေးမည် ဖြစ်ပါသည်။

## Open Questions

မေးခွန်းများမရှိပါ။ အောက်ပါ ပစ္စည်း ၂၀ မျိုးကို သည့်သွင်းပါမည်။

---

## 📦 ထည့်သွင်းမည့် ရေကူးကန်သုံးပစ္စည်း ၂၀ မျိုး စာရင်း

| No. | ကုန်ပစ္စည်း အမည် (Product Name) | Product Code | Category | ဝယ်ဈေး (MMK) | ရောင်းဈေး (MMK) | စတော့ (Stock) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| ၁ | Professional UV Swimming Goggles (ရေကူးမျက်မှန်) | `POOL-GOGGLE-01` | Pool & Swim Equipment | ၁၅,၀၀၀ | ၂၅,၀၀၀ | ၄၀ pcs |
| ၂ | Anti-Fog Silicone Swim Cap (ရေကူး ဦးထုပ်) | `POOL-CAP-02` | Pool & Swim Equipment | ၆,၀၀၀ | ၁၀,၀၀၀ | ၅၀ pcs |
| ၃ | Electric Pool Filter Pump 1.5HP (ရေကူးကန် ဖစ်လ်တာ ပန့်) | `POOL-PUMP-03` | Pool & Swim Equipment | ၃၅၀,၀၀၀ | ၄၈၀,၀၀၀ | ၁၀ sets |
| ၄ | Giant Inflatable Flamingo Pool Float (ဖလင်မင်ဂို ဘောကွင်းကြီး) | `POOL-FLOAT-04` | Pool & Swim Equipment | ၃၂,၀၀၀ | ၅၀,၀၀၀ | ၂၅ pcs |
| ၅ | Adjustable Kids Arm Swim Rings (ကလေး လက်မောင်း ဘောကွင်း) | `POOL-ARM-05` | Pool & Swim Equipment | ၄,၀၀၀ | ၇,၅၀၀ | ၆၀ pairs |
| ၆ | Professional Training Swimming Fins (ရေကူး ခြေတောင်) | `POOL-FINS-06` | Pool & Swim Equipment | ၂၈,၀၀၀ | ၄၂,၀၀၀ | ၂၀ pairs |
| ၇ | Pool Chlorine Tablets 90% 1kg (ရေကူးကန် ကလော်ရီးဆေးပြား 1kg) | `POOL-CHLOR-07` | Pool & Swim Equipment | ၁၈,၀၀၀ | ၂၈,၀၀၀ | ၃၅ packs |
| ၈ | Heavy Duty Leaf Skimmer Mesh Net (ရေကူးကန် သန့်ရှင်းရေး ပိုက်ကွန်) | `POOL-NET-08` | Pool & Swim Equipment | ၁၂,၀၀၀ | ၂၀,၀၀၀ | ၃၀ pcs |
| ၉ | Flexible Pool Vacuum Hose 10m (ရေကူးကန် ဖုန်စုပ်ပိုက် ၁၀ မီတာ) | `POOL-HOSE-09` | Pool & Swim Equipment | ၄၅,၀၀၀ | ၆၈,၀၀၀ | ၁၅ pcs |
| ၁၀ | Weighted Pool Vacuum Head Brush (ရေကူးကန် ဘရပ်ရှ် ဖုန်စုပ်ခေါင်း) | `POOL-VAC-10` | Pool & Swim Equipment | ၂၂,၀၀၀ | ၃၅,၀၀၀ | ၂၀ pcs |
| ၁၁ | EVA Foam Swimming Kickboard (ရေကူး လေ့ကျင့်ရေး ပျဉ်ပြား) | `POOL-KICK-11` | Pool & Swim Equipment | ၈,၅၀၀ | ၁၄,၀၀၀ | ၄၅ pcs |
| ၁၂ | Pool Water Test Kit pH & Chlorine (ရေကူးကန် ရေဓာတ်စစ်ကိရိယာ) | `POOL-TEST-12` | Pool & Swim Equipment | ၁၄,၀၀၀ | ၂၂,၀၀၀ | ၂၅ sets |
| ၁၃ | Professional Adult Safety Life Jacket (အသက်ကယ် အင်္ကျီ) | `POOL-VEST-13` | Pool & Swim Equipment | ၂၅,၀၀၀ | ၃၈,၀၀၀ | ၃၀ pcs |
| ၁၄ | 3-Step Stainless Steel Pool Ladder (စတီးလ် ရေကူးကန် လှေကား ၃ ထစ်) | `POOL-LAD-14` | Pool & Swim Equipment | ၁၈၀,၀၀၀ | ၂၆၀,၀၀၀ | ၈ sets |
| ၁၅ | RGB Underwater LED Pool Light 35W (ရေအောက် LED မီးဆိုင်း 35W) | `POOL-LED-15` | Pool & Swim Equipment | ၅၅,၀၀၀ | ၈၅,၀၀၀ | ၁၈ sets |
| ၁၆ | Water Hammock Lounge Pool Chair (ရေပေါ် အနားယူ ဖျာ/ကုလားထိုင်) | `POOL-HAMM-16` | Pool & Swim Equipment | ၁၆,၀၀၀ | ၂၆,၀၀၀ | ၃၅ pcs |
| ၁၇ | Soft Silicone Earplugs & Nose Clip Set (နားပလပ် နှာခေါင်းညှပ် အစုံ) | `POOL-EAR-17` | Pool & Swim Equipment | ၃,၀၀၀ | ၅,၅၀၀ | ၇၀ sets |
| ၁၈ | Dry Top Diving Snorkel & Mask Set (ငုပ်လျှိုး ရေကူးမှန် နှာခေါင်းပိုက် အစုံ) | `POOL-SNORKEL-18` | Pool & Swim Equipment | ၃၅,၀၀၀ | ၅၅,၀၀၀ | ၂၂ sets |
| ၁၉ | Automatic Robotic Pool Cleaner (အလိုအလျောက် ရေကူးကန် သန့်ရှင်းရေး ရောဘော့) | `POOL-ROBOT-19` | Pool & Swim Equipment | ၈၅၀,၀၀၀ | ၁,၂၀၀,၀၀၀ | ၅ units |
| ၂၀ | Inflatable Family Swimming Pool 3.05m (မိသားစုသုံး ရေကူးကန် လေထိုး) | `POOL-INFLATABLE-20` | Pool & Swim Equipment | ၉၅,၀၀၀ | ၁၄၅,၀၀၀ | ၁၂ sets |

---

## Verification Plan

### Automated Execution
- `oc-backend/tests/seed-swimming-pool-products.js` script ရေးသား၍ MongoDB Atlas သို့ တိုက်ရိုက် ထည့်သွင်းမည်။

### Verification Checks
- DB တွင် ပစ္စည်း ၂၀ မျိုးစလုံး အရေအတွက်၊ ရောင်းဈေး/ဝယ်ဈေး၊ Barcode များ မှန်ကန်စွာ သိမ်းဆည်းနိုင်မှု ရှိမရှိ စစ်ဆေးမည်။
- Storefront Stock ထဲသို့ ရောက်ရှိမှု စစ်ဆေးမည်။
