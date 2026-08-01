const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

const initializeTransporter = async () => {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    logger.info('SMTP Email Service initialized');
    return transporter;
  }

  try {
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    logger.info('Ethereal Email Service initialized');
  } catch (err) {
    logger.error('Failed to create Ethereal account: ', err);
  }

  return transporter;
};

exports.sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, date, time) => {
  try {
    await initializeTransporter();
    if (!transporter) {
      logger.warn('Email transporter not ready yet');
      return { html: '' };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #DDEED8; border-radius: 10px;">
        <h2 style="color: #315C46; text-align: center;">Appointment Confirmed!</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been successfully booked. Here are the details:</p>
        <div style="background-color: #F4F9F1; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>You can check your real-time queue status from your Patient Dashboard.</p>
        <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">Hospital Queue Management System</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Hospital Management" <${process.env.EMAIL_FROM || 'noreply@hospital.com'}>`,
      to: patientEmail,
      subject: 'Your Appointment Confirmation',
      html: htmlContent
    });

    logger.info(`Email sent to ${patientEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return { previewUrl: nodemailer.getTestMessageUrl(info), html: htmlContent };
  } catch (error) {
    logger.error('Error sending email via SMTP: ', error.message);
    logger.info('--- RENDER FREE TIER FALLBACK ---');
    return { html: htmlContent }; // Return the HTML so the frontend can display it directly!
  }
};
