import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary and optionally delete an old file.
 * @param {string} localfilePath - Path to the local file to upload.
 * @param {string} [oldFileUrl] - URL of the old file to delete.
 * @returns {object|null} Response from Cloudinary or null if an error occurs.
 */
const uploadFileToCloudinary = async (localfilePath, oldFileUrl = null) => {
  try {
    if (!localfilePath) return null;

    // Upload the new file to Cloudinary
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    console.log(`File uploaded successfully: ${response.url}`);

    // Delete the local file after uploading
    fs.unlinkSync(localfilePath);

    // If an old file URL is provided, delete it from Cloudinary
    if (oldFileUrl) {
      const publicId = oldFileUrl.split("/").pop().split(".")[0]; // Extract public ID
      const deleteResponse = await cloudinary.uploader.destroy(publicId);
      if (deleteResponse.result === "ok") {
        console.log(`Old file deleted successfully: ${oldFileUrl}`);
      } else {
        console.warn(`Failed to delete old file: ${oldFileUrl}`);
      }
    }

    return response;
  } catch (error) {
    console.error("Error during file upload:", error);

    // Ensure the local file is deleted even if the upload fails
    if (fs.existsSync(localfilePath)) {
      fs.unlinkSync(localfilePath);
    }

    return null;
  }
};

export { uploadFileToCloudinary };
