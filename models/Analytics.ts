import mongoose, { Schema, models, model } from "mongoose";

const AnalyticsSchema = new Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  visits: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  registeredUsers: { type: Number, default: 0 },
  activeJobs: { type: Number, default: 0 },
});

export default models.Analytics || model("Analytics", AnalyticsSchema);