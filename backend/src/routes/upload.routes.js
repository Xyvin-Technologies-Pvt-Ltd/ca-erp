const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const response_handler = (res, status, message, data) => {
  res.status(status).json({
    success: status >= 200 && status < 300,
    message,
    data,
  });
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer(); // store files in memory

const router = express.Router();
// Single file upload
router.post("/single", upload.single("file"), async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      //   ACL: "public-read",
    };

    await s3Client.send(new PutObjectCommand(params));

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

    return response_handler(res, 200, "File uploaded successfully", {
      fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return response_handler(res, 500, "Error uploading file", {
      error: error.message,
    });
  }
});

module.exports = router; 