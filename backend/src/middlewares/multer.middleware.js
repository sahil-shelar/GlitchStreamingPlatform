import multer from "multer";

// Configure storage settings for multer
const storage = multer.diskStorage({
    // Define the destination directory for uploaded files
    destination: function (req, file, cb) {
        // Save files in the "public/temp" directory
        cb(null,"./public/temp");
    },
    // Define the filename for uploaded files
    filename: function (req, file, cb) {
        // Use the original filename of the uploaded file
        cb(null, file.originalname);
        // Alternatively, you could generate a unique filename using a timestamp and random number:
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create an upload middleware with the configured storage settings
export const upload = multer({ storage });
