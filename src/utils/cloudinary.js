import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // console.log("File has been uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        //this is for removing temp files from local saved as the upload operation got failed.

        fs.unlinkSync(localFilePath)
        return null

    }
};

const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;
  
        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        return error;
        
    }
  }

export {uploadOnCloudinary,deleteOnCloudinary}