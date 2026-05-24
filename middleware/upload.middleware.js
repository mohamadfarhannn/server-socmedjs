import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    return cb(new Error("Invalid file type! Only JPG, JPEG, PNG are allowed"), false)
  }

  cb(null, true)
}

const upload = multer({
  storage, fileFilter
})

export default upload