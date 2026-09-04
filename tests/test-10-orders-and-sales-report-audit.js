import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

import Order from "../src/models/orders.model.js";
import LocationProfile from "../src/models/locationProfile.model.js";
import Inventory from "../src/models/inventory.model.js";
import Admin from "../src/models/admin.model.js";
import CreditPerson from "../src/models/creditPersona.model.js";

async function runOrdersAndSalesReportAudit() {
  console.log("==================================================================");
  console.log(" CREATING 10 ORDERS (5 CASH + 5 CREDIT) & SALES REPORT AUDIT       ");
  console.log("==================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is missing!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("DB Connected successfully.\n");

    // 1. Get Storefront
    const storefront = await LocationProfile.findOne({ type: "storefront", isDeleted: false });
    if (!storefront) {
      throw new Error("No active storefront location found!");
    }
    console.log(`📍 Storefront: ${storefront.locationName} (${storefront._id})`);

    // Clean up previous test orders created today to avoid duplicates
    const deleteResult = await Order.deleteMany({
      storefrontId: storefront._id,
      orderNumber: new RegExp(`^ORD-2026-09-04-`),
    });
    console.log(`🧹 Cleaned up ${deleteResult.deletedCount} previous test orders created today.\n`);

    // 2. Get Admin
    let admin = await Admin.findOne({});
    if (!admin) {
      admin = await Admin.create({
        name: "Ocean Admin",
        username: `sale_admin_${Date.now()}`,
        password: "password123",
        role: "owner",
      });
    }

    // 3. Get Customers
    let customers = await CreditPerson.find({}).limit(5);
    if (customers.length < 5) {
      console.log("Seeding default 5 customers for test...");
      const defaultCusts = [
        { name: "ဦးအေးလွင် (U Aye Lwin)", phone: "09420011223", address: "မရမ်းကုန်း၊ ရန်ကုန်" },
        { name: "ဒေါ်နန်းရွှေရည် (Daw Nan Shwe Yee)", phone: "09250112233", address: "ကမာရွတ်၊ ရန်ကုန်" },
        { name: "ဦးဝင်းကိုကို (U Win Ko Ko)", phone: "09798112244", address: "ဗဟန်း၊ ရန်ကုန်" },
        { name: "ဒေါ်သင်းသင်းဆွေ (Daw Thin Thin Swe)", phone: "09450223344", address: "စမ်းချောင်း၊ ရန်ကုန်" },
        { name: "ဦးကျော်သူဟန် (U Kyaw Thu Han)", phone: "09971334455", address: "လှိုင်၊ ရန်ကုန်" },
      ];
      for (const c of defaultCusts) {
        let existing = await CreditPerson.findOne({ phone: c.phone });
        if (!existing) {
          existing = await CreditPerson.create(c);
        }
      }
      customers = await CreditPerson.find({}).limit(5);
    }
    console.log(`👤 Loaded ${customers.length} Customers for Credit Orders.`);

    // 4. Define 10 Orders Specifications
    const orderSpecs = [
      // --- CASH ORDERS (5) ---
      {
        type: "paid",
        customer: null,
        items: [{ code: "POOL-GOGGLE-01", qty: 2 }],
        note: "Cash order 1 - Swim Goggles",
      },
      {
        type: "paid",
        customer: null,
        items: [{ code: "POOL-CAP-02", qty: 3 }],
        note: "Cash order 2 - Silicon Swim Caps",
      },
      {
        type: "paid",
        customer: null,
        items: [
          { code: "POOL-FLOAT-04", qty: 1 },
          { code: "POOL-ARM-05", qty: 2 },
        ],
        note: "Cash order 3 - Pool Float & Arm Bands",
      },
      {
        type: "paid",
        customer: null,
        items: [
          { code: "POOL-NET-08", qty: 2 },
          { code: "POOL-EAR-17", qty: 4 },
        ],
        note: "Cash order 4 - Skimmer Net & Ear Plugs",
      },
      {
        type: "paid",
        customer: null,
        items: [{ code: "POOL-FINS-06", qty: 2 }],
        note: "Cash order 5 - Training Swim Fins",
      },

      // --- CREDIT ORDERS (5) ---
      {
        type: "credit",
        customer: customers[0],
        items: [{ code: "POOL-HAMM-16", qty: 2 }],
        initialPaidAmount: 20000,
        note: "Credit order 1 - Inflatable Water Hammocks",
      },
      {
        type: "credit",
        customer: customers[1],
        items: [{ code: "POOL-KICK-11", qty: 4 }],
        initialPaidAmount: 30000,
        note: "Credit order 2 - EVA Foam Kickboards",
      },
      {
        type: "credit",
        customer: customers[2],
        items: [{ code: "POOL-VEST-13", qty: 3 }],
        initialPaidAmount: 25000,
        note: "Credit order 3 - Life Jackets",
      },
      {
        type: "credit",
        customer: customers[3],
        items: [
          { code: "POOL-GOGGLE-01", qty: 4 },
          { code: "POOL-CAP-02", qty: 5 },
        ],
        initialPaidAmount: 40000,
        note: "Credit order 4 - Bulk Goggles & Caps",
      },
      {
        type: "credit",
        customer: customers[4],
        items: [
          { code: "POOL-FINS-06", qty: 2 },
          { code: "POOL-EAR-17", qty: 5 },
        ],
        initialPaidAmount: 30000,
        note: "Credit order 5 - Swim Fins & Ear Plugs Combo",
      },
    ];

    const createdOrderIds = [];
    let expectedTotalFinal = 0;
    let expectedTotalPaid = 0;
    let expectedPaidCount = 0;
    let expectedCreditCount = 0;

    console.log("🛍️ Creating 10 Orders in Database...\n");

    for (let i = 0; i < orderSpecs.length; i++) {
      const spec = orderSpecs[i];
      const ordersProducts = [];
      let subTotal = 0;

      for (const itemSpec of spec.items) {
        const product = await Inventory.findOne({ productCode: itemSpec.code });
        if (!product) {
          throw new Error(`Product ${itemSpec.code} not found in inventory!`);
        }
        const unitPrice = product.sellingPrice || 10000;
        const buyingPrice = product.buyingPrice || 5000;
        const lineTotal = unitPrice * itemSpec.qty;
        subTotal += lineTotal;

        ordersProducts.push({
          inventoryId: product._id,
          quantity: itemSpec.qty,
          unitPrice,
          buyingPrice,
        });
      }

      const finalAmount = subTotal;
      const paidAmount = spec.type === "paid" ? finalAmount : (spec.initialPaidAmount || 0);
      const orderNumber = await Order.generateOrderNumber();

      const orderData = {
        orderNumber,
        storefrontId: storefront._id,
        ordersProducts,
        creditPersonId: spec.customer ? spec.customer._id : null,
        subTotal,
        tax: 0,
        discount: 0,
        finalAmount,
        paidAmount,
        extraChange: 0,
        orderStatus: "completed",
        soldBy: admin._id,
        paymentType: spec.type,
        paymentMethod: "cash",
        note: spec.note,
      };

      const order = await Order.create(orderData);
      createdOrderIds.push(order._id);

      expectedTotalFinal += finalAmount;
      expectedTotalPaid += paidAmount;
      if (spec.type === "paid") expectedPaidCount++;
      if (spec.type === "credit") expectedCreditCount++;

      const customerLabel = spec.customer ? `Customer: ${spec.customer.name}` : "Walk-in Cash Customer";
      console.log(`  [${i + 1}/10] ${order.orderNumber} | ${spec.type.toUpperCase()} | Final: ${finalAmount.toLocaleString()} MMK | Paid: ${paidAmount.toLocaleString()} MMK | ${customerLabel}`);
    }

    console.log("\n==================================================================");
    console.log(" EXPECTED METRICS SUMMARY FOR CREATED ORDERS");
    console.log("==================================================================");
    console.log(` Total Orders      : 10`);
    console.log(` Paid Orders       : ${expectedPaidCount}`);
    console.log(` Credit Orders     : ${expectedCreditCount}`);
    console.log(` Total Final Amount: ${expectedTotalFinal.toLocaleString()} MMK`);
    console.log(` Total Paid Amount : ${expectedTotalPaid.toLocaleString()} MMK`);
    console.log(` Outstanding Debt  : ${(expectedTotalFinal - expectedTotalPaid).toLocaleString()} MMK`);

    console.log("\n==================================================================");
    console.log(" AUDITING SALES REPORT AGGREGATION QUERY (saleReport.controller)");
    console.log("==================================================================");

    const saleReportAggregate = await Order.aggregate([
      {
        $match: {
          _id: { $in: createdOrderIds },
          isDeleted: false,
          orderStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalFinalAmount: { $sum: "$finalAmount" },
          totalPaidAmount: { $sum: "$paidAmount" },
          totalSubTotal: { $sum: "$subTotal" },
          totalTax: { $sum: "$tax" },
          totalDiscount: { $sum: "$discount" },
          totalExtraChange: { $sum: "$extraChange" },
          orderCount: { $sum: 1 },
          creditOrderCount: {
            $sum: { $cond: [{ $eq: ["$paymentType", "credit"] }, 1, 0] },
          },
          paidOrderCount: {
            $sum: { $cond: [{ $eq: ["$paymentType", "paid"] }, 1, 0] },
          },
        },
      },
    ]);

    const report = saleReportAggregate[0] || {};

    console.log(` Actual Total Final Amount: ${report.totalFinalAmount.toLocaleString()} MMK`);
    console.log(` Actual Total Paid Amount : ${report.totalPaidAmount.toLocaleString()} MMK`);
    console.log(` Actual Total Orders      : ${report.orderCount}`);
    console.log(` Actual Paid Orders       : ${report.paidOrderCount}`);
    console.log(` Actual Credit Orders     : ${report.creditOrderCount}`);

    // Verification asserts
    let isPassed = true;
    if (report.totalFinalAmount !== expectedTotalFinal) {
      console.error(`❌ Mismatch in totalFinalAmount! Expected ${expectedTotalFinal}, got ${report.totalFinalAmount}`);
      isPassed = false;
    }
    if (report.totalPaidAmount !== expectedTotalPaid) {
      console.error(`❌ Mismatch in totalPaidAmount! Expected ${expectedTotalPaid}, got ${report.totalPaidAmount}`);
      isPassed = false;
    }
    if (report.orderCount !== 10) {
      console.error(`❌ Mismatch in orderCount! Expected 10, got ${report.orderCount}`);
      isPassed = false;
    }
    if (report.paidOrderCount !== 5) {
      console.error(`❌ Mismatch in paidOrderCount! Expected 5, got ${report.paidOrderCount}`);
      isPassed = false;
    }
    if (report.creditOrderCount !== 5) {
      console.error(`❌ Mismatch in creditOrderCount! Expected 5, got ${report.creditOrderCount}`);
      isPassed = false;
    }

    if (isPassed) {
      console.log("\n✅ ALL SALES REPORT METRICS MATCH 100% WITH CREATED ORDERS DATA!");
    } else {
      console.error("\n❌ SALES REPORT AUDIT FAILED DUE TO METRIC MISMATCHES!");
      throw new Error("Sales report audit failed!");
    }

    return {
      totalFinalAmount: report.totalFinalAmount,
      totalPaidAmount: report.totalPaidAmount,
      outstandingDebt: report.totalFinalAmount - report.totalPaidAmount,
      orderCount: report.orderCount,
      paidOrderCount: report.paidOrderCount,
      creditOrderCount: report.creditOrderCount,
    };
  } catch (err) {
    console.error("Error in runOrdersAndSalesReportAudit:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

runOrdersAndSalesReportAudit()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
