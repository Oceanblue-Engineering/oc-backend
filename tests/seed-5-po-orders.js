import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

import Purchasing from "../src/models/purchasing.model.js";
import SupplierProfile from "../src/models/supplierProfile.model.js";
import Inventory from "../src/models/inventory.model.js";
import Admin from "../src/models/admin.model.js";

const poSpecs = [
  {
    supplierName: "AquaTech Pool & Spa Myanmar Co., Ltd.",
    note: "Stock replenishment for Q3 swim season",
    paymentType: "paid",
    paidAmount: 480000,
    items: [
      { productCode: "POOL-GOGGLE-01", purchaseQuantity: 20 },
      { productCode: "POOL-CAP-02", purchaseQuantity: 30 },
    ],
  },
  {
    supplierName: "BlueOcean Water Treatment & Chemicals Co., Ltd.",
    note: "Monthly chemical & cleaning supplies order",
    paymentType: "paid",
    paidAmount: 390000,
    items: [
      { productCode: "POOL-CHLOR-07", purchaseQuantity: 15 },
      { productCode: "POOL-NET-08", purchaseQuantity: 10 },
    ],
  },
  {
    supplierName: "Golden Wave Swim Sports & Safety Supplies",
    note: "Swim training gear credit purchase",
    paymentType: "credit",
    paidAmount: 200000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due
    items: [
      { productCode: "POOL-ARM-05", purchaseQuantity: 40 },
      { productCode: "POOL-FINS-06", purchaseQuantity: 10 },
    ],
  },
  {
    supplierName: "Oceanic Marine & Lighting Solutions Ltd.",
    note: "Underwater lighting & life jacket order",
    paymentType: "credit",
    paidAmount: 300000,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days due
    items: [
      { productCode: "POOL-VEST-13", purchaseQuantity: 15 },
      { productCode: "POOL-LED-15", purchaseQuantity: 5 },
    ],
  },
  {
    supplierName: "SmartPool Automation & Resort Imports",
    note: "High value resort machinery & inflatable pools",
    paymentType: "paid",
    paidAmount: 2080000,
    items: [
      { productCode: "POOL-ROBOT-19", purchaseQuantity: 2 },
      { productCode: "POOL-INFLATABLE-20", purchaseQuantity: 4 },
    ],
  },
];

async function seedFivePOOrders() {
  console.log("==================================================================");
  console.log(" SEEDING 5 PURCHASE ORDERS (PO) INTO PURCHASING DATABASE         ");
  console.log("==================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is missing!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("DB Connected successfully.\n");

    let admin = await Admin.findOne({});
    if (!admin) {
      admin = await Admin.create({
        name: "Ocean Admin",
        username: `po_admin_${Date.now()}`,
        password: "password123",
        role: "owner",
      });
    }

    const createdPOs = [];

    for (const spec of poSpecs) {
      const supplier = await SupplierProfile.findOne({ supplierName: spec.supplierName });
      if (!supplier) {
        console.error(`❌ Supplier "${spec.supplierName}" not found! Run seed-5-suppliers-with-products.js first.`);
        continue;
      }

      let totalAmount = 0;
      const productsWithDetails = [];

      for (const item of spec.items) {
        const product = await Inventory.findOne({ productCode: item.productCode });
        if (!product) {
          console.error(`❌ Product "${item.productCode}" not found!`);
          continue;
        }

        const itemTotal = product.buyingPrice * item.purchaseQuantity;
        totalAmount += itemTotal;

        productsWithDetails.push({
          inventoryId: product._id,
          productName: product.productName,
          productCode: product.productCode,
          buyingPrice: product.buyingPrice,
          purchaseQuantity: item.purchaseQuantity,
        });
      }

      const poNumber = await Purchasing.generatePONumber();

      const po = await Purchasing.create({
        poNumber,
        supplierId: supplier._id,
        products: productsWithDetails,
        note: spec.note,
        totalAmount,
        paymentType: spec.paymentType,
        paidAmount: spec.paymentType === "credit" ? spec.paidAmount : totalAmount,
        dueDate: spec.dueDate || null,
        status: "pending",
        purchasedBy: admin._id,
      });

      createdPOs.push({
        id: po._id.toString(),
        poNumber: po.poNumber,
        supplierName: supplier.supplierName,
        totalAmount: po.totalAmount,
        paymentType: po.paymentType,
        paidAmount: po.paidAmount,
      });

      console.log(`✅ [CREATED PO] ${po.poNumber} | Supplier: ${supplier.supplierName} | Total: ${po.totalAmount.toLocaleString()} MMK | Payment: ${po.paymentType.toUpperCase()} (Paid: ${po.paidAmount.toLocaleString()} MMK)`);
    }

    console.log("\n==================================================================");
    console.log(`SUCCESSFULLY CREATED ${createdPOs.length} PURCHASE ORDERS (PO)!`);
    console.log("==================================================================");

    return createdPOs;
  } catch (err) {
    console.error("Failed to seed 5 PO Orders:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

seedFivePOOrders()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
