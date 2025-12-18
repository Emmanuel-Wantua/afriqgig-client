export const uploadToCloudinary = async (file: File, mode: "compress" | "raw" = "compress") => {
  const cloudName = "dt5hhcu9s"; 
  
  // Define Presets
  const RAW_PRESET = "afriqgig_uploads";
  const COMPRESS_PRESET = "afriqgig_compress";

  // Select Preset
  const preset = mode === "raw" ? RAW_PRESET : COMPRESS_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  // Debugging Log (Check console to see if file is valid)
  console.log(`[Cloudinary] Uploading ${file.name} (${file.type}) to ${cloudName} using preset ${preset}`);

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