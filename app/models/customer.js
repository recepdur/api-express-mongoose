const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = new Schema({ 
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Kullanıcı bilgisi boş olamaz!"], 
  },
  firstName: { type: String, required: [true, "Adı bilgisi boş olamaz!"], },
  lastName: { type: String, },
  phone: { type: String, },
  email: { type: String, lowercase: true, },
  tcNo: { type: String, },
  isActive: { type: Boolean, default: true, },
  created: { type: Date, default: Date.now, },
  updated: { type: Date, default: Date.now, },
});

module.exports = mongoose.model("Customer", customerSchema);