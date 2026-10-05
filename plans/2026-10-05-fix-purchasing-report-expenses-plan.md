# Purchasing & Profit Reports တွင် အသုံးစရိတ်များ (Operational Expenses) မပေါ်သည့် ပြဿနာအား ဖြေရှင်းခြင်း အစီအစဉ် (Implementation Plan)

## ၁။ ပြဿနာ တွေ့ရှိချက် (Root Cause Analysis)

`Expense` စာမျက်နှာတွင် စာရင်းသွင်းထားသော အသုံးစရိတ်များသည် Reports စာမျက်နှာအောက်ရှိ **Purchasing & Profit Reports -> Profit & Loss Analysis -> Operational Expenses** ကတ်တွင် ပေါ်မလာဘဲ `0 MMK` (0 recorded expenses) ဖြစ်နေရသည့် အကြောင်းရင်း (၂) ချက် ရှိပါသည်-

1. **မော်ဒယ် ဖီးလ်အမည် မကိုက်ညီခြင်း (`isDeleted` vs `softDeleted`):**
   - `OB-backend/src/models/expense.model.js` တွင် အသုံးစရိတ်ဖျက်ထားခြင်းရှိမရှိကို `softDeleted: { type: Boolean, default: false }` ဖြင့် သတ်မှတ်ထားပါသည်။ မော်ဒယ်ထဲတွင် `isDeleted` ဟူသော ဖီးလ်လုံးဝ မရှိပါ။
   - သို့သော် `OB-backend/src/controllers/purchasingReport.controller.js` ၏ အသုံးစရိတ်စစ်ထုတ်မှုတွင် `expenseFilter = { isDeleted: false }` ဟု ရေးသားထားသဖြင့် MongoDB တွင် `isDeleted` ဖီးလ်မရှိသော Expense document အားလုံးသည် filter မကိုက်ညီဘဲ `0` ဖြစ်သွားခဲ့ပါသည်။
2. **ရက်စွဲ စစ်ထုတ်မှု ဖီးလ် မကိုက်ညီခြင်း (`createdAt` vs `date`):**
   - စနစ်တွင် အသုံးစရိတ်ဖြစ်ပေါ်ခဲ့သော အမှန်တကယ်ရက်စွဲကို `date` (`date: Date`) ဖီးလ်တွင် သိမ်းဆည်းထားပြီး Expense controller တွင်လည်း `date` ဖြင့် စစ်ထုတ်ထားပါသည်။
   - `purchasingReport.controller.js` တွင် `expenseFilter.createdAt = dateQuery.createdAt;` ဟု `createdAt` ဖြင့် စစ်ထုတ်ထားသဖြင့် အသုံးစရိတ် ထည့်သွင်းခဲ့သည့် အမှန်တကယ် ရက်စွဲ (`date`) နှင့် ကွဲလွဲနေနိုင်ပါသည်။

---

## ၂။ ဖြေရှင်းမည့် ရည်မှန်းချက် (Objective)

1. `purchasingReport.controller.js` တွင် အသုံးစရိတ် စစ်ထုတ်သည့် filter အား `isDeleted: false` အစား `softDeleted: false` သို့ ပြောင်းလဲပြင်ဆင်မည်။
2. ရက်စွဲ filter (`dateQuery.createdAt`) ရှိပါက အသုံးစရိတ်၏ အမှန်တကယ် ရက်စွဲဖြစ်သော `date` ဖီးလ် (`expenseFilter.date = dateQuery.createdAt`) သို့ သတ်မှတ်ပေးမည်။
3. ထိုသို့ ပြုပြင်ပြီးပါက Purchasing & Profit Reports ၏:
   - **Operational Expenses (`totalExpenses`)**: အသုံးစရိတ် စုစုပေါင်းပမာဏ မှန်ကန်စွာ ပေါ်လာမည်။
   - **Recorded Expenses (`expenseCount`)**: အသုံးစရိတ်အရေအတွက် မှန်ကန်စွာ ပေါ်လာမည်။
   - **Net Profit & Net Profit Margin**: စုစုပေါင်းရောင်းရငွေမှ ဝယ်ယူစရိတ်နှင့် လုပ်ငန်းအသုံးစရိတ်များကို နုတ်ယူကာ အသားတင်အမြတ်ငွေ အမှန်တကယ် တိကျစွာ တွက်ချက်ပြသနိုင်မည်။

---

## ၃။ ပြင်ဆင်မည့် ဖိုင် (Files to Modify)

- **`OB-backend/src/controllers/purchasingReport.controller.js`**:
  - လိုင်း ၂၀၃ - ၂၀၉ ဝန်းကျင်ရှိ `expenseFilter` အား အောက်ပါအတိုင်း ပြင်ဆင်မည်-
  ```javascript
  const expenseFilter = {
    softDeleted: false,
  };
  if (dateQuery.createdAt) {
    expenseFilter.date = dateQuery.createdAt;
  }
  ```

---

## ၄။ စမ်းသပ်စစ်ဆေးမည့် နည်းလမ်း (Verification & Testing)

1. **Syntax Check**:
   - `node -c src/controllers/purchasingReport.controller.js` ဖြင့် syntax အမှားအယွင်း မရှိကြောင်း စစ်ဆေးမည်။
2. **Database Query / Aggregation Script Test**:
   - Standalone test script ဖြင့် `getPurchasingReport` ၏ expense aggregation အား run ပြီး database ရှိ expenses များ မှန်ကန်စွာ ပေါင်းထည့်ရရှိကြောင်း စစ်ဆေးအတည်ပြုမည်။
3. **Frontend API Call / Data Flow Test**:
   - Purchasing Report API ကို ခေါ်ယူကြည့်ရှုပြီး `profitLoss.totalExpenses > 0` နှင့် `profitLoss.expenseCount > 0` ထွက်ပေါ်လာကာ Net Profit တွက်ချက်မှု တိကျမှန်ကန်ကြောင်း အတည်ပြုမည်။
