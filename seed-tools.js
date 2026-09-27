import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import ToolItem from "./src/models/toolItem.model.js";

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const sampleTools = [
  {
    name: "Bosch Rotary Hammer Drill 800W",
    category: "Power Tools",
    serialNumber: "BOS-RH-801",
    totalQuantity: 10,
    description: "Heavy duty rotary hammer drill for concrete and masonry drilling.",
  },
  {
    name: "Makita Angle Grinder 4-Inch 840W",
    category: "Power Tools",
    serialNumber: "MAK-AG-402",
    totalQuantity: 8,
    description: "Compact angle grinder for metal and tile cutting.",
  },
  {
    name: "DeWalt Cordless Impact Driver 20V",
    category: "Power Tools",
    serialNumber: "DEW-ID-201",
    totalQuantity: 6,
    description: "High torque cordless impact driver with 2x 4.0Ah batteries.",
  },
  {
    name: "Heavy Duty Sledge Hammer 10lb",
    category: "Hand Tools",
    serialNumber: "HD-SH-101",
    totalQuantity: 12,
    description: "Fiberglass handle sledge hammer for demolition.",
  },
  {
    name: "Stanley Claw Hammer 16oz",
    category: "Hand Tools",
    serialNumber: "STN-CH-161",
    totalQuantity: 15,
    description: "Steel forged curved claw hammer with ergonomic grip.",
  },
  {
    name: "Digital Laser Distance Meter 60m",
    category: "Measurement",
    serialNumber: "DLM-60-301",
    totalQuantity: 5,
    description: "Precision laser measure with area, volume, and pythagorean modes.",
  },
  {
    name: "Aluminum Spirit Level 48-Inch",
    category: "Measurement",
    serialNumber: "ASL-48-202",
    totalQuantity: 8,
    description: "Magnetic 3-vial heavy duty aluminum spirit level.",
  },
  {
    name: "Steel Measuring Tape 8m / 26ft",
    category: "Measurement",
    serialNumber: "SMT-8M-101",
    totalQuantity: 20,
    description: "Durable nylon-coated blade measuring tape with shockproof casing.",
  },
  {
    name: "Portable Concrete Vibrator 1.5kW",
    category: "Heavy Equipment",
    serialNumber: "PCV-15-501",
    totalQuantity: 4,
    description: "Handheld concrete vibrator with 2m flexible shaft for air removal.",
  },
  {
    name: "Manual Tile Cutter Machine 800mm",
    category: "Cutting Tools",
    serialNumber: "TCM-800-401",
    totalQuantity: 5,
    description: "Heavy duty double rail tile cutter with tungsten carbide wheel.",
  },
  {
    name: "Makita Circular Saw 7-1/4 Inch",
    category: "Cutting Tools",
    serialNumber: "MAK-CS-701",
    totalQuantity: 6,
    description: "1800W circular saw for lumber and plywood cutting.",
  },
  {
    name: "Heavy Duty Pipe Wrench 18-Inch",
    category: "Plumbing Tools",
    serialNumber: "PW-18-601",
    totalQuantity: 10,
    description: "Ductile iron straight pipe wrench with hardened alloy jaws.",
  },
  {
    name: "PPR / PVC Pipe Socket Welder Set",
    category: "Plumbing Tools",
    serialNumber: "PPR-SW-302",
    totalQuantity: 6,
    description: "Thermo-fusion welding machine for PPR pipes and fittings (20-63mm).",
  },
  {
    name: "Submersible Drainage Sump Pump 1.5HP",
    category: "Plumbing Tools",
    serialNumber: "SDP-15-701",
    totalQuantity: 4,
    description: "Stainless steel submersible pump for pool drainage and dewatering.",
  },
  {
    name: "Digital Clamp Multimeter 600A",
    category: "Electrical",
    serialNumber: "DCM-400-801",
    totalQuantity: 6,
    description: "True RMS digital clamp meter for AC/DC current, voltage, and continuity.",
  },
  {
    name: "Wire Stripper & Crimper Plier Set",
    category: "Electrical",
    serialNumber: "WSC-01-901",
    totalQuantity: 12,
    description: "Multi-function automatic wire stripping and terminal crimping tool.",
  },
  {
    name: "Heavy Duty Wheelbarrow 100L",
    category: "Site Equipment",
    serialNumber: "WB-100-101",
    totalQuantity: 10,
    description: "Steel tray pneumatic tire construction wheelbarrow.",
  },
  {
    name: "Telescopic Aluminum Extension Ladder 3.8m",
    category: "Safety & Access",
    serialNumber: "TAL-38-201",
    totalQuantity: 6,
    description: "Multi-position collapsible aluminum ladder (150kg load capacity).",
  },
  {
    name: "Electric Paint & Sealant Sprayer 650W",
    category: "Painting & Coating",
    serialNumber: "EPS-650-301",
    totalQuantity: 4,
    description: "HVLP spray gun for interior, exterior, and waterproofing coats.",
  },
  {
    name: "Full Body Safety Harness & Lanyard Kit",
    category: "Safety Equipment",
    serialNumber: "SSH-01-501",
    totalQuantity: 20,
    description: "OSHA compliant fall protection harness with energy absorber lanyard.",
  },
];

async function seedTools() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    try {
      await mongoose.connection.db.collection("toolitems").dropIndex("barcode_1");
      console.log("Dropped legacy barcode_1 index successfully.");
    } catch (idxErr) {
      console.log("No legacy barcode_1 index to drop or already dropped.");
    }

    console.log("Seeding 20 test tools...");
    let addedCount = 0;
    let updatedCount = 0;

    for (const tool of sampleTools) {
      // Check if tool with this name or serialNumber already exists
      const existing = await ToolItem.findOne({
        $or: [{ name: tool.name }, { serialNumber: tool.serialNumber }],
        softDeleted: false,
      });

      if (existing) {
        existing.category = tool.category;
        existing.serialNumber = tool.serialNumber;
        existing.totalQuantity = tool.totalQuantity;
        existing.description = tool.description;
        await existing.save();
        updatedCount++;
      } else {
        await ToolItem.create(tool);
        addedCount++;
      }
    }

    console.log(`Seeding completed! Added: ${addedCount}, Updated: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tools:", error);
    process.exit(1);
  }
}

seedTools();
