# လက်ငင်း အော်ဒါ ၅ ခု နှင့် အကြွေး အော်ဒါ ၅ ခု ဖန်တီးခြင်း နှင့် Sales Report တိုက်စစ်ခြင်း အစီအစဉ် (Implementation Plan)

Ocean POS စနစ်၏ **Storefront အရောင်းစနစ် (`Order`)** တွင် **လက်ငင်း အရောင်း အော်ဒါ ၅ ခု (Cash Orders)** နှင့် **Customer အကြွေး အရောင်း အော်ဒါ ၅ ခု (Credit Orders)** စုစုပေါင်း အော်ဒါ ၁၀ ခုအား ဖန်တီး၍ အရောင်း အစီရင်ခံစာ **Sales Report (`/reports`)** တွင် စာရင်း ကိန်းဂဏန်းများ မှန်ကန်စွာ ပေါင်းစပ် တွက်ချက်မှု ရှိမရှိ ၁၀၀% တိုက်စစ် ပေးမည် ဖြစ်ပါသည်။

## User Review Required

> [!IMPORTANT]
> - လက်ငင်း အော်ဒါ ၅ ခု နှင့် Customer အမည်ပါဝင်သော အကြွေး အော်ဒါ ၅ ခုအား ရေကူးကန်သုံး ပစ္စည်းများဖြင့် ဖန်တီးကာ အရောင်း စုစုပေါင်း ပမာဏ (Total Sales Final Amount)၊ ရရှိသော ငွေပမာဏ (Total Paid Amount)၊ Customer အကြွေးကျန် ပမာဏ (Total Credit Debt Outstanding) နှင့် Orders အရေအတွက် တိကျမှုကို စမ်းသပ် တိုက်စစ်ပေးမည် ဖြစ်ပါသည်။

## Open Questions

မေးခွန်းများမရှိပါ။ အောက်ပါ အော်ဒါ ၁၀ ခု နှင့် Sales Report Audit အား ဆောင်ရွက်ပါမည်။

---

## 🛒 ၁။ ဖန်တီးမည့် လက်ငင်း အရောင်း အော်ဒါ ၅ ခု (Cash Orders)

1. **Cash Order #1**: 2 x `POOL-GOGGLE-01` | Final: ၅၀,၀၀၀ MMK | Paid: ၅၀,၀၀၀ MMK
2. **Cash Order #2**: 1 x `POOL-FLOAT-04` + 2 x `POOL-CAP-02` | Final: ၆၅,၀၀၀ MMK | Paid: ၆၅,၀၀၀ MMK
3. **Cash Order #3**: 3 x `POOL-ARM-05` + 1 x `POOL-KICK-11` | Final: ၃၅,၀၀၀ MMK | Paid: ၃၅,၀၀၀ MMK
4. **Cash Order #4**: 1 x `POOL-FINS-06` + 2 x `POOL-EAR-17` | Final: ၅၀,၀၀၀ MMK | Paid: ၅၀,၀၀၀ MMK
5. **Cash Order #5**: 2 x `POOL-VEST-13` + 1 x `POOL-NET-08` | Final: ၉၀,၀၀၀ MMK | Paid: ၉၀,၀၀၀ MMK
- **လက်ငင်း အရောင်း စုစုပေါင်း (Cash Sales Total):** **၂၉၀,၀၀၀ MMK** (အပြီးချေ: ၂၉၀,၀၀၀ MMK)

---

## 💳 ၂။ ဖန်တီးမည့် Customer အကြွေး အရောင်း အော်ဒါ ၅ ခု (Credit Orders)

1. **Credit Order #1 (ဦးအေးလွင်)**: 1 x `POOL-VEST-13` + 2 x `POOL-CAP-02` | Final: ၅၅,၀၀၀ MMK | Paid: ၁၅,၀၀၀ MMK | Debt: ၄၀,၀၀၀ MMK
2. **Credit Order #2 (ဒေါ်နန်းရွှေရည်)**: 1 x `POOL-FLOAT-04` + 1 x `POOL-HAMM-16` | Final: ၇၀,၀၀၀ MMK | Paid: ၂၀,၀၀၀ MMK | Debt: ၅၀,၀၀၀ MMK
3. **Credit Order #3 (ဦးဝင်းကိုကို)**: 2 x `POOL-FINS-06` | Final: ၈၀,၀၀၀ MMK | Paid: ၃၀,၀၀၀ MMK | Debt: ၅၀,၀၀၀ MMK
4. **Credit Order #4 (ဒေါ်သင်းသင်းဆွေ)**: 4 x `POOL-ARM-05` + 2 x `POOL-KICK-11` | Final: ၅၅,၀၀၀ MMK | Paid: ၁၅,၀၀၀ MMK | Debt: ၄၀,၀၀၀ MMK
5. **Credit Order #5 (ဦးကျော်သူဟန်)**: 2 x `POOL-GOGGLE-01` + 2 x `POOL-NET-08` | Final: ၈၀,၀၀၀ MMK | Paid: ၂၀,၀၀၀ MMK | Debt: ၆၀,၀၀၀ MMK
- **အကြွေး အရောင်း စုစုပေါင်း (Credit Sales Total):** **၃၄၀,၀၀၀ MMK** (ပေးပြီး: ၁၀၀,၀၀၀ MMK | ကြွေးကျန်: ၂၄၀,၀၀၀ MMK)

---

## 📈 ၃။ Sales Report တွင် မျှော်မှန်းထားသော တိုက်စစ်ရလဒ်များ (Expected Sales Report Metrics)

- **စုစုပေါင်း အော်ဒါ အရေအတွက် (Total Orders Count):** ၁၀ ခု (Paid: ၅ ခု, Credit: ၅ ခု)
- **စုစုပေါင်း အရောင်း တန်ဖိုး (Total Sales Final Amount):** **၆၃၀,၀၀၀ MMK** *(၂၉၀,၀၀၀ + ၃၄၀,၀၀၀)*
- **စုစုပေါင်း ရရှိသော ငွေပမာဏ (Total Paid Amount):** **၃၉၀,၀၀၀ MMK** *(၂၉၀,၀၀၀ + ၁၀၀,၀၀၀)*
- **စုစုပေါင်း Customer အကြွေးကျန် (Total Credit Outstanding):** **၂၄၀,၀၀၀ MMK**

---

## Verification Plan

### Automated Test Execution
- `oc-backend/tests/test-10-orders-and-sales-report-audit.js` script ရေးသား၍ အော်ဒါ ၁၀ ခု ဖွင့်လှစ်ပြီး Sales Report API ရလဒ်များနှင့် တွက်ချက်မှု တိကျမှုကို တိုက်ရိုက် စမ်းသပ် စစ်ဆေးမည်။

### Report Generation
- **Sales Report Cross-Check & Verification Report Artifact** အား မြန်မာဘာသာဖြင့် ထုတ်ပြန်ပေးမည်။
