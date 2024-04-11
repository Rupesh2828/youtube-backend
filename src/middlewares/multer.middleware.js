import multer from "multer";

const storage = multer.diskStorage({
    destination: function (___, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        //same filename can be saved so change for FUTURE
        cb(null, file.originalname);
        console.log(file);
    },
});

export const upload = multer({ storage });
