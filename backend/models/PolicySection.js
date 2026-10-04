const mongoose = require('mongoose');

const policySectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true, // e.g. '3.2'
    },
    category: {
      type: String,
      required: true, // 'General Rules', 'Travel', 'Meals' ...
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true, // policy ka exact text (citation yahi dikhayega)
    },
    limitAmount: {
      type: Number, // sirf limit wale sections me; baaki me khali
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PolicySection', policySectionSchema);