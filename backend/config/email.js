import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "Resend API key not found. Set RESEND_API_KEY in backend/.env or environment."
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "onboarding@resend.dev";

export default resend;
