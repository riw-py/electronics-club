const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
};

const createStorage = (subFolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', subFolder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const imageFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.image.includes(file.mimetype)) cb(null, true);
  else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
};

const documentFilter = (req, file, cb) => {
  const all = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];
  if (all.includes(file.mimetype)) cb(null, true);
  else cb(new Error('ประเภทไฟล์ไม่รองรับ'), false);
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

const uploadNewsImage   = multer({ storage: createStorage('news'),      fileFilter: imageFilter,    limits: { fileSize: MAX_SIZE } });
const uploadDocument    = multer({ storage: createStorage('documents'), fileFilter: documentFilter, limits: { fileSize: MAX_SIZE } });
const uploadAvatar      = multer({ storage: createStorage('avatars'),   fileFilter: imageFilter,    limits: { fileSize: 2 * 1024 * 1024 } });
const uploadProjectFile = multer({ storage: createStorage('projects'),  fileFilter: documentFilter, limits: { fileSize: MAX_SIZE } });
const uploadGarbage     = multer({ storage: createStorage('garbage'),   fileFilter: imageFilter,    limits: { fileSize: MAX_SIZE } });

module.exports = { uploadNewsImage, uploadDocument, uploadAvatar, uploadProjectFile, uploadGarbage };
