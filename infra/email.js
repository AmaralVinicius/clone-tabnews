import nodemailer from "nodemailer";
import { ServiceError } from "./errors.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});

async function send({ from, to, subject, text }) {
  try {
    await transporter.sendMail({ from, to, subject, text });
  } catch (error) {
    throw new ServiceError({
      message: "An error occurred while sending the email.",
      action: "Check if the email service is available",
      cause: error,
      context: { from, to, subject, text },
    });
  }
}

const email = {
  send,
};

export default email;
