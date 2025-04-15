const multer = require('multer');

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log(file)
    const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error("Invalid file format. Only images, PDFs, and Word documents are allowed."), false);
    }
};

const upload = multer({
    storage: memoryStorage,
    fileFilter
});

module.exports = upload;
