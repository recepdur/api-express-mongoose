const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const insuranceSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Kullanıcı bilgisi boş olamaz!"], 
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Müşteri bilgisi boş olamaz"],
  },
  startTime: { type: Date },
  endTime: { type: Date },
  description: { type: String },
  plateNo: { type: String },
  carRegistNo: { type: String },
  company: { type: String },
  policyNo: { type: String },
  grossPrice: { type: Number },
  netPrice: { type: Number },
  commissionRate: { type: Number },
  commissionPrice: { type: Number },
  isActive: { type: Boolean, default: true, },
  created: { type: Date, default: Date.now, },
  updated: { type: Date, default: Date.now, },
});

module.exports = mongoose.model("Insurance", insuranceSchema);
