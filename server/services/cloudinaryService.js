import { v2 as cloudinary } from "cloudinary";


export const uploadToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "docflow/resumes",
                public_id: originalName.replace(/\.[^/.]+$/, ""),
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

export const deleteFromCloudinary = (publicId) => {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
    });
};