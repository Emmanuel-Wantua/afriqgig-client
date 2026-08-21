import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "Graphic Design"
    group: { type: String, required: true }, // e.g. "Design & Creative"

    // Admin toggle: only active categories are selectable on signup + post-job forms
    isActive: { type: Boolean, default: true },

    // Distinct vetting task per skill, per your requirement
    vettingTaskTemplate: {
      instructions: { type: String },
      deadlineHours: { type: Number, default: 48 },
      attachmentUrl: { type: String }, // optional brief/reference file
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);
