import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("SMTP Verify Error:", err);
  } else {
    console.log("SMTP connected successfully");
  }
});

export default transporter;
