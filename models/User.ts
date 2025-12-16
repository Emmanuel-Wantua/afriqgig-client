import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { 
      type: String, 
      required: function(this: any) { return !this.authProvider; } 
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // FIX: New fields for Social Login
  authProvider: { type: String, default: null }, 
  authProviderId: { type: String, default: null },
  
  role: { type: String, enum: ["client", "freelancer", "admin"], required: true },
  
  // Identity
  avatar: { type: String },
  coverPhoto: { type: String },
  isVerified: { type: Boolean, default: false },
  identityDocuments: { type: [String], default: [] },
  identityDocType: { type: String, default: "national_id" },
  
  // Professional Details
  title: { type: String },
  bio: { type: String },
  country: { type: String, default: "Cameroon" }, 
  languages: [{ name: String, level: String }],
  externalPortfolio: { type: String },

  // --- RICH PROFILE DATA ---
  experience: [{
      role: String,
      company: String,
      year: String, 
      description: String
  }],
  education: [{
      degree: String,
      school: String,
      year: String 
  }],
  certifications: [{
      name: String,
      issuer: String,
      year: String
  }],
  
  // Freelancer Specifics
  skills: [String],
  interests: [String],
  rateType: { type: String, enum: ["hourly", "negotiated"], default: "hourly" },
  hourlyRate: { type: Number, default: 0 },
  
  // Portfolios
  portfolio: [{
    title: String,
    link: String,
    image: String,
    description: String
  }],
  
  // Stats
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },

  // --- REFERRAL ENGINE (New) ---
  referralCode: { type: String, unique: true, sparse: true }, // e.g. "AFQ-8X29"
  referredBy: { type: String }, // Code of the referrer
  wallet: {
      credits: { type: Number, default: 0 }, // Discount tokens (50% off)
      balance: { type: Number, default: 0 }  // Actual cash balance (future use)
  },

  // --- SETTINGS ---
  settings: {
    // 1. Account & Preferences
    theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
    language: { type: String, default: "en" }, 
    currency: { type: String, default: "XAF" }, 
    verificationStatus: { type: String, enum: ["none", "pending", "verified", "rejected"], default: "none" },
    
    // 2. General
    contentLanguage: { type: String, default: "en" },
    autoplayVideo: { type: Boolean, default: true },
    reduceAnimations: { type: Boolean, default: false },
    soundEffects: { type: Boolean, default: true },
    
    // 3. Visibility
    profileVisibility: { type: String, enum: ["public", "clients_only", "private"], default: "public" },
    showOnlineStatus: { type: Boolean, default: true },
    allowDataCollection: { type: Boolean, default: true },
    
    // 4. Notifications
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
    }
  },
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);