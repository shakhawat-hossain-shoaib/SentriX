/**
 * Multer File Upload Middleware for Incident Evidence
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, logs, txt, zip, eml, msg
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|txt|log|eml|msg|json|csv|zip|pcap)$/i;
  if (allowedExtensions.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    // For dangerous executable files, we still allow them in quarantine with warning or restrict
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter
});

module.exports = upload;
