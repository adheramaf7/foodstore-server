const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const modelSchema = Schema(
  {
    name: {
      type: String,
      minlength: [3, 'Panjang nama tag minimal 3 karakter'],
      maxLength: [20, 'Panjang nama tag maksimal 20 karakter'],
      required: [true, 'Nama tag harus diisi'],
    },
  },
  { timestamps: true }
);

module.exports = model('Tag', modelSchema);
