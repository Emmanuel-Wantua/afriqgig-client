export const uploadToCloudinary = async (file: File, mode: "compress" | "raw" = "compress") => {
  const cloudName = "dt5hhcu9s"; 
  
  // 1. Define Presets
  // 'afriqgig_uploads' is your existing one (Use this for "raw" / Deliverables)
  // 'afriqgig_compress' is the NEW one you created for optimization
  const RAW_PRESET = "afriqgig_uploads";
  const COMPRESS_PRESET = "afriqgig_compress";

  const formData = new FormData();
  formData.append("file", file);
  
  // 2. Select Preset based on Mode
  // Default is "compress" to save storage on Community/Jobs
  const preset = mode === "raw" ? RAW_PRESET : COMPRESS_PRESET;
  formData.append("upload_preset", preset);

  try {
    // 'auto' resource type automatically detects Video, Audio, or Image
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    return data.secure_url; 
  } catch (error) {
    console.error("Cloudinary Error:", error);
    return null;
  }
};