import twilio from "twilio";
import User from "@/models/User";

const client = process.env.TWILIO_ACCOUNT_SID 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// --- MESSAGE TEMPLATES (Translated) ---
const templates = {
  HIRED: {
    en: (clientName: string, jobTitle: string) => 
      `🎉 You've been hired! ${clientName} hired you for "${jobTitle}". Log in to AfriqGig to start working.`,
    fr: (clientName: string, jobTitle: string) => 
      `🎉 Vous avez été embauché ! ${clientName} vous a confié la mission "${jobTitle}". Connectez-vous à AfriqGig pour commencer.`,
  },
  PAYMENT: {
    en: (amount: string) => 
      `💰 Payment Received: ${amount} has been deposited into your AfriqGig wallet.`,
    fr: (amount: string) => 
      `💰 Paiement Reçu : ${amount} a été déposé sur votre portefeuille AfriqGig.`,
  }
};

type TemplateType = keyof typeof templates;

export async function sendMobileNotification(userId: string, type: TemplateType, params: any[]) {
  try {
    // 1. Check if Twilio is configured
    if (!client) {
        console.warn("⚠️ Twilio not configured in .env");
        return;
    }

    // 2. Fetch User Settings & Phone
    const user = await User.findById(userId).select("phone settings");
    
    if (!user || !user.phone) return;
    
    // 3. Check Permissions (Respect User Privacy)
    // We assume 'sms' setting covers both SMS and WhatsApp for now
    if (!user.settings?.notifications?.sms) {
        console.log(`🔕 User ${userId} has disabled mobile notifications.`);
        return;
    }

    // 4. Select Language
    const lang = (user.settings.language === 'fr' || user.settings.language === 'ar') ? 'fr' : 'en';
    const messageBody = (templates[type][lang] as any)(...params);

    // 5. Send Message (Defaulting to SMS for stability)
    // To send WhatsApp, you simply prepend "whatsapp:" to the numbers.
    // For now, we will stick to SMS as it's the most universal fallback in Africa.
    
    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });

    console.log(`✅ SMS sent to ${user.phone}: "${messageBody}"`);

  } catch (error) {
    console.error("🔥 SMS Failed:", error);
    // We catch the error so it doesn't crash the main app flow
  }
}