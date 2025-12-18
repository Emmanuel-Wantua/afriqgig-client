// --- 1. GEOGRAPHY ---
export const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo (DRC)", "Congo (Republic)", "Cote d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Other"
];

// --- 2. MASSIVE FREELANCER SKILL DATABASE (2000+ Items) ---
export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Development & IT": [
    // Web Frontend
    "React.js", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "SvelteKit", "SolidJS", "Qwik", "Alpine.js", "Preact", "Ember.js", "Backbone.js", "jQuery", "HTML5", "CSS3", "SASS", "SCSS", "LESS", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Ant Design", "Bulma", "Foundation", "Semantic UI", "Styled Components", "Emotion", "WebGL", "Three.js", "D3.js", "Canvas API", "GSAP Animation", "Framer Motion", "LottieFiles", "Responsive Design", "PWA (Progressive Web Apps)", "Single Page Apps (SPA)", "Web Accessibility (WCAG)", "Micro-Frontends",
    // Web Backend
    "Node.js", "Express.js", "NestJS", "Fastify", "Koa", "Hapi.js", "Meteor.js", "Sails.js", "Deno", "Bun", "Python", "Django", "Flask", "FastAPI", "Pyramid", "Tornado", "Celery", "PHP", "Laravel", "Symfony", "CodeIgniter", "Yii", "CakePHP", "Zend", "Slim", "Wordpress Theme Dev", "WordPress Plugin Dev", "Java", "Spring Boot", "Jakarta EE", "Hibernate", "Struts", "Grails", "C#", ".NET Core", "ASP.NET", "Entity Framework", "Blazor", "Ruby", "Ruby on Rails", "Sinatra", "Hanami", "Go (Golang)", "Gin", "Echo", "Fiber", "Rust", "Rocket", "Actix", "Elixir", "Phoenix", "Erlang", "Scala", "Akka", "Play Framework", "Haskell", "Lua", "Perl", "Clojure",
    // Mobile
    "React Native", "Flutter", "iOS Development", "Swift", "SwiftUI", "Objective-C", "Xcode", "Android Development", "Kotlin", "Java for Android", "Jetpack Compose", "Android Studio", "Ionic", "Capacitor", "Cordova", "PhoneGap", "Xamarin", "Maui", "NativeScript", "Expo", "Realm Database", "Mobile UI Design", "App Store Optimization (ASO)", "TestFlight", "Google Play Console",
    // DevOps & Cloud
    "AWS (Amazon Web Services)", "AWS EC2", "AWS Lambda", "AWS S3", "AWS RDS", "AWS DynamoDB", "AWS CloudFormation", "Microsoft Azure", "Azure DevOps", "Azure Functions", "Azure AKS", "Google Cloud Platform (GCP)", "GCP Compute Engine", "GCP Cloud Functions", "GCP BigQuery", "Firebase", "Supabase", "Appwrite", "Heroku", "DigitalOcean", "Linode", "Vercel", "Netlify", "Docker", "Kubernetes", "Helm", "Terraform", "Ansible", "Chef", "Puppet", "Vagrant", "Jenkins", "GitLab CI/CD", "GitHub Actions", "CircleCI", "Travis CI", "Bamboo", "TeamCity", "ArgoCD", "Linux System Admin", "Bash Scripting", "PowerShell", "Nginx", "Apache", "Caddy", "Traefik", "HAProxy", "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk", "ELK Stack", "Nagios", "Zabbix",
    // Database
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MariaDB", "Oracle Database", "Microsoft SQL Server", "NoSQL", "MongoDB", "Cassandra", "CouchDB", "Couchbase", "DynamoDB", "Firestore", "Redis", "Memcached", "RabbitMQ", "Kafka", "Elasticsearch", "Solr", "Neo4j", "ArangoDB", "InfluxDB", "TimescaleDB", "Snowflake", "Redshift", "BigQuery", "PlanetScale", "Hasura", "Prisma", "TypeORM", "Sequelize", "Mongoose", "Knex.js",
    // Blockchain & Web3
    "Blockchain Development", "Smart Contracts", "Solidity", "Vyper", "Rust (Solana)", "Web3.js", "Ethers.js", "Hardhat", "Truffle", "Ganache", "Remix IDE", "IPFS", "Chainlink", "OpenZeppelin", "Ethereum", "Polygon", "Binance Smart Chain", "Solana", "Cardano", "Polkadot", "Cosmos", "Near Protocol", "Avalanche", "Tezos", "Algorand", "Flow", "Hyperledger", "NFT Development", "NFT Minting", "DeFi Development", "DApp Development", "Tokenomics", "Cryptography", "Zero Knowledge Proofs (ZK)", "DAO Governance",
    // AI & Data Science
    "Artificial Intelligence", "Machine Learning", "Deep Learning", "Neural Networks", "Natural Language Processing (NLP)", "Computer Vision", "Reinforcement Learning", "Generative AI", "Large Language Models (LLM)", "GPT-3/4 Integration", "OpenAI API", "LangChain", "LlamaIndex", "Hugging Face", "Stable Diffusion", "Midjourney API", "Prompt Engineering", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "XGBoost", "LightGBM", "CatBoost", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Plotly", "Jupyter Notebooks", "Data Analysis", "Data Visualization", "Data Engineering", "ETL Pipelines", "Apache Airflow", "Apache Spark", "Hadoop", "Databricks", "Tableau", "Power BI", "Looker", "Google Data Studio", "QlikView", "R Programming", "Julia", "SAS", "SPSS", "Matlab", "Web Scraping", "BeautifulSoup", "Selenium", "Puppeteer", "Scrapy",
    // QA & Cybersecurity
    "Manual Testing", "Automated Testing", "Cypress", "Playwright", "Appium", "Espresso", "XCUITest", "Jest", "Mocha", "Chai", "Jasmine", "Karma", "Enzyme", "React Testing Library", "JUnit", "TestNG", "PyTest", "RSpec", "Cucumber", "Postman", "SoapUI", "JMeter", "LoadRunner", "Gatling", "K6", "Performance Testing", "Security Testing", "Penetration Testing", "Ethical Hacking", "Cybersecurity Audit", "Information Security", "Network Security", "GDPR Compliance", "HIPAA Compliance", "SOC 2 Compliance", "OWASP Top 10", "Burp Suite", "Metasploit", "Wireshark", "Nmap"
  ],

  "Architecture & Engineering": [
    // Architecture
    "Architectural Design", "Building Plans", "Floor Plans", "2D Drafting", "3D Architectural Modeling", "Interior Design", "Exterior Design", "Landscape Architecture", "Urban Planning", "Site Planning", "BIM (Building Information Modeling)", "Sustainable Design", "Green Building", "Renovation Planning", "Retail Design", "Exhibition Booth Design", "Lighting Design", "Kitchen & Bath Design",
    // Civil & Structural
    "Civil Engineering", "Structural Engineering", "Structural Analysis", "Steel Structure Design", "Concrete Design", "Foundation Design", "Retaining Wall Design", "Bridge Design", "Roadway Design", "Drainage Design", "Stormwater Management", "Hydrology", "Geotechnical Engineering", "Surveying & Mapping", "Construction Management", "Estimation & Quantity Surveying", "MEP (Mechanical, Electrical, Plumbing)", "HVAC Design", "Fire Protection Engineering",
    // Mechanical & Industrial
    "Mechanical Engineering", "Product Design", "Industrial Design", "CAD Modeling", "CAM (Computer Aided Manufacturing)", "Finite Element Analysis (FEA)", "CFD Simulation", "Thermal Analysis", "Sheet Metal Design", "Injection Molding Design", "3D Printing Design", "Prototyping", "Reverse Engineering", "Robotics", "Mechatronics", "Automation Engineering", "Piping Design", "Manufacturing Process Design",
    // Electrical & Electronics
    "Electrical Engineering", "PCB Design", "Circuit Design", "Schematic Capture", "Firmware Development", "Embedded Systems", "Microcontrollers", "Arduino Programming", "Raspberry Pi", "FPGA", "VHDL/Verilog", "PLC Programming", "SCADA Systems", "IoT System Design", "Wireless Communication", "RF Engineering", "Power Systems Analysis", "Lighting Control Systems",
    // Tools
    "AutoCAD", "Revit", "SketchUp", "Archicad", "Rhino 3D", "Grasshopper", "Dynamo", "SolidWorks", "Fusion 360", "Inventor", "CATIA", "Creo", "Siemens NX", "Ansys", "Abaqus", "COMSOL", "Matlab/Simulink", "LabVIEW", "Altium Designer", "Eagle", "KiCad", "OrCAD", "Proteus", "ETABS", "SAP2000", "STAAD.Pro", "Robot Structural Analysis", "Tekla Structures", "Civil 3D", "MicroStation", "Lumion", "Twinmotion", "Enscape", "V-Ray", "Corona Renderer"
  ],

  "Design & Creative": [
    // Graphic Design
    "Graphic Design", "Logo Design", "Brand Identity", "Brand Guidelines", "Visual Identity", "Business Card Design", "Stationery Design", "Brochure Design", "Flyer Design", "Poster Design", "Menu Design", "Catalog Design", "Magazine Design", "Book Cover Design", "Album Cover Design", "Podcast Cover Art", "Merchandise Design", "T-Shirt Design", "Pattern Design", "Signage Design", "Billboard Design", "Vehicle Wrap Design", "Infographic Design", "Presentation Design", "PowerPoint Design", "Pitch Deck Design", "Resume Design", "CV Design", "Vector Art", "Vector Tracing", "Icon Design", "Favicon Design", "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "CorelDRAW", "Affinity Designer", "Canva Expert", "Inkscape",
    // UI/UX
    "UI Design", "UX Design", "Web Design", "Mobile App Design", "SaaS Product Design", "Dashboard Design", "Landing Page Design", "E-commerce Design", "Responsive Design", "Adaptive Design", "Material Design", "Human Interface Guidelines (iOS)", "Wireframing", "Prototyping", "User Research", "User Flows", "User Personas", "Customer Journey Maps", "Usability Testing", "A/B Testing", "Information Architecture", "Interaction Design", "Micro-interactions", "Design Systems", "Figma", "Adobe XD", "Sketch", "InVision", "Marvel", "Zeplin", "Principle", "Framer", "Origami Studio", "Webflow", "Balsamiq", "Axure RP",
    // Illustration & Art
    "Digital Illustration", "Vector Illustration", "Children's Book Illustration", "Comics", "Cartoons", "Caricature", "Portrait Drawing", "Concept Art", "Character Design", "Creature Design", "Environment Design", "Prop Design", "Storyboard", "Game Art", "Pixel Art", "Voxel Art", "NFT Art", "Crypto Art", "Generative Art", "Sketching", "Doodling", "Line Art", "Flat Design Illustration", "Isometric Illustration", "Watercolor Painting", "Oil Painting", "Acrylic Painting", "Digital Painting", "Procreate", "Clip Studio Paint", "Krita", "Paint Tool SAI", "Rebelle",
    // 3D & Animation
    "3D Modeling", "3D Rendering", "3D Animation", "3D Rigging", "3D Texturing", "3D Lighting", "3D Sculpting", "Hard Surface Modeling", "Organic Modeling", "Low Poly Modeling", "High Poly Modeling", "UV Mapping", "Retopology", "Game Assets", "Blender", "Maya", "3ds Max", "Cinema 4D", "ZBrush", "Substance Painter", "Substance Designer", "Mari", "Marmoset Toolbag", "V-Ray", "Corona Renderer", "Arnold", "Octane Render", "Redshift", "Lumion", "KeyShot", "Twinmotion", "Unreal Engine for ArchViz",
    // Video & Motion
    "Video Editing", "Video Production", "Video Post-Production", "Color Grading", "Color Correction", "Audio Syncing", "Sound Design for Video", "Subtitling", "Captioning", "Intro/Outro", "Logo Animation", "Motion Graphics", "Visual Effects (VFX)", "Green Screen Removal", "Rotoscoping", "Compositing", "Match Moving", "Tracking", "Cleanup", "Explainer Videos", "Whiteboard Animation", "2D Animation", "Character Animation", "Lottie Animation", "Stop Motion", "Short Video Ads", "Social Media Videos", "YouTube Editing", "Reels/TikTok Editing", "Corporate Videos", "Wedding Video Editing", "Travel Video Editing", "Gaming Highlights", "Montage Editing", "Adobe Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "Sony Vegas", "Camtasia", "Filmora", "CapCut", "Avid Media Composer", "Nuke", "Houdini"
  ],

  "Writing & Translation": [
    // Content Writing
    "Content Writing", "Blog Writing", "Article Writing", "Website Content", "SEO Writing", "Keyword Optimized Content", "Landing Page Content", "About Us Pages", "Services Pages", "Product Descriptions", "Category Descriptions", "Amazon Listings", "Shopify Listings", "Press Releases", "News Writing", "Journalism", "Guest Posting", "Listicles", "How-to Guides", "Tutorials", "FAQs", "Case Studies", "White Papers", "E-books", "Lead Magnets", "Email Newsletters", "Social Media Captions", "LinkedIn Posts", "Twitter Threads", "Facebook Posts", "Instagram Captions", "Pinterest Descriptions",
    // Copywriting
    "Copywriting", "Sales Copy", "Direct Response Copy", "Ad Copy", "Facebook Ads Copy", "Google Ads Copy", "Instagram Ads Copy", "LinkedIn Ads Copy", "Landing Page Copy", "Sales Funnel Copy", "Email Sequences", "Autoresponder Emails", "Cold Emails", "Brand Storytelling", "Slogans", "Taglines", "Mission Statements", "Vision Statements", "Value Propositions", "Elevator Pitch", "UX Writing", "Microcopy", "App Store Descriptions", "Video Scripts", "YouTube Scripts", "TikTok Scripts", "Podcast Scripts", "Webinar Scripts", "VSL Scripts", "Speech Writing", "Crowdfunding Pitch",
    // Technical & Academic
    "Technical Writing", "API Documentation", "SDK Documentation", "Code Documentation", "User Manuals", "Instruction Manuals", "Standard Operating Procedures (SOP)", "Employee Handbooks", "Training Materials", "Onboarding Guides", "Knowledge Base Articles", "Release Notes", "Grant Writing", "Research Proposals", "Research Papers", "Thesis Writing", "Dissertation", "Literature Review", "Statistical Analysis Report", "Medical Writing", "Health Articles", "Clinical Trial Reports", "Regulatory Writing", "Legal Writing", "Contracts", "Terms & Conditions", "Privacy Policies", "Patent Applications", "Business Plans", "Business Proposals", "Feasibility Studies",
    // Creative Writing
    "Creative Writing", "Short Stories", "Novels", "Fiction Writing", "Non-Fiction Writing", "Poetry", "Songwriting", "Lyrics", "Screenwriting", "Playwriting", "Interactive Fiction", "Game Writing", "Lore Writing", "World Building", "Character Development", "Dialogue Writing", "Ghostwriting", "Memoir Writing", "Biography", "Autobiography", "Children's Stories", "Comics Scripts", "Manga Scripts",
    // Editing & Proofreading
    "Proofreading", "Copy Editing", "Line Editing", "Developmental Editing", "Structural Editing", "Content Editing", "Fact Checking", "Plagiarism Checking", "AI Content Editing", "Humanizing AI Text", "Formatting", "Layout Design", "Indexing", "Citation (APA, MLA, Chicago, Harvard)", "Beta Reading", "Critique Partner",
    // Translation
    "Translation (English ↔ French)", "Translation (English ↔ Spanish)", "Translation (English ↔ Arabic)", "Translation (English ↔ German)", "Translation (English ↔ Chinese)", "Translation (English ↔ Japanese)", "Translation (English ↔ Portuguese)", "Translation (English ↔ Russian)", "Translation (English ↔ Italian)", "Translation (English ↔ Swahili)", "Translation (English ↔ Hindi)", "Translation (English ↔ Dutch)", "Translation (English ↔ Turkish)", "Translation (English ↔ Korean)", "Translation (English ↔ Polish)", "Translation (English ↔ Vietnamese)", "Translation (English ↔ Thai)", "Translation (English ↔ Greek)", "Translation (English ↔ Hebrew)", "Localization", "Website Localization", "App Localization", "Game Localization", "Software Localization", "Transcreation", "Interpretation", "Remote Interpretation", "Transcription", "Audio Transcription", "Video Transcription", "Legal Translation", "Medical Translation", "Technical Translation", "Financial Translation", "Literary Translation", "Certified Translation", "Subtitling", "Closed Captioning"
  ],

  "Marketing & Sales": [
    // Digital Marketing
    "Digital Marketing Strategy", "Marketing Consultancy", "Brand Strategy", "Go-to-Market Strategy", "Growth Hacking", "Inbound Marketing", "Outbound Marketing", "Performance Marketing", "Marketing Automation", "CRM Management", "HubSpot", "Salesforce", "Marketo", "Zoho CRM", "ActiveCampaign", "Mailchimp", "Klaviyo", "ConvertKit", "Brevo", "A/B Testing", "Conversion Rate Optimization (CRO)", "Funnel Building", "ClickFunnels", "GoHighLevel", "Kartra", "Kajabi", "Lead Generation", "Demand Generation", "Account-Based Marketing (ABM)",
    // Social Media
    "Social Media Marketing", "Social Media Management", "Social Media Strategy", "Community Management", "Facebook Marketing", "Instagram Marketing", "Twitter/X Marketing", "LinkedIn Marketing", "TikTok Marketing", "Pinterest Marketing", "YouTube Marketing", "Snapchat Marketing", "Reddit Marketing", "Discord Management", "Telegram Management", "Influencer Marketing", "Micro-Influencer Marketing", "UGC (User Generated Content)", "Social Media Analytics", "Social Listening", "Viral Marketing", "Meme Marketing",
    // Paid Ads (PPC)
    "PPC (Pay Per Click)", "Search Engine Marketing (SEM)", "Google Ads", "Google Shopping", "YouTube Ads", "Display Advertising", "Facebook Ads", "Instagram Ads", "LinkedIn Ads", "Twitter Ads", "TikTok Ads", "Pinterest Ads", "Snapchat Ads", "Amazon PPC", "Bing Ads", "Retargeting", "Remarketing", "Programmatic Advertising", "Media Buying", "Ad Creatives", "Ad Copywriting", "Pixel Setup", "Conversion Tracking",
    // SEO
    "SEO (Search Engine Optimization)", "On-Page SEO", "Off-Page SEO", "Technical SEO", "Local SEO", "Google My Business", "Keyword Research", "Competitor Analysis", "Backlink Building", "Link Outreach", "Guest Blogging", "Content Strategy", "SEO Audits", "Google Search Console", "Google Analytics", "GA4", "Google Tag Manager", "Schema Markup", "Voice Search Optimization", "App Store Optimization (ASO)", "Shopify SEO", "WordPress SEO", "YouTube SEO",
    // Sales
    "Sales Strategy", "Business Development", "Telemarketing", "Cold Calling", "Appointment Setting", "Lead Qualification", "Sales Closing", "High Ticket Sales", "B2B Sales", "B2C Sales", "Real Estate Sales", "SaaS Sales", "Medical Sales", "Insurance Sales", "Sales Scripting", "Email Outreach", "LinkedIn Outreach", "Cold Emailing", "Sales Management", "Account Management", "Customer Success", "Sales Operations", "Sales Funnel Optimization"
  ],

  "Admin & Business": [
    // Admin Support
    "Virtual Assistant", "Executive Assistant", "Personal Assistant", "Admin Support", "Office Management", "Data Entry", "Data Mining", "Data Scraping", "Web Research", "Market Research", "Product Research", "Amazon Product Research", "List Building", "Calendar Management", "Email Management", "Travel Planning", "Event Planning (Virtual)", "Project Coordination", "File Management", "Transcription", "Minutes Taking", "PDF Conversion", "Word Processing", "Spreadsheet Management",
    // Project Management
    "Project Management", "Agile Management", "Scrum Master", "Kanban", "Waterfall", "Six Sigma", "PMP", "Product Management", "Product Roadmapping", "Business Analysis", "Requirements Gathering", "Operations Management", "Process Improvement", "Supply Chain Management", "Logistics Coordination", "Inventory Management", "Order Processing", "Jira", "Trello", "Asana", "Monday.com", "ClickUp", "Notion", "Airtable", "Basecamp",
    // Customer Support
    "Customer Support", "Technical Support", "Live Chat Support", "Email Support", "Phone Support", "Help Desk", "Ticket Handling", "Zendesk", "Intercom", "Freshdesk", "Salesforce Service Cloud", "Community Moderation", "Social Media Support", "Refund Processing", "Dispute Resolution", "Customer Retention", "Customer Satisfaction (CSAT)",
    // Finance
    "Accounting", "Bookkeeping", "QuickBooks", "Xero", "FreshBooks", "Wave", "Zoho Books", "Sage", "Financial Analysis", "Financial Modeling", "Financial Forecasting", "Budgeting", "Cash Flow Management", "Tax Preparation", "VAT Returns", "Payroll Management", "Invoicing", "Accounts Payable", "Accounts Receivable", "Bank Reconciliation", "CFO Services", "Investment Analysis", "Stock Market Analysis", "Crypto Trading", "Forex Trading", "Excel Expert", "VBA Macros",
    // HR & Legal
    "Human Resources", "Recruiting", "Talent Acquisition", "Technical Recruiting", "Executive Search", "Headhunting", "Sourcing", "Screening", "Interviewing", "Employee Onboarding", "Employee Relations", "Performance Management", "Compensation & Benefits", "HR Policy", "Diversity & Inclusion", "Career Coaching", "Resume Review", "LinkedIn Profile Optimization", "Legal Consulting", "Contract Law", "Corporate Law", "Employment Law", "Intellectual Property", "Trademark Registration", "Patent Search", "Paralegal Services", "Legal Research", "Legal Drafting", "GDPR Compliance", "Compliance Management"
  ],

  "Audio & Music": [
    "Audio Editing", "Audio Mixing", "Audio Mastering", "Sound Design", "Foley Artist", "Podcast Editing", "Podcast Production", "Music Production", "Beat Making", "Composition", "Arrangement", "Jingle Writing", "Songwriting", "Lyrics Writing", "Vocal Tuning", "Melodyne", "Auto-Tune", "Audio Restoration", "Noise Reduction", "Dialogue Editing", "Audiobook Production", "Logic Pro", "Pro Tools", "Ableton Live", "FL Studio", "Cubase", "Studio One", "Audacity", "Adobe Audition", "Voice Over", "Voice Acting", "Narration", "Commercials", "E-learning Voice", "Video Game Voice", "Animation Voice", "Dubbing", "Character Voices", "Impressions", "Phone Systems (IVR)", "Radio Imaging", "Podcast Intro/Outro", "Meditations", "Male Voice", "Female Voice", "British Accent", "American Accent", "Australian Accent", "African Accent", "French Voice Over", "Spanish Voice Over", "Arabic Voice Over", "Singer (Male)", "Singer (Female)", "Rapper", "Session Musician", "Guitar", "Piano", "Drums", "Violin", "Bass", "Music Transcription", "Sheet Music"
  ],

  "Education & Coaching": [
    "Tutoring (Math)", "Tutoring (Algebra)", "Tutoring (Calculus)", "Tutoring (Statistics)", "Tutoring (Geometry)", "Tutoring (English)", "Tutoring (Science)", "Tutoring (Physics)", "Tutoring (Chemistry)", "Tutoring (Biology)", "History Tutoring", "Geography Tutoring", "Economics Tutoring", "Accounting Tutoring", "Coding Tutoring", "Python Tutoring", "Java Tutoring", "Web Dev Tutoring", "Music Lessons", "Guitar Lessons", "Piano Lessons", "Singing Lessons", "Art Lessons", "Drawing Lessons", "Painting Lessons", "Language Tutoring", "ESL/EFL", "TEFL", "TOEFL Prep", "IELTS Prep", "SAT/ACT Prep", "GRE/GMAT Prep",
    "Life Coaching", "Career Coaching", "Executive Coaching", "Business Coaching", "Leadership Coaching", "Relationship Coaching", "Dating Coaching", "Spiritual Coaching", "Fitness Training (Remote)", "Personal Training", "Yoga Instruction", "Meditation Guide", "Nutrition Consulting", "Meal Planning", "Wellness Coaching", "Mental Health Coaching", "Financial Coaching", "Parenting Coaching", "Public Speaking Coaching", "Instructional Design", "Curriculum Development", "E-learning Development", "LMS Management", "Course Creation", "Udemy Course Creation", "Teachable", "Kajabi", "Thinkific"
  ]
};

export const CATEGORY_NAMES = Object.keys(SKILLS_BY_CATEGORY);

// --- 3. FLATTENED LIST (For Autocomplete) ---
export const MASTER_SKILL_LIST = Array.from(new Set(
  Object.values(SKILLS_BY_CATEGORY).flat()
)).sort();

export const SUGGESTED_SKILLS = MASTER_SKILL_LIST.slice(0, 20);

// --- 4. SPECIFIC JOB CATEGORIES (Consolidated for Dropdowns) ---
// This list MUST cover every major niche from the Master List above.
export const SPECIFIC_JOB_CATEGORIES = [
  // Tech & Dev
  "Web Development", "Mobile App Development", "Software Engineering", "Game Development", 
  "DevOps & Cloud", "Cybersecurity", "Blockchain & Web3", "Data Science & Analytics", "AI & Machine Learning",
  "QA & Testing", "Database Administration", "System Architecture",

  // Design & Creative
  "Graphic Design", "UI/UX Design", "Motion Graphics", "Video Editing", "Illustration", 
  "3D Modeling & Rendering", "Photography (Editing)", "Brand Identity", "Product Design", 
  "Fashion Design", "Interior Design",

  // Architecture & Engineering (✅ NEWLY ADDED)
  "Architectural Design", "Civil Engineering", "Structural Engineering", "Mechanical Engineering", 
  "Electrical Engineering", "CAD Drafting", "Landscape Design", "Urban Planning", 
  "BIM Modeling", "Industrial Design",

  // Writing & Translation
  "Content Writing", "Copywriting", "Technical Writing", "Translation", "Transcription", 
  "Editing & Proofreading", "Scriptwriting", "Ghostwriting", "Grant Writing", 
  "Resume & CV Writing", "Creative Writing",

  // Marketing & Sales
  "Digital Marketing", "Social Media Management", "SEO", "SEM/PPC", "Email Marketing", 
  "Public Relations", "Affiliate Marketing", "Lead Generation", "Telemarketing", 
  "Market Research", "Sales Strategy", "Influencer Marketing",

  // Admin & Business
  "Virtual Assistant", "Data Entry", "Project Management", "Customer Support", 
  "Accounting & Finance", "HR & Recruiting", "Legal Consulting", "Business Analysis", 
  "Supply Chain & Logistics", "Executive Assistance",

  // Audio & Music
  "Voice Over", "Audio Production", "Music Composition", "Podcast Production", "Sound Design",

  // Education & Coaching
  "Tutoring", "Coaching", "Consulting", "Research", "Corporate Training", "Life Coaching"
].sort();

// --- 5. SMART KEYWORD MATCHER (The "10 Keywords" Logic) ---
// This function dynamically checks input against 1000s of permutations.
export const getSuggestedCategory = (input: string): string => {
  const lower = input.toLowerCase().trim();
  if (!lower) return "";

  // Helper to match any word
  const matches = (keywords: string[]) => keywords.some(k => lower.includes(k));

  // --- ARCHITECTURE & ENGINEERING (✅ NEW LOGIC) ---
  if (matches(["architect", "building plan", "floor plan", "revit", "autocad", "blueprint", "interior design", "exterior", "landscape", "bim", "sketchup", "lumion", "render house"])) return "Architectural Design";
  if (matches(["civil", "structural", "concrete", "steel", "bridge", "road", "construction plan", "surveying", "estimation", "quantity survey"])) return "Civil Engineering";
  if (matches(["structure", "beam", "column", "load analysis", "foundation", "retaining wall"])) return "Structural Engineering";
  if (matches(["mechanical", "solidworks", "catia", "ansys", "fea", "cfd", "hvac", "piping", "machinery", "robotics", "mechatronics"])) return "Mechanical Engineering";
  if (matches(["electrical", "pcb", "circuit", "schematic", "altium", "arduino", "raspberry pi", "firmware", "embedded", "plc", "scada"])) return "Electrical Engineering";
  if (matches(["cad", "drafting", "drawing", "2d", "3d model", "technical drawing"])) return "CAD Drafting";

  // --- TECH ---
  if (matches(["react", "vue", "angular", "node", "javascript", "typescript", "html", "css", "frontend", "backend", "full stack", "web", "site", "wordpress", "php", "python", "java", "code", "script", "api", "database", "sql"])) return "Web Development";
  if (matches(["ios", "android", "flutter", "react native", "swift", "kotlin", "mobile", "app", "phone", "ipad", "tablet", "apk"])) return "Mobile App Development";
  if (matches(["game", "unity", "unreal", "godot", "c#", "c++", "3d game", "2d game", "level", "play"])) return "Game Development";
  if (matches(["aws", "cloud", "azure", "docker", "kubernetes", "devops", "linux", "server", "deploy", "ci/cd", "pipeline", "sysadmin"])) return "DevOps & Cloud";
  if (matches(["security", "hack", "cyber", "penetration", "protect", "malware", "virus", "firewall", "encrypt", "audit", "infosec"])) return "Cybersecurity";
  if (matches(["blockchain", "crypto", "nft", "smart contract", "solidity", "web3", "ethereum", "bitcoin", "token", "wallet", "defi"])) return "Blockchain & Web3";
  if (matches(["data", "analyze", "analytics", "statistics", "excel", "tableau", "power bi", "visualiz", "science", "scrape", "mining", "big data"])) return "Data Science & Analytics";
  if (matches(["ai", "machine learning", "neural", "deep learning", "gpt", "robot", "bot", "chatgpt", "nlp", "vision", "model", "llm"])) return "AI & Machine Learning";
  if (matches(["qa", "test", "quality", "selenium", "cypress", "bug", "manual testing", "automation"])) return "QA & Testing";

  // --- DESIGN ---
  if (matches(["logo", "brand", "identity", "flyer", "poster", "banner", "card", "print", "vector", "illustrat", "draw", "art", "sketch"])) return "Graphic Design";
  if (matches(["ui", "ux", "interface", "experience", "figma", "adobe xd", "wireframe", "prototype", "app design", "web design", "usability"])) return "UI/UX Design";
  if (matches(["video", "edit", "premiere", "cut", "film", "movie", "youtube", "tiktok", "reel", "montage", "production", "davinci", "after effects"])) return "Video Editing";
  if (matches(["animation", "motion", "effects", "vfx", "transition", "gif", "lottie"])) return "Motion Graphics";
  if (matches(["3d", "model", "render", "blender", "maya", "cinema 4d", "sculpt", "mesh", "texture", "zbrush"])) return "3D Modeling & Rendering";
  if (matches(["photo", "retouch", "image", "photoshop", "lightroom", "color correct", "remove background", "picture"])) return "Photography (Editing)";
  if (matches(["fashion", "clothing", "apparel", "textile", "pattern", "sewing pattern"])) return "Fashion Design";

  // --- WRITING ---
  if (matches(["write", "article", "blog", "post", "content", "news", "story", "book", "ebook", "ghost"])) return "Content Writing";
  if (matches(["copy", "sales", "ad text", "slogan", "tagline", "persuade", "marketing text", "landing page"])) return "Copywriting";
  if (matches(["technical", "manual", "guide", "documentation", "white paper", "report", "sop", "api docs"])) return "Technical Writing";
  if (matches(["translate", "language", "english", "french", "spanish", "arabic", "german", "interpret", "localize"])) return "Translation";
  if (matches(["transcribe", "audio to text", "caption", "subtitle", "type audio"])) return "Transcription";
  if (matches(["proof", "edit", "grammar", "check", "correct", "revise", "polish", "syntax"])) return "Editing & Proofreading";
  if (matches(["resume", "cv", "cover letter", "linkedin profile"])) return "Resume & CV Writing";
  if (matches(["script", "screenplay", "movie script", "video script"])) return "Scriptwriting";

  // --- MARKETING ---
  if (matches(["social", "media", "facebook", "instagram", "twitter", "linkedin", "tiktok", "post management", "community"])) return "Social Media Management";
  if (matches(["seo", "search", "rank", "google", "keyword", "traffic", "optimize", "backlink", "audit"])) return "SEO";
  if (matches(["ad", "ppc", "pay per click", "campaign", "sem", "google ads", "facebook ads", "promote"])) return "SEM/PPC";
  if (matches(["email", "newsletter", "mailchimp", "campaign", "autoresponder", "blast", "crm"])) return "Email Marketing";
  if (matches(["pr", "public relations", "press", "media kit", "outreach"])) return "Public Relations";
  if (matches(["lead", "prospect", "list building", "b2b"])) return "Lead Generation";

  // --- ADMIN ---
  if (matches(["admin", "assistant", "virtual", "support", "schedule", "calendar", "organize", "executive"])) return "Virtual Assistant";
  if (matches(["data entry", "type", "spreadsheet", "excel", "input", "database", "record"])) return "Data Entry";
  if (matches(["project", "manage", "lead", "agile", "scrum", "coordinate", "plan", "roadmap"])) return "Project Management";
  if (matches(["customer", "support", "help", "service", "chat", "desk", "ticket", "call center"])) return "Customer Support";
  if (matches(["account", "bookkeep", "finance", "tax", "audit", "payroll", "quickbooks", "invoice"])) return "Accounting & Finance";
  if (matches(["hr", "recruit", "talent", "hire", "sourcing", "interview", "onboard"])) return "HR & Recruiting";
  if (matches(["legal", "law", "contract", "agreement", "patent", "compliance", "paralegal"])) return "Legal Consulting";

  // --- AUDIO ---
  if (matches(["voice", "narrator", "actor", "audiobook", "dub", "speak", "read"])) return "Voice Over";
  if (matches(["audio", "sound", "mix", "master", "music", "podcast", "edit sound", "beat"])) return "Audio Production";

  return "";
};

// --- DUMMY EXPORT TO KEEP OLD CODE WORKING ---
export const AUTO_SUGGEST_MAP: Record<string, string> = {};

// --- COMMUNITY INTEREST TOPICS ---
export const INTEREST_TOPICS = [
  "Technology & Coding", "Design & Creativity", "Business & Startups", 
  "Freelancing Tips", "Remote Work Lifestyle", "Finance & Money",
  "Marketing & Growth", "Career Advice", "Mental Health & Wellness",
  "Events & Meetups", "Humor & Memes", "Showcase & Feedback", "AI & Tools"
];