import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    no: { type: Number },
    description: { type: String, required: true },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const billToSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "" },
    address: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    quotationNo: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentTerms: {
      type: String,
      default: "50% Advance, 50% on Completion",
    },
    validityTerms: {
      type: String,
      default: "Valid for 14 Days",
    },
    paymentMethod: {
      type: String,
      default: "KBZ Pay",
    },
    paymentReceivedDate: {
      type: Date,
      default: null,
    },
    billTo: {
      type: billToSchema,
      required: true,
    },
    items: [invoiceItemSchema],
    subTotal: {
      type: Number,
      default: 0,
    },
    discountOrTaxLabel: {
      type: String,
      default: "Discount / Tax (%)",
    },
    discountOrTaxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    remarks: {
      type: [String],
      default: [],
    },
    currency: {
      type: String,
      default: "MMK",
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "cancelled"],
      default: "issued",
      index: true,
    },
    preparedBy: {
      type: String,
      default: "Prepared By: Ocean Blue",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    storefrontId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorefrontProfile",
      default: null,
    },
    softDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
