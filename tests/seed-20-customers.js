import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

import CreditPerson from "../src/models/creditPersona.model.js";

const customersData = [
  { name: "ဦးအေးလွင် (U Aye Lwin)", phone: "09420011223", address: "အမှတ် (၁၅)၊ ကမ္ဘာအေးဘုရားလမ်း၊ မရမ်းကုန်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်နန်းရွှေရည် (Daw Nan Shwe Yee)", phone: "09250112233", address: "အမှတ် (၄၂)၊ ပြည်လမ်း၊ ကမာရွတ်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးဝင်းကိုကို (U Win Ko Ko)", phone: "09798112244", address: "အမှတ် (၁၀၈)၊ သံလွင်လမ်း၊ ဗဟန်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်သင်းသင်းဆွေ (Daw Thin Thin Swe)", phone: "09450223344", address: "အမှတ် (၅)၊ ဓမ္မစေတီလမ်း၊ စမ်းချောင်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးကျော်သူဟန် (U Kyaw Thu Han)", phone: "09971334455", address: "အမှတ် (၂၃)၊ အင်းစိန်လမ်း၊ လှိုင်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "မလှလှဝင်း (Ma Hla Hla Win)", phone: "09255445566", address: "အမှတ် (၇၇)၊ ပါရမီလမ်း၊ မရမ်းကုန်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးသန်းထွန်းဦး (U Than Htun Oo)", phone: "09440556677", address: "အမှတ် (၁၄)၊ စက်မှုလမ်း၊ ရန်ကင်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်မြင့်မြင့်စန်း (Daw Myint Myint San)", phone: "09795667788", address: "အမှတ် (၈၉)၊ ဗညားဒလလမ်း၊ တာမွေမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးစိုးမင်းထက် (U Soe Min Htet)", phone: "09966778899", address: "အမှတ် (၃၁)၊ အနော်ရထာလမ်း၊ ပန်းဘဲတန်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်ခိုင်ဇာခြည် (Daw Khaing Zar Chie)", phone: "09421778899", address: "အမှတ် (၆၄)၊ ကမ်းနားလမ်း၊ လသာမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးဇော်လင်းအောင် (U Zaw Lin Aung)", phone: "09260889900", address: "အမှတ် (၁၂)၊ ဗိုလ်ချုပ်အောင်ဆန်းလမ်း၊ ကျောက်တံတားမြို့နယ်၊ ရန်ကုန်။" },
  { name: "မဆုမြတ်နိုး (Ma Su Myat Noe)", phone: "09780990011", address: "အမှတ် (၅၅)၊ သံသုမာလမ်း၊ သင်္ဃန်းကျွန်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးအောင်ကျော်သူ (U Aung Kyaw Thu)", phone: "09951001122", address: "အမှတ် (၉၃)၊ ပုဇွန်တောင်လမ်း၊ ပုဇွန်တောင်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်ယမင်းဦး (Daw Ya Min Oo)", phone: "09452112233", address: "အမှတ် (၂၇)၊ မင်းရဲကျော်စွာလမ်း၊ လမ်းမတော်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးထွန်းအောင်ကျော် (U Htun Aung Kyaw)", phone: "09253223344", address: "အမှတ် (၁၆)၊ ရေကျော်လမ်း၊ ပုဇွန်တောင်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်ဆန်းဆန်းအေး (Daw San San Aye)", phone: "09794334455", address: "အမှတ် (၄၈)၊ မဟာဗန္ဓုလလမ်း၊ ဗိုလ္တစ်ထောင်မြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးကောင်းဆက်နိုင် (U Kaung Hset Naing)", phone: "09975445566", address: "အမှတ် (၃၅)၊ ရန်ရှင်းလမ်း၊ ရန်ကင်းမြို့နယ်၊ ရန်ကုန်။" },
  { name: "မထက်ထက်လွင် (Ma Htet Htet Lwin)", phone: "09426556677", address: "အမှတ် (၈၂)၊ သမိန်ဗရမ်းလမ်း၊ တာမွေမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဦးကျော်ဆန်းဦး (U Kyaw San Oo)", phone: "09257667788", address: "အမှတ် (၇)၊ နတ်မောက်လမ်း၊ တာမွေမြို့နယ်၊ ရန်ကုန်။" },
  { name: "ဒေါ်ခင်မာလာ (Daw Khin Mar Lar)", phone: "09798778899", address: "အမှတ် (၁၀၁)၊ ဝေဇယန္တာလမ်း၊ တောင်ဥက္ကလာပမြို့နယ်၊ ရန်ကုန်။" },
];

async function seedCustomers() {
  console.log("==================================================================");
  console.log(" SEEDING 20 CUSTOMER PROFILES INTO CREDITPERSON DATABASE        ");
  console.log("==================================================================");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is missing!");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("DB Connected successfully.\n");

    const createdCustomers = [];

    for (const cData of customersData) {
      let customer = await CreditPerson.findOne({ phone: cData.phone });
      if (customer) {
        customer.name = cData.name;
        customer.address = cData.address;
        await customer.save();
      } else {
        customer = await CreditPerson.create({
          name: cData.name,
          phone: cData.phone,
          address: cData.address,
          blacklist: false,
        });
      }

      createdCustomers.push({
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      });

      console.log(`✅ [SEEDED] Customer ID: ${customer._id} | Name: "${customer.name}" | Phone: "${customer.phone}"`);
    }

    console.log("\n==================================================================");
    console.log(`SUCCESSFULLY SEEDED ${createdCustomers.length} CUSTOMER PROFILES!`);
    console.log("==================================================================");

    return createdCustomers;
  } catch (err) {
    console.error("Failed to seed customer profiles:", err);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

seedCustomers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
