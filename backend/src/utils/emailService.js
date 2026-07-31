const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

// Automatically generate a test Ethereal account on startup
nodemailer.createTestAccount().then((account) => {
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
}).catch((err) => {
  logger.error('Failed to create Ethereal account: ', err);
});

exports.sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, date, time) => {
  try {
    if (!transporter) {
      logger.warn('Email transporter not ready yet');
      return;
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
      from: '"Hospital Management" <noreply@hospital.com>',
      to: patientEmail,
      subject: 'Your Appointment Confirmation',
      html: htmlContent
    });

    logger.info(`Email sent to ${patientEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    logger.error('Error sending email via SMTP: ', error.message);
    logger.info('--- RENDER FREE TIER FALLBACK ---');
    logger.info('Since Render blocks free SMTP ports, here is the email that would have been sent:');
    logger.info(`To: ${patientEmail}`);
    logger.info(`Subject: Your Appointment Confirmation`);
    logger.info(`Content: Appointment for ${patientName} with ${doctorName} on ${date} at ${time}`);
    logger.info('---------------------------------');
  }
};
