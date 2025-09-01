const express = require("express");
const { body, validationResult } = require("express-validator");
const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

// POST /api/contact
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("company").optional().trim(),
    body("message").trim().isLength({ min: 5 }).withMessage("Message too short"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      // Save to MongoDB
      const saved = await Contact.create(req.body);
      console.log("Data successfully saved to MongoDB.");

      // Create transporter for emails
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Admin email
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: `New Contact Form Submission from ${req.body.name}`,
          html: `
            <h3>New message from your portfolio website!</h3>
            <p><strong>Name:</strong> ${req.body.name}</p>
            <p><strong>Email:</strong> ${req.body.email}</p>
            <p><strong>Company:</strong> ${req.body.company}</p>
            <p><strong>Message:</strong> ${req.body.message}</p>
          `,
        });
        console.log("Admin email sent successfully!");
      } catch (adminEmailError) {
        console.error("Error sending admin email:", adminEmailError.message);
      }

      // User auto-response email
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: req.body.email,
          subject: `Thank you for your message, ${req.body.name}!`,
          html: `
            <p>Dear ${req.body.name},</p>
            <p>Thank you for reaching out! Your message has been received, and we will get back to you within 48 hours.</p>
            <p>Best regards,<br>SVG</p>
          `,
        });
        console.log("User auto-response email sent successfully!");
      } catch (userEmailError) {
        console.error("Error sending user email:", userEmailError.message);
      }

      return res.status(201).json({ success: true, id: saved._id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Optional: GET last 50 submissions
router.get("/", async (_req, res) => {
  const list = await Contact.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, count: list.length, data: list });
});

module.exports = router;
