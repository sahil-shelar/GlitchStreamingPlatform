import { v2 as cloudinary } from "cloudinary";
import { configDotenv } from "dotenv";
import fs from "fs";

configDotenv();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw error;
    }
}

const deleteOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        //delete file from cloudinary
        await cloudinary.uploader.destroy(localFilePath, {
                resource_type:"auto"
            });
        
    } catch (error) {
        console.log("delete on cloudinary failed", error);
    }
};

export {uploadOnCloudinary, deleteOnCloudinary}