import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail(recipientEmail, emailSubject, emailHtml) {
  try {
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    if (!emailConfigured) return { success: false, error: 'Email not configured' };

    const mailOptions = {
      from: `"Success Mantra Institute" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    console.log('Email sent:', emailInfo.messageId);
    return { success: true, messageId: emailInfo.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendResubmitConfirmation(user, enrollment) {
  const subject = 'Form Resubmitted Successfully - Success Mantra Institute';

  const emailStyles = `
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo-title { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 1.8rem; }
        .header p { margin: 10px 0 0 0; font-size: 1rem; opacity: 0.95; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        .success-badge { display: inline-block; padding: 8px 20px; background: #28a745; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; }
    `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>${emailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-title">
                    <img src="${process.env.FRONTEND_URL || 'https://success-mantra-dm.vercel.app'}/browser.png" alt="Success Mantra Institute" style="width: 60px; height: auto; display: block; border: 0;" />
                    <h1>Success Mantra Institute</h1>
                </div>
                <p>Form Resubmitted Successfully</p>
            </div>
            
            <div class="content">
                <p>Dear <strong>${enrollment.studentName}</strong>,</p>
                
                <p>Thank you for resubmitting your admission form. We have received your updated application and it is now under review.</p>
                
                <div class="info-box">
                    <h3 style="margin-top: 0; color: #28a745;">Updated Application</h3>
                    <p style="margin: 10px 0;"><span class="success-badge">RESUBMITTED</span></p>
                    <p style="margin: 15px 0 5px 0;"><strong>Application ID:</strong> ${enrollment._id}</p>
                    <p style="margin: 5px 0;"><strong>Student Name:</strong> ${enrollment.studentName}</p>
                    <p style="margin: 5px 0;"><strong>Mobile:</strong> ${enrollment.mobileNumber}</p>
                </div>
                
                <h3 style="color: #667eea;">What's Next?</h3>
                <ul>
                    <li>Our team will review your updated application within 24-48 hours</li>
                    <li>You will receive an email notification once reviewed</li>
                    <li>Check your application status in your profile</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #6c757d;">For any queries, contact us:</p>
                    <p><strong>Email:</strong> mysuccessmantrainstitute@gmail.com</p>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
                <p>&copy; 2026 Success Mantra Institute. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  await sendEmail(user.email, subject, html);

  const adminEmail =
    process.env.ADMIN_EMAIL || 'mysuccessmantrainstitute@gmail.com';
  const adminSubject = 'Form Resubmitted - Requires Review';

  const adminEmailStyles = `
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo-title { display: flex; align-items: center; justify-content: center; gap: 15px; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 40px; margin: 0 10px; text-decoration: none; border-radius: 50px; font-weight: bold; color: white; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .btn-approve { background: #28a745; }
        .btn-cancel { background: #dc3545; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        .success-badge { display: inline-block; padding: 8px 20px; background: #28a745; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; }
    `;

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>${adminEmailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-title">
                    <img src="${process.env.FRONTEND_URL || 'https://success-mantra-dm.vercel.app'}/browser.png" alt="Success Mantra Institute" style="width: 60px; height: auto; display: block; border: 0;" />
                    <h1 style="margin: 0;">Success Mantra Institute</h1>
                </div>
                <p style="margin: 10px 0 0 0;">Form Resubmitted - Requires Review</p>
            </div>
            
            <div class="content">
                <p>A student has resubmitted their admission form with updated information.</p>
                
                <div class="info-box">
                    <h3 style="margin-top: 0; color: #28a745;">Resubmitted Application</h3>
                    <p><strong>Application ID:</strong> ${enrollment._id}</p>
                    <p><strong>Student Name:</strong> ${enrollment.studentName}</p>
                    <p><strong>Father's Name:</strong> ${enrollment.fatherName}</p>
                    <p><strong>Mother's Name:</strong> ${enrollment.motherName}</p>
                    <p><strong>Mobile:</strong> ${enrollment.mobileNumber}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>DOB:</strong> ${enrollment.dateOfBirth.day}/${enrollment.dateOfBirth.month}/${enrollment.dateOfBirth.year}</p>
                    <p><strong>Gender:</strong> ${enrollment.gender}</p>
                    <p><strong>Aadhar:</strong> ${enrollment.aadharNumber}</p>
                    <p><strong>Address:</strong> ${enrollment.address}</p>
                </div>
                
                <div class="action-buttons">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?id=${enrollment._id}&action=approve" class="btn btn-approve">
                        Approve Application
                    </a>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?id=${enrollment._id}&action=cancel" class="btn btn-cancel">
                        Cancel Application
                    </a>
                </div>
                
                <p style="text-align: center; margin-top: 20px; color: #6c757d;">
                    Or review this resubmitted application in the admin panel
                </p>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from Success Mantra Institute.</p>
                <p>&copy; 2026 Success Mantra Institute. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  await sendEmail(adminEmail, adminSubject, adminHtml);
}
