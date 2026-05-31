import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const emailConfig = {
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// For Mailtrap or custom SMTP
if (process.env.SMTP_HOST) {
  emailConfig.host = process.env.SMTP_HOST;
  emailConfig.port = process.env.SMTP_PORT || 587;
  emailConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  };
  delete emailConfig.service;
}

const transporter = nodemailer.createTransport(emailConfig);

export default transporter;
