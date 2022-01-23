const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
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
  tranDate: { type: Date }, 
  tranType: { type: String }, 
  description: { type: String },
  loanAmount: { type: Number }, // Borç - Verilen - Alacak
  creditAmount: { type: Number }, // Alınan - Alındı - 
  isActive: { type: Boolean, default: true, },
  created: { type: Date, default: Date.now, },
  updated: { type: Date, default: Date.now, },
});

module.exports = mongoose.model("Account", accountSchema);
