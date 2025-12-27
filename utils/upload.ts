export const uploadToCloudinary = async (file: File, mode: "raw" | "compress" = "compress") => {
  const cloudName = "dt5hhcu9s"; 
  
  // Define Presets
  const RAW_PRESET = "afriqgig_uploads";
  const COMPRESS_PRESET = "afriqgig_compress";

  // Select Preset
  const preset = mode === "raw" ? RAW_PRESET : COMPRESS_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  // ✅ FIX: Manually generate a readable 'public_id' instead of using 'use_filename'
  // 1. Remove extension from name (e.g. "my-logo.png" -> "my-logo")
  const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  // 2. Sanitize (replace spaces/special chars with underscores)
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
  // 3. Add timestamp for uniqueness
  const publicId = `${cleanName}_${Date.now()}`;

  formData.append("public_id", publicId); 

  // Debugging Log
  console.log(`[Cloudinary] Uploading ${file.name} as ${publicId} to ${cloudName}`);

  try {
    // Explicitly use "auto" to let Cloudinary decide if it's image/video/raw
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("[Cloudinary] Upload Failed Details:", errorData);
        throw new Error(errorData.error?.message || "Upload failed");
    }

    const data = await res.json();
    console.log("[Cloudinary] Upload Success:", data.secure_url);
    return data.secure_url; 
  } catch (error) {
    console.error("[Cloudinary] Network/Logic Error:", error);
    return null;
  }
};