import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

import SupplierProfile from "../src/models/supplierProfile.model.js";
import Inventory from "../src/models/inventory.model.js";

const suppliersConfig = [
  {
    supplierName: "AquaTech Pool & Spa Myanmar Co., Ltd.",
    contactNumber: "09950112233",
    township: "Hlaingthaya",
    address: "အမှတ် (၄၅)၊ စက်မှုဇုန် (၁)၊ လှိုင်သာယာမြို့နယ်၊ ရန်ကုန်။",
    productCodes: ["POOL-GOGGLE-01", "POOL-CAP-02", "POOL-PUMP-03", "POOL-FLOAT-04"],
  },
  {
    supplierName: "BlueOcean Water Treatment & Chemicals Co., Ltd.",
    contactNumber: "09421112233",
    township: "Kyimyindaing",
    address: "အမှတ် (၁၁၂)၊ ကမ်းနားလမ်း၊ ကြည့်မြင်တိုင်မြို့နယ်၊ ရန်ကုန်။",
    productCodes: ["POOL-CHLOR-07", "POOL-NET-08", "POOL-HOSE-09", "POOL-VAC-10"],
  },
  {
    supplierName: "Golden Wave Swim Sports & Safety Supplies",
    contactNumber: "09798223344",
    township: "Thingangyun",
    address: "အမှတ် (၇၈)၊ သံသုမာလမ်း၊ သင်္ဃန်းကျွန်းမြို့နယ်၊ ရန်ကုန်။",
    productCodes: ["POOL-ARM-05", "POOL-FINS-06", "POOL-KICK-11", "POOL-TEST-12"],
  },
  {
    supplierName: "Oceanic Marine & Lighting Solutions Ltd.",
    contactNumber: "09250334455",
    township: "North Dagon",
    address: "အမှတ် (၃၃)၊ ပြည်ထောင်စုလမ်း၊ ဒဂုံမြို့သစ်မြောက်ပိုင်း၊ ရန်ကုန်။",
    productCodes: ["POOL-VEST-13", "POOL-LAD-14", "POOL-LED-15", "POOL-SNORKEL-18"],
  },
  {
    supplierName: "SmartPool Automation & Resort Imports",
    contactNumber: "09971445566",
    township: "Yankin",
    address: "အမှတ် (၅၆)၊ ရန်ရှင်းလမ်း၊ ရန်ကင်းမြို့နယ်၊ ရန်ကုန်။",
    productCodes: ["POOL-HAMM-16", "POOL-EAR-17", "POOL-ROBOT-19", "POOL-INFLATABLE-20"],
  },
];

async function seedSuppliersWithProducts() {
  console.log("==================================================================");
  console.log(" SEEDING 5 SUPPLIERS & LINKING SPECIFIC INVENTORY PRODUCTS        ");
  console.log("==================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is missing!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("DB Connected successfully.\n");

    for (const sConfig of suppliersConfig) {
      const { productCodes, ...sPayload } = sConfig;

      // Upsert SupplierProfile
      let supplier = await SupplierProfile.findOne({ supplierName: sPayload.supplierName });
      if (supplier) {
        supplier.contactNumber = sPayload.contactNumber;
        supplier.township = sPayload.township;
        supplier.address = sPayload.address;
        supplier.isDeleted = false;
        await supplier.save();
      } else {
        supplier = await SupplierProfile.create(sPayload);
      }

      console.log(`🏭 [SUPPLIER CREATED] ${supplier.supplierName} (ID: ${supplier._id})`);

      // Link products in Inventory.suppliers array
      let linkedCount = 0;
      for (const pCode of productCodes) {
        const product = await Inventory.findOne({ productCode: pCode });
        if (product) {
          if (!product.suppliers) product.suppliers = [];
          
          const hasSupplier = product.suppliers.some(
            (sId) => sId.toString() === supplier._id.toString()
          );

          if (!hasSupplier) {
            product.suppliers.push(supplier._id);
            await product.save();
          }
          linkedCount++;
          console.log(`  ├─ 📦 [LINKED] Product: ${product.productCode} (${product.productName})`);
        } else {
          console.log(`  ├─ ⚠️ [WARNING] Product code ${pCode} not found in Inventory!`);
        }
      }

      console.log(`  └─ ✅ Successfully linked ${linkedCount} products to ${supplier.supplierName}\n`);
    }

    console.log("==================================================================");
    console.log("SUCCESSFULLY SEEDED 5 SUPPLIERS AND LINKED INVENTORY PRODUCTS!");
    console.log("==================================================================");
  } catch (err) {
    console.error("Failed to seed suppliers with products:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

seedSuppliersWithProducts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
