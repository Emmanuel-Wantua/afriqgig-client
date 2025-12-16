import nodemailer from 'nodemailer';
import User from "@/models/User";

// --- CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
    // FIX FOR "Self-signed certificate" ERROR:
    tls: {
        rejectUnauthorized: false
    }
});

// --- EMAIL DICTIONARY (Mini-Translation System) ---
const emailText: any = {
    en: {
        hello: "Hello",
        footerText: "Built with love in Africa.",
        managePrefs: "Manage Notification Preferences",
        
        // Subjects
        welcomeSub: "Welcome to AfriqGig! 🚀",
        resetSub: "Reset Your Password 🔒",
        depositSub: "Deposit Confirmed 💰",
        withdrawSub: "Withdrawal Request Received 🏦",
        disputeSub: "Action Required: Dispute Opened ⚠️",
        
        // Titles & Bodies
        welcomeTitle: "Welcome Aboard!",
        welcomeBody: "We are thrilled to have you. AfriqGig is the safest way to hire and work in Africa. Complete your profile today.",
        
        resetTitle: "Forgot your password?",
        resetBody: "We received a request to reset your password. If this wasn't you, ignore this email. Link expires in 1 hour.",
        resetBtn: "Reset Password",

        depositTitle: "Funds Received",
        depositBody: (amount: string) => `Your wallet has been successfully funded with <strong>${amount}</strong>. You can now hire talent.`,
        
        withdrawTitle: "Processing Withdrawal",
        withdrawBody: (amount: string) => `We have received your request to withdraw <strong>${amount}</strong>. Funds will arrive in 24-48 hours.`,
        
        disputeTitle: "Dispute Opened",
        disputeBody: (job: string) => `A dispute has been opened for the job <strong>"${job}"</strong>. Our support team will step in to help resolve this.`,
        disputeBtn: "View Dispute",
        jobPostedSub: "Job Posted Successfully ✅",
        jobPostedTitle: "Your Job is Live!",
        jobPostedBody: (title: string) => `<strong>"${title}"</strong> has been posted. Freelancers will start sending proposals soon.`,
        viewJob: "View Job",

        proposalSub: "New Proposal Received 📩",
        proposalTitle: "You have a new applicant!",
        proposalBody: (name: string, title: string) => `<strong>${name}</strong> just applied to your job <strong>"${title}"</strong>.`,
        reviewProposal: "Review Proposal",
        hiredSub: "You're Hired! 🎉",
        hiredTitle: "Congratulations!",
        hiredBody: (job: string) => `You have been selected for <strong>"${job}"</strong>. You can now start working.`,
        viewContract: "View Contract",

        submittedSub: "Work Submitted for Approval 📝",
        submittedTitle: "Work Received",
        submittedBody: (name: string, job: string) => `<strong>${name}</strong> has submitted work for <strong>"${job}"</strong>. Please review it within 14 days.`,
        reviewWork: "Review Work",

        approvedSub: "Payment Released 💸",
        approvedTitle: "Great Job!",
        approvedBody: (job: string, amount: string) => `Your work on <strong>"${job}"</strong> has been approved. <strong>${amount}</strong> has been released to your wallet.`,
        viewWallet: "View Wallet",
        withdrawalApprovedSub: "Withdrawal Approved ✅",
        withdrawalApprovedTitle: "Funds on the way!",
        withdrawalApprovedBody: (amount: string) => `Your withdrawal of <strong>${amount}</strong> has been approved and processed.`,
    },
    fr: {
        hello: "Bonjour",
        footerText: "Fait avec amour en Afrique.",
        managePrefs: "Gérer les préférences",
        
        welcomeSub: "Bienvenue sur AfriqGig ! 🚀",
        resetSub: "Réinitialisez votre mot de passe 🔒",
        depositSub: "Dépôt Confirmé 💰",
        withdrawSub: "Demande de Retrait Reçue 🏦",
        disputeSub: "Action Requise : Litige Ouvert ⚠️",
        
        welcomeTitle: "Bienvenue !",
        welcomeBody: "Nous sommes ravis de vous compter parmi nous. Complétez votre profil dès aujourd'hui.",
        
        resetTitle: "Mot de passe oublié ?",
        resetBody: "Nous avons reçu une demande de réinitialisation. Si ce n'était pas vous, ignorez cet e-mail.",
        resetBtn: "Réinitialiser",

        depositTitle: "Fonds Reçus",
        depositBody: (amount: string) => `Votre portefeuille a été crédité de <strong>${amount}</strong>.`,
        
        withdrawTitle: "Retrait en cours",
        withdrawBody: (amount: string) => `Nous traitons votre demande de retrait de <strong>${amount}</strong>.`,
        
        disputeTitle: "Litige Ouvert",
        disputeBody: (job: string) => `Un litige a été ouvert pour le travail <strong>"${job}"</strong>. Notre équipe va intervenir.`,
        disputeBtn: "Voir le Litige",
        jobPostedSub: "Travail Publié avec Succès ✅",
        jobPostedTitle: "Votre travail est en ligne !",
        jobPostedBody: (title: string) => `<strong>"${title}"</strong> a été publié. Les freelances vont bientôt envoyer des propositions.`,
        viewJob: "Voir le Travail",

        proposalSub: "Nouvelle Proposition Reçue 📩",
        proposalTitle: "Vous avez un nouveau candidat !",
        proposalBody: (name: string, title: string) => `<strong>${name}</strong> vient de postuler à votre offre <strong>"${title}"</strong>.`,
        reviewProposal: "Voir la Proposition",
        hiredSub: "Vous avez été embauché ! 🎉",
        hiredTitle: "Félicitations !",
        hiredBody: (job: string) => `Vous avez été sélectionné pour <strong>"${job}"</strong>. Vous pouvez commencer à travailler.`,
        viewContract: "Voir le Contrat",

        submittedSub: "Travail Soumis pour Approbation 📝",
        submittedTitle: "Travail Reçu",
        submittedBody: (name: string, job: string) => `<strong>${name}</strong> a soumis son travail pour <strong>"${job}"</strong>. Veuillez l'examiner sous 14 jours.`,
        reviewWork: "Examiner",

        approvedSub: "Paiement Débloqué 💸",
        approvedTitle: "Beau Travail !",
        approvedBody: (job: string, amount: string) => `Votre travail sur <strong>"${job}"</strong> a été approuvé. <strong>${amount}</strong> a été versé sur votre portefeuille.`,
        viewWallet: "Voir le Portefeuille",
        withdrawalApprovedSub: "Retrait Approuvé ✅",
        withdrawalApprovedTitle: "Fonds en route !",
        withdrawalApprovedBody: (amount: string) => `Votre retrait de <strong>${amount}</strong> a été approuvé et traité.`,
    },
    es: {
        hello: "Hola",
        footerText: "Construido con amor en África.",
        managePrefs: "Administrar Preferencias de Notificación",
        
        // Subjects
        welcomeSub: "¡Bienvenido a AfriqGig! 🚀",
        resetSub: "Restablece tu Contraseña 🔒",
        depositSub: "Depósito Confirmado 💰",
        withdrawSub: "Solicitud de Retiro Recibida 🏦",
        disputeSub: "Acción Requerida: Disputa Abierta ⚠️",
        
        // Titles & Bodies
        welcomeTitle: "¡Bienvenido a bordo!",
        welcomeBody: "Estamos encantados de tenerte. AfriqGig es la forma más segura de contratar y trabajar en África. Completa tu perfil hoy mismo.",
        
        resetTitle: "¿Olvidaste tu contraseña?",
        resetBody: "Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo electrónico. El enlace caduca en 1 hora.",
        resetBtn: "Restablecer Contraseña",

        depositTitle: "Fondos Recibidos",
        depositBody: (amount: string) => `Tu billetera ha sido financiada exitosamente con <strong>${amount}</strong>. Ahora puedes contratar talento.`,
        
        withdrawTitle: "Procesando Retiro",
        withdrawBody: (amount: string) => `Hemos recibido tu solicitud para retirar <strong>${amount}</strong>. Los fondos llegarán en 24-48 horas.`,
        
        disputeTitle: "Disputa Abierta",
        disputeBody: (job: string) => `Se ha abierto una disputa para el trabajo <strong>"${job}"</strong>. Nuestro equipo de soporte intervendrá para ayudar a resolverlo.`,
        disputeBtn: "Ver Disputa",
        jobPostedSub: "Oferta de trabajo publicada con éxito ✅",
        jobPostedTitle: "¡Tu trabajo está en vivo!",
        jobPostedBody: (title: string) => `<strong>"${title}"</strong> ha sido publicado. Los freelancers comenzarán a enviar propuestas pronto.`,
        viewJob: "Ver Trabajo",

        proposalSub: "Nueva Propuesta Recibida 📩",
        proposalTitle: "¡Tienes un nuevo solicitante!",
        proposalBody: (name: string, title: string) => `<strong>${name}</strong> acaba de postularse para tu trabajo <strong>"${title}"</strong>.`,
        reviewProposal: "Revisar Propuesta",
        hiredSub: "¡Has sido contratado! 🎉",
        hiredTitle: "¡Felicidades!",
        hiredBody: (job: string) => `Has sido seleccionado para <strong>"${job}"</strong>. Ya puedes empezar a trabajar.`,
        viewContract: "Ver Contrato",

        submittedSub: "Trabajo Enviado para Aprobación 📝",
        submittedTitle: "Trabajo Recibido",
        submittedBody: (name: string, job: string) => `<strong>${name}</strong> ha enviado el trabajo para <strong>"${job}"</strong>. Por favor, revísalo dentro de 14 días.`,
        reviewWork: "Revisar Trabajo",

        approvedSub: "Pago Liberado 💸",
        approvedTitle: "¡Gran Trabajo!",
        approvedBody: (job: string, amount: string) => `Tu trabajo en <strong>"${job}"</strong> ha sido aprobado. <strong>${amount}</strong> ha sido liberado a tu billetera.`,
        viewWallet: "Ver Billetera",
        withdrawalApprovedSub: "Retiro Aprobado ✅",
        withdrawalApprovedTitle: "¡Fondos en camino!",
        withdrawalApprovedBody: (amount: string) => `Tu retiro de <strong>${amount}</strong> ha sido aprobado y procesado.`
    },
    ar: {
        hello: "مرحباً",
        footerText: "بُنيت بحب في أفريقيا.",
        managePrefs: "إدارة تفضيلات الإشعارات",
        
        // Subjects
        welcomeSub: "مرحبًا بك في AfriqGig! 🚀",
        resetSub: "إعادة تعيين كلمة المرور الخاصة بك 🔒",
        depositSub: "تم تأكيد الإيداع 💰",
        withdrawSub: "تم استلام طلب السحب 🏦",
        disputeSub: "مطلوب اتخاذ إجراء: تم فتح نزاع ⚠️",
        
        // Titles & Bodies
        welcomeTitle: "أهلاً بك!",
        welcomeBody: "نحن متحمسون لانضمامك إلينا. AfriqGig هي الطريقة الأكثر أمانًا للتوظيف والعمل في أفريقيا. أكمل ملفك الشخصي اليوم.",
        
        resetTitle: "هل نسيت كلمة المرور الخاصة بك؟",
        resetBody: "لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك. إذا لم تقم بهذا الإجراء، فتجاهل هذا البريد الإلكتروني. الرابط ينتهي صلاحيته خلال ساعة واحدة.",
        resetBtn: "إعادة تعيين كلمة المرور",

        depositTitle: "تم استلام الأموال",
        depositBody: (amount: string) => `تم تمويل محفظتك بنجاح بمبلغ <strong>${amount}</strong>. يمكنك الآن توظيف المواهب.`,
        
        withdrawTitle: "معالجة السحب",
        withdrawBody: (amount: string) => `لقد تلقينا طلبك لسحب <strong>${amount}</strong>. ستصل الأموال خلال 24-48 ساعة.`,
        
        disputeTitle: "تم فتح نزاع",
        disputeBody: (job: string) => `تم فتح نزاع بخصوص الوظيفة <strong>"${job}"</strong>. سيتدخل فريق الدعم لدينا للمساعدة في حل هذا الأمر.`,
        disputeBtn: "عرض النزاع",
        jobPostedSub: "تم نشر الوظيفة بنجاح ✅",
        jobPostedTitle: "وظيفتك مباشرة الآن!",
        jobPostedBody: (title: string) => `تم نشر <strong>"${title}"</strong>. سيبدأ المستقلون بإرسال المقترحات قريبًا.`,
        viewJob: "عرض الوظيفة",

        proposalSub: "تم استلام اقتراح جديد 📩",
        proposalTitle: "لديك متقدم جديد!",
        proposalBody: (name: string, title: string) => `<strong>${name}</strong> تقدم بطلب لوظيفتك <strong>"${title}"</strong> للتو.`,
        reviewProposal: "مراجعة المقترح",
        hiredSub: "تم توظيفك! 🎉",
        hiredTitle: "تهانينا!",
        hiredBody: (job: string) => `لقد تم اختيارك لوظيفة <strong>"${job}"</strong>. يمكنك البدء في العمل الآن.`,
        viewContract: "عرض العقد",

        submittedSub: "تم تسليم العمل للموافقة 📝",
        submittedTitle: "تم استلام العمل",
        submittedBody: (name: string, job: string) => `قام <strong>${name}</strong> بتسليم العمل الخاص بـ <strong>"${job}"</strong>. يرجى مراجعته في غضون 14 يومًا.`,
        reviewWork: "مراجعة العمل",

        approvedSub: "تم تحرير الدفع 💸",
        approvedTitle: "عمل رائع!",
        approvedBody: (job: string, amount: string) => `تمت الموافقة على عملك في <strong>"${job}"</strong>. تم تحرير مبلغ <strong>${amount}</strong> إلى محفظتك.`,
        viewWallet: "عرض المحفظة",
        withdrawalApprovedSub: "تمت الموافقة على السحب ✅",
        withdrawalApprovedTitle: "الأموال في الطريق!",
        withdrawalApprovedBody: (amount: string) => `تمت الموافقة على سحبك بمبلغ <strong>${amount}</strong> وتمت معالجته.`
    },
    sw: {
        hello: "Hujambo",
        footerText: "Imejengwa kwa upendo barani Afrika.",
        managePrefs: "Dhibiti Mapendeleo ya Arifa",
        
        // Subjects
        welcomeSub: "Karibu AfriqGig! 🚀",
        resetSub: "Weka Upya Nenosiri Lako 🔒",
        depositSub: "Amana Imethibitishwa 💰",
        withdrawSub: "Ombi la Kutoa Pesa Limepokelewa 🏦",
        disputeSub: "Hatua Inahitajika: Mgogoro Umefunguliwa ⚠️",
        
        // Titles & Bodies
        welcomeTitle: "Karibu Kwetu!",
        welcomeBody: "Tumefurahia kukuona. AfriqGig ndiyo njia salama zaidi ya kuajiri na kufanya kazi barani Afrika. Kamilisha wasifu wako leo.",
        
        resetTitle: "Umesahau nenosiri lako?",
        resetBody: "Tumepokea ombi la kuweka upya nenosiri lako. Ikiwa hukuwa wewe, puuza barua pepe hii. Kiungo kinaisha baada ya saa 1.",
        resetBtn: "Weka Upya Nenosiri",

        depositTitle: "Pesa Zimepokelewa",
        depositBody: (amount: string) => `Mkoba wako umefadhiliwa kwa ufanisi na <strong>${amount}</strong>. Sasa unaweza kuajiri vipaji.`,
        
        withdrawTitle: "Inachakata Utoaji",
        withdrawBody: (amount: string) => `Tumepokea ombi lako la kutoa <strong>${amount}</strong>. Pesa zitafika ndani ya masaa 24-48.`,
        
        disputeTitle: "Mgogoro Umefunguliwa",
        disputeBody: (job: string) => `Mgogoro umefunguliwa kwa kazi <strong>"${job}"</strong>. Timu yetu ya usaidizi itaingilia kati kusaidia kutatua hili.`,
        disputeBtn: "Tazama Mgogoro",
        jobPostedSub: "Kazi Imechapishwa Kwa Mafanikio ✅",
        jobPostedTitle: "Kazi Yako Iko Mtandaoni!",
        jobPostedBody: (title: string) => `Kazi <strong>"${title}"</strong> imechapishwa. Wafanyakazi huru wataanza kutuma mapendekezo hivi karibuni.`,
        viewJob: "Tazama Kazi",

        proposalSub: "Pendekezo Jipya Limepokelewa 📩",
        proposalTitle: "Una mwombaji mpya!",
        proposalBody: (name: string, title: string) => `<strong>${name}</strong> amejitokeza kuomba kazi yako <strong>"${title}"</strong>.`,
        reviewProposal: "Kagua Pendekezo",
        hiredSub: "Umeajiriwa! 🎉",
        hiredTitle: "Hongera!",
        hiredBody: (job: string) => `Umechaguliwa kwa ajili ya kazi ya <strong>"${job}"</strong>. Sasa unaweza kuanza kufanya kazi.`,
        viewContract: "Tazama Mkataba",

        submittedSub: "Kazi Imewasilishwa kwa Idhini 📝",
        submittedTitle: "Kazi Imepokelewa",
        submittedBody: (name: string, job: string) => `<strong>${name}</strong> amewasilisha kazi kwa ajili ya <strong>"${job}"</strong>. Tafadhali ikague ndani ya siku 14.`,
        reviewWork: "Kagua Kazi",

        approvedSub: "Malipo Yametolewa 💸",
        approvedTitle: "Kazi Nzuri!",
        approvedBody: (job: string, amount: string) => `Kazi yako ya <strong>"${job}"</strong> imeidhinishwa. <strong>${amount}</strong> imetolewa kwenye mkoba wako.`,
        viewWallet: "Tazama Mkoba",
        withdrawalApprovedSub: "Utoaji Umeidhinishwa ✅",
        withdrawalApprovedTitle: "Pesa Zinafuata!",
        withdrawalApprovedBody: (amount: string) => `Utoaji wako wa <strong>${amount}</strong> umeidhinishwa na kuchakatwa.`
    },
};

// --- MASTER HTML TEMPLATE ---
const wrapHtml = (lang: string, title: string, bodyContent: string, actionUrl?: string, actionText?: string) => {
    // Default to EN if lang not found
    const txt = emailText[lang] || emailText['en'];
    const logoUrl = `${process.env.NEXT_PUBLIC_URL}/assets/images/logo-white.png`; // Make sure this image exists!

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; background-color: #F4F6F8; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background-color: #1F3A60; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
            .btn { display: inline-block; background-color: #F4B41A; color: #1F3A60; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 50px; margin-top: 25px; text-align: center; }
            .footer { background-color: #F4F6F8; padding: 20px; text-align: center; color: #8898aa; font-size: 12px; border-top: 1px solid #e0e0e0; }
            .link { color: #1F3A60; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="AfriqGig" height="35" style="display: block; margin: 0 auto;" />
            </div>
            <div class="content">
                <h2 style="color: #1F3A60; margin-top: 0;">${title}</h2>
                ${bodyContent}
                ${actionUrl ? `<div style="text-align: center;"><a href="${actionUrl}" class="btn">${actionText}</a></div>` : ''}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} AfriqGig. ${txt.footerText}</p>
                <p><a href="${process.env.NEXT_PUBLIC_URL}/dashboard/settings" class="link">${txt.managePrefs}</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// --- TEMPLATE DEFINITIONS ---
const templates = {
    WELCOME: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.welcomeSub,
            html: wrapHtml(lang, `${txt.hello} ${data.name}!`, `<p>${txt.welcomeBody}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/profile`, "Go to Dashboard")
        };
    },
    RESET_PASSWORD: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.resetSub,
            html: wrapHtml(lang, txt.resetTitle, `<p>${txt.resetBody}</p>`, data.resetUrl, txt.resetBtn)
        };
    },
    JOB_POSTED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.jobPostedSub,
            html: wrapHtml(lang, txt.jobPostedTitle, `<p>${txt.jobPostedBody(data.jobTitle)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/client/jobs`, txt.viewJob)
        };
    },
    NEW_PROPOSAL: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.proposalSub,
            html: wrapHtml(lang, txt.proposalTitle, `<p>${txt.proposalBody(data.freelancerName, data.jobTitle)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/client/jobs`, txt.reviewProposal)
        };
    },
    HIRED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.hiredSub,
            html: wrapHtml(lang, txt.hiredTitle, `<p>${txt.hiredBody(data.jobTitle)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/freelancer/active`, txt.viewContract)
        };
    },
    JOB_SUBMITTED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.submittedSub,
            html: wrapHtml(lang, txt.submittedTitle, `<p>${txt.submittedBody(data.freelancerName, data.jobTitle)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/client/jobs/${data.jobId}`, txt.reviewWork)
        };
    },
    PAYMENT_RELEASED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.approvedSub,
            html: wrapHtml(lang, txt.approvedTitle, `<p>${txt.approvedBody(data.jobTitle, data.amount)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/wallet`, txt.viewWallet)
        };
    },
    // --- FINANCIAL TEMPLATES ---
    DEPOSIT: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.depositSub,
            html: wrapHtml(lang, txt.depositTitle, `<p>${txt.depositBody(data.amount)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/wallet`, "View Wallet")
        };
    },
    WITHDRAWAL: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.withdrawSub,
            html: wrapHtml(lang, txt.withdrawTitle, `<p>${txt.withdrawBody(data.amount)}</p>`)
        };
    },
    WITHDRAWAL_APPROVED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.withdrawalApprovedSub,
            html: wrapHtml(lang, txt.withdrawalApprovedTitle, `<p>${txt.withdrawalApprovedBody(data.amount)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/wallet`, txt.viewWallet)
        };
    },
    DISPUTE_RESOLVED: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        return {
            subject: txt.disputeSub,
            html: wrapHtml(lang, txt.disputeTitle, `<p>${txt.disputeBody(data.jobTitle)}</p>`, `${process.env.NEXT_PUBLIC_URL}/dashboard/support`, txt.disputeBtn)
        };
    },
    VERIFY: (data: any, lang: string) => {
        const txt = emailText[lang] || emailText['en'];
        // You might want to add translations for "verifyEmail" in your emailText object if you support multi-lang emails fully
        // For now, hardcoding English fallback structure or adding keys:
        const verifyTitle = lang === 'fr' ? "Vérifiez votre e-mail" : "Verify your Email";
        const verifyBody = lang === 'fr' 
            ? `Merci de vous être inscrit ! Veuillez cliquer sur le bouton ci-dessous pour vérifier votre compte.`
            : `Thanks for signing up! Please click the button below to verify your account.`;
        const verifyBtn = lang === 'fr' ? "Vérifier l'e-mail" : "Verify Email";

        return {
            subject: verifyTitle,
            html: wrapHtml(lang, verifyTitle, `<p>${verifyBody}</p>`, data.link, verifyBtn)
        };
    },
};

// --- SENDING FUNCTION ---
export const sendEmail = async (
    to: string, 
    type: keyof typeof templates, 
    data: any, 
    userId?: string
) => {
    console.log(`📨 [Email Debug] Attempting to send '${type}' to ${to}...`);

    try {
        let userLang = "en";

        // 1. Fetch User Settings
        if (userId) {
            try {
                const user = await User.findById(userId);
                if (user) {
                    if (type !== 'RESET_PASSWORD' && user.settings?.notifications?.email === false) {
                        console.log(`🚫 [Email Debug] Skipped: User opted out.`);
                        return;
                    }
                    userLang = user.settings?.language || "en";
                }
            } catch (err) {
                console.error("⚠️ [Email Debug] Error fetching user settings:", err);
            }
        }

        // 2. Generate Content
        const template = templates[type](data, userLang);

        // 3. Verify Connection first (Debug Step)
        try {
            await transporter.verify();
            console.log("✅ [Email Debug] SMTP Connection established.");
        } catch (connError) {
            console.error("❌ [Email Debug] SMTP Connection Failed. Check BREVO_USER/PASS in .env", connError);
            return; 
        }

        // 4. Send
        const info = await transporter.sendMail({
            from: '"AfriqGig Notifications" <noreply@afriqgig.com>', // <--- MUST BE VERIFIED IN BREVO
            to,
            subject: template.subject,
            html: template.html,
        });

        console.log(`✅ [Email Debug] Email sent successfully! Message ID: ${info.messageId}`);
    } catch (error: any) {
        console.error("❌ [Email Debug] FATAL ERROR sending email:", error);
    }
};