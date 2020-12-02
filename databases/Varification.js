const mongoose = require("mongoose");

const Varification = mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  code: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: "15m",
    default: Date.now,
  },
});

module.exports = mongoose.model("varification", Varification);
