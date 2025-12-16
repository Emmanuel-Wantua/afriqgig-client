export const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo (DRC)", "Congo (Republic)", "Cote d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Other"
];

// --- LEGACY CATEGORIES (For Signup Page) ---
export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Web, Mobile & Software Dev": [
    "Full Stack Development", "Frontend Development (React, Vue)", "Backend Development (Node, Python)", 
    "Mobile App Dev (iOS/Android)", "WordPress/CMS", "Game Development", "QA & Testing", 
    "Cybersecurity", "Blockchain/Web3", "DevOps & Cloud (AWS, Azure)"
  ],
  "Design, Media & Architecture": [
    "Logo & Brand Identity", "Graphic Design", "UI/UX Design", "Illustration", "Video Editing", 
    "Motion Graphics", "3D Modeling & Rendering", "Architectural Design (AutoCAD, Revit)", 
    "Interior Design", "Fashion Design", "Photography"
  ],
  "Writing & Translation": [
    "Translation (English/French)", "Translation (Swahili/Arabic)", "Content Writing", "Copywriting", 
    "Technical Writing", "Academic Writing", "Proofreading & Editing", "Scriptwriting", "Transcription", "Resume/CV Writing"
  ],
  "Digital Marketing & Sales": [
    "Social Media Management", "SEO (Search Engine Optimization)", "Facebook/Instagram Ads", 
    "Google Ads (PPC)", "Email Marketing", "Influencer Marketing", "Lead Generation", "Telemarketing"
  ],
  "Admin, Business & Data": [
    "Virtual Assistant", "Data Entry", "Data Analysis (Excel, SQL)", "Project Management", 
    "Accounting & Bookkeeping", "Financial Analysis", "HR & Recruiting", "Legal Consulting", "Customer Support"
  ],
  "Local & Trades (Vocational)": [
    "Plumbing", "Electrical Installation", "Carpentry & Furniture", "Painting & Decoration", 
    "Event Planning & Catering", "Makeup & Beauty", "Driver/Logistics", "Tutoring (Maths, Sciences)", "Language Tutoring"
  ]
};

export const CATEGORY_NAMES = Object.keys(SKILLS_BY_CATEGORY);

// --- SPECIFIC JOB CATEGORIES ---
export const SPECIFIC_JOB_CATEGORIES = [
    // Tech & Dev
    "Web Development", "Mobile App Development", "Software Engineering", "Frontend Development", "Backend Development",
    "Cybersecurity", "Data Science", "DevOps", "QA & Testing", "Blockchain", "Game Development", "WordPress Development",
    
    // Design & Creative
    "Graphic Design", "UI/UX Design", "Logo Design", "Illustration", "3D Modeling", "Animation", 
    "Fashion Design", "Interior Design", "Architecture", "Product Design", "Video Editing", "Photography",
    
    // Writing & Translation
    "Content Writing", "Copywriting", "Translation", "Transcription", "Proofreading", "Technical Writing", 
    "Creative Writing", "Ghostwriting", "Resume Writing",
    
    // Marketing & Sales
    "Digital Marketing", "Social Media Management", "SEO", "Email Marketing", "Public Relations", 
    "Lead Generation", "Telemarketing", "Market Research",
    
    // Admin & Business
    "Virtual Assistant", "Data Entry", "Project Management", "Accounting", "Legal Consulting", 
    "HR & Recruiting", "Business Analysis", "Customer Support",
    
    // Trades & Services
    "Plumbing", "Electrical Work", "Carpentry", "Painting", "Cleaning", "Driver", "Event Planning", 
    "Catering", "Makeup Artistry", "Tutoring"
];

// --- AUTO-SUGGEST MAP ---
export const AUTO_SUGGEST_MAP: Record<string, string> = {
    // Tech
    "react": "Frontend Development", "node": "Backend Development", "website": "Web Development", "web": "Web Development",
    "app": "Mobile App Development", "android": "Mobile App Development", "ios": "Mobile App Development", "flutter": "Mobile App Development",
    "software": "Software Engineering", "security": "Cybersecurity", "hack": "Cybersecurity", "data": "Data Science",
    "python": "Backend Development", "java": "Backend Development", "bug": "QA & Testing", "test": "QA & Testing",
    "game": "Game Development", "unity": "Game Development", "wordpress": "WordPress Development", "shopify": "Web Development",
    
    // Design
    "logo": "Logo Design", "brand": "Logo Design", "graphic": "Graphic Design", "flyer": "Graphic Design", "banner": "Graphic Design",
    "ui": "UI/UX Design", "ux": "UI/UX Design", "figma": "UI/UX Design", "interface": "UI/UX Design",
    "illustrat": "Illustration", "draw": "Illustration", "3d": "3D Modeling", "render": "3D Modeling", "cad": "Architecture",
    "architect": "Architecture", "plan": "Architecture", "interior": "Interior Design", "video": "Video Editing", "edit": "Video Editing",
    "photo": "Photography", "camera": "Photography", "animat": "Animation",
    
    // Writing
    "write": "Content Writing", "blog": "Content Writing", "article": "Content Writing", "copy": "Copywriting", "sales copy": "Copywriting",
    "translate": "Translation", "english": "Translation", "french": "Translation", "arabic": "Translation", "swahili": "Translation",
    "transcribe": "Transcription", "audio to text": "Transcription", "proof": "Proofreading", "edit text": "Proofreading",
    "resume": "Resume Writing", "cv": "Resume Writing",
    
    // Marketing
    "marketing": "Digital Marketing", "seo": "SEO", "rank": "SEO", "google": "SEO", "social media": "Social Media Management",
    "facebook": "Social Media Management", "instagram": "Social Media Management", "tiktok": "Social Media Management",
    "email": "Email Marketing", "newsletter": "Email Marketing", "lead": "Lead Generation", "sales": "Telemarketing", "call": "Telemarketing",
    
    // Admin
    "admin": "Virtual Assistant", "assistant": "Virtual Assistant", "entry": "Data Entry", "excel": "Data Entry", "spreadsheet": "Data Entry",
    "manage": "Project Management", "account": "Accounting", "tax": "Accounting", "finance": "Accounting",
    "legal": "Legal Consulting", "law": "Legal Consulting", "contract": "Legal Consulting", "support": "Customer Support",
    
    // Trades
    "plumb": "Plumbing", "pipe": "Plumbing", "water": "Plumbing", "electric": "Electrical Work", "wire": "Electrical Work",
    "wood": "Carpentry", "furniture": "Carpentry", "paint": "Painting", "wall": "Painting", "clean": "Cleaning", "house": "Cleaning",
    "drive": "Driver", "car": "Driver", "deliver": "Driver", "event": "Event Planning", "party": "Event Planning", "wedding": "Event Planning",
    "food": "Catering", "cook": "Catering", "makeup": "Makeup Artistry", "beauty": "Makeup Artistry", "tutor": "Tutoring", "teach": "Tutoring"
};

// --- MASTER SKILL LIST (De-duplicated) ---
const RAW_SKILL_LIST = [
    // --- TECH ---
    "React", "React Native", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express", "Django", "Flask", "Laravel", "Spring Boot",
    "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "Dart",
    "HTML", "CSS", "Tailwind CSS", "Bootstrap", "SASS",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "Supabase", "Redis",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "GitLab",
    "WordPress", "Shopify", "Webflow", "Bubble", "Wix", "Squarespace",
    "Machine Learning", "Artificial Intelligence", "Data Analysis", "Power BI", "Tableau", "Pandas",
    "Cybersecurity", "Penetration Testing", "Ethical Hacking",
    "Game Development", "Unity", "Unreal Engine", "C# Scripting",

    // --- DESIGN ---
    "Graphic Design", "Logo Design", "Brand Identity", "Illustration", "Digital Art",
    "UI Design", "UX Design", "Web Design", "Mobile App Design", "Wireframing", "Prototyping",
    "Figma", "Adobe XD", "Sketch", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign",
    "Video Editing", "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "Motion Graphics", "Animation",
    "3D Modeling", "Blender", "Maya", "Cinema 4D", "Rendering",
    "Architecture", "AutoCAD", "Revit", "SketchUp", "Interior Design", "Fashion Design",
    "Photography", "Photo Editing", "Retouching",

    // --- WRITING ---
    "Content Writing", "Copywriting", "SEO Writing", "Blog Writing", "Article Writing",
    "Technical Writing", "White Papers", "Case Studies",
    "Creative Writing", "Scriptwriting", "Ghostwriting", "Book Writing",
    "Editing", "Proofreading", "Resume Writing", "Cover Letter Writing",
    "Translation", "Transcription", "Subtitling",

    // --- MARKETING ---
    "Digital Marketing", "Social Media Marketing", "Content Marketing", "Email Marketing",
    "SEO", "SEM", "PPC", "Google Ads", "Facebook Ads", "Instagram Ads", "LinkedIn Ads",
    "Influencer Marketing", "Affiliate Marketing", "Public Relations", "Brand Management",
    "Market Research", "Lead Generation", "Sales", "Cold Calling", "Telemarketing",

    // --- BUSINESS & ADMIN ---
    "Virtual Assistant", "Data Entry", "Web Research", "Transcription", // Removed duplicate in Set below
    "Project Management", "Agile", "Scrum", "Product Management",
    "Accounting", "Bookkeeping", "QuickBooks", "Xero", "Tax Preparation", "Financial Analysis",
    "Legal Consulting", "Contract Drafting", "Paralegal Services",
    "HR Consulting", "Recruiting", "Talent Acquisition",
    "Customer Support", "Technical Support", "Chat Support",

    // --- TRADES & SERVICES ---
    "Plumbing", "Electrical Installation", "Electrical Repair",
    "Carpentry", "Furniture Assembly", "Cabinet Making",
    "Painting", "Drywall Repair", "Interior Decoration",
    "Cleaning", "House Cleaning", "Office Cleaning",
    "Driving", "Delivery", "Logistics",
    "Event Planning", "Wedding Planning", "Catering", "Cooking", "Baking",
    "Makeup Artistry", "Hair Styling", "Barbering",
    "Tutoring", "Math Tutoring", "English Tutoring", "French Tutoring", "Science Tutoring",
    "Fitness Training", "Yoga Instruction", "Personal Training",
    "Solar Installation", "AC Repair", "Fridge Repair"
];

// FIX: Automatically remove duplicates using Set
export const MASTER_SKILL_LIST = Array.from(new Set(RAW_SKILL_LIST)).sort();

export const SUGGESTED_SKILLS = MASTER_SKILL_LIST.slice(0, 20);

// --- COMMUNITY INTEREST TOPICS ---
export const INTEREST_TOPICS = [
    "Technology & Coding", "Design & Creativity", "Business & Startups", 
    "Freelancing Tips", "Remote Work Lifestyle", "Finance & Money",
    "Marketing & Growth", "Career Advice", "Mental Health & Wellness",
    "Events & Meetups", "Humor & Memes", "Showcase & Feedback"
];