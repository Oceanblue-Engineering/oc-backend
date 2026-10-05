# Overall Sales Report တွင် FOC (Free of Charge) အော်ဒါများ အရောင်းစုစုပေါင်း (Total Sales) ထဲ မပါဝင်စေရန် ပြုပြင်ခြင်း အစီအစဉ် (Implementation Plan)

## ၁။ ပြဿနာ တွေ့ရှိချက် (Root Cause Analysis)

POS စနစ်တွင် **FOC (Free of Charge - အခမဲ့/လက်ဆောင်)** ဖြင့် အော်ဒါဖွင့်လှစ်သောအခါ:
1. `OB-backend/src/controllers/order.controller.js` တွင် အဆိုပါ FOC အော်ဒါအား `paymentType: "paid"`, `paymentMethod: "foc"`, `paidAmount: 0` ဖြင့် သိမ်းဆည်းပြီး `finalAmount` အား ပစ္စည်းများ၏ မူရင်းကျသင့်ငွေ (e.g. 50,000 MMK) အဖြစ် တွက်ချက်ထည့်သွင်းထားပါသည်။
2. သို့သော် `OB-backend/src/controllers/saleReport.controller.js` ၏ `getSaleReportByStorefrontId` aggregation pipeline တွင်:
   ```javascript
   totalFinalAmount: { $sum: "$finalAmount" }
   totalSubTotal: { $sum: "$subTotal" }
   totalDiscount: { $sum: "$discount" }
   ```
   ဟု ရေးသားထားသဖြင့် `paymentMethod === "foc"` ဖြစ်သည့် အခမဲ့အော်ဒါများ၏ ကျသင့်ငွေ (`finalAmount`) သည်လည်း **Total Sales (စုစုပေါင်း ရောင်းရငွေ)** ထဲသို့ ပေါင်းထည့်ခံနေရပါသည်။
3. `paidOrderCount` ကို `paymentMethod !== "foc"` ဖြင့် သီးခြားခွဲထုတ်ထားပြီး `totalFocAmount` နှင့် `focOrderCount` များကို သီးခြားတွက်ချက်ထားသော်လည်း `totalFinalAmount` တွင် FOC ကို မဖယ်ထုတ်ခဲ့မိသည့်အတွက်:
   - Frontend `Overall` Tab တွင် ပြသသည့် **Total Sales (`finalAmount`)** တွင် ငွေမရရှိသော FOC တန်ဖိုးများ ပါဝင်နေပြီး ရောင်းရငွေ ဖောင်းပွနေခြင်း။
   - စာရင်းအမှန်ဖြစ်သည့် `Total Sales = Paid Amount + Outstanding Credit` ညီမျှခြင်း မကိုက်ညီတော့ဘဲ FOC တန်ဖိုးပမာဏ ကွာဟချက် ဖြစ်ပေါ်နေခြင်း။
   - `OB-backend/src/services/aiSaleReport.service.js` တွင်လည်း `totalFinalAmount` ၌ FOC ပါဝင်နေခြင်း။
   - `getPaymentMethodReportByStorefrontId` (Paid Orders Tab) တွင်လည်း `foc` သည် ငွေချေမှုပုံစံတစ်ခုအဖြစ် ပါဝင်လာနိုင်ခြင်း (FOC အတွက် သီးခြား FOC Tab ရှိပြီးဖြစ်ပါသည်)။

---

## ၂။ ဖြေရှင်းမည့် ရည်မှန်းချက် (Objective)

1. အရောင်းစာရင်းချုပ် (`Overall Report` နှင့် `AI Sales Report`) တွင် **Total Sales (စုစုပေါင်း ရောင်းရငွေ / Final Amount)** သည် အမှန်တကယ် အရောင်းဖြစ်သော **လက်ငင်းရောင်းရငွေ (Paid Orders)** နှင့် **အကြွေးအရောင်း (Credit Orders)** တို့၏ တန်ဖိုးသာ ဖြစ်စေရမည်။
2. FOC (Free of Charge) အော်ဒါများကို Total Sales (`totalFinalAmount`), SubTotal (`totalSubTotal`), Discount (`totalDiscount`), Tax (`totalTax`) တို့မှ ဖယ်ထုတ်ပေးမည်။
3. FOC စာရင်းများကို သီးခြား metrics များဖြစ်သည့် `focAmount`, `focOrderCount` နှင့် `FOC Products Tab` တွင်သာ သီးသန့် အတိအကျ ပြသမည်။
4. `Paid Orders` endpoint တွင်လည်း အမှန်တကယ် ငွေလက်ခံရရှိသော Payment Methods (Cash, Banking) များကိုသာ သီးသန့် ဖော်ပြပေးမည်။

---

## ၃။ ပြင်ဆင်မည့် ဖိုင်များ (Files to Modify)

1. **`OB-backend/src/controllers/saleReport.controller.js`**:
   - `getSaleReportByStorefrontId`:
     - `totalFinalAmount`: FOC မဟုတ်သော အော်ဒါများသာ ပေါင်းရန် `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$finalAmount", 0] }` သို့ ပြောင်းလဲခြင်း။
     - `totalSubTotal`: `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$subTotal", 0] }` သို့ ပြောင်းလဲခြင်း။
     - `totalDiscount`: `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$discount", 0] }` သို့ ပြောင်းလဲခြင်း။
     - `totalTax`: `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$tax", 0] }` သို့ ပြောင်းလဲခြင်း။
   - `getPaymentMethodReportByStorefrontId`:
     - Query filter တွင် `paymentMethod: { $ne: "foc" }` ထည့်သွင်း၍ Paid Orders Report ထဲ FOC မပါဝင်စေရန် စစ်ထုတ်ခြင်း။

2. **`OB-backend/src/services/aiSaleReport.service.js`**:
   - `getSaleReportSummary`:
     - `totalFinalAmount`: `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$finalAmount", 0] }` သို့ ပြောင်းလဲခြင်း။
     - `totalDiscount`: `{ $cond: [{ $ne: ["$paymentMethod", "foc"] }, "$discount", 0] }` သို့ ပြောင်းလဲခြင်း။

3. **`OB-frontend/components/Reports/OverallReportTab.tsx`** (Optional Polish):
   - FOC အော်ဒါအရေအတွက်နှင့် FOC ပမာဏရှိပါက Summary Cards သို့မဟုတ် ကတ်ငယ်တစ်ခုဖြင့် သီးခြားသိရှိနိုင်ရန် ညွှန်းဆိုပြသနိုင်ခြင်း။

---

## ၄။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Verification & Testing)

1. **Automated Audit Script စမ်းသပ်ခြင်း**:
   - Cash Order တစ်ခု၊ Credit Order တစ်ခု နှင့် FOC Order တစ်ခု ဖန်တီး၍ Sales Report API (`/api/v1/sale-report`) အား စစ်ဆေးခြင်း။
   - Total Final Amount သည် `Cash Final Amount + Credit Final Amount` နှင့် ကွက်တိတူညီပြီး FOC ပမာဏ မပါဝင်ကြောင်း အတည်ပြုခြင်း။
   - `focAmount` နှင့် `focOrderCount` တွင် FOC အော်ဒါ တန်ဖိုးများ သီးခြားမှန်ကန်စွာ ပေါ်နေကြောင်း အတည်ပြုခြင်း။
2. **Frontend UI စစ်ဆေးခြင်း**:
   - Reports စာမျက်နှာ၏ `Overall Tab` တွင် Total Sales Card နှင့် Storefront Breakdown Table ၏ Final Amount တို့တွင် FOC မပါဝင်ဘဲ မှန်ကန်သွားခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
   - `FOC Products Tab` တွင် FOC အော်ဒါများ ပုံမှန်အတိုင်း အပြည့်အစုံ ဆက်လက်ပေါ်နေခြင်း ရှိမရှိ စစ်ဆေးခြင်း။
