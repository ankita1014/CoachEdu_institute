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

transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error.message);
    console.error('Please check EMAIL_USER and EMAIL_PASSWORD in .env file');
  } else {
    console.log('Email server is ready to send messages');
  }
});

async function sendEmail(recipientEmail, emailSubject, emailHtml) {
  try {
    const emailConfigured =
      process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    if (!emailConfigured) {
      console.log('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const mailOptions = {
      from: `"Success Mantra Institute" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    console.log(
      'Email sent successfully to:',
      recipientEmail,
      '- Message ID:',
      emailInfo.messageId
    );
    return { success: true, messageId: emailInfo.messageId };
  } catch (error) {
    console.error('Email send failed to:', recipientEmail);
    console.error('Error details:', error.message);

    const isAuthError = error.code === 'EAUTH';
    if (isAuthError) {
      console.error(
        'Authentication failed - Check EMAIL_USER and EMAIL_PASSWORD in .env'
      );
    }

    return { success: false, error: error.message };
  }
}

export async function sendEnrollmentConfirmation(user, enrollment) {
  const subject = 'Admission Form Submitted - Success Mantra Institute';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 15px;">
                                            <img src="${process.env.FRONTEND_URL || 'https://success-mantra-dm.vercel.app'}/browser.png" alt="Success Mantra Institute" style="width: 80px; height: auto; display: block; border: 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Success Mantra Institute</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Admission Form Submitted Successfully</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 20px; background-color: #f8f9fa;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">Dear <strong>${enrollment.studentName}</strong>,</p>
                                
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">Thank you for submitting your admission form to Success Mantra Institute. We have received your application and it is currently under review.</p>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Application Details</h3>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Application ID:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${enrollment._id}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Student Name:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${enrollment.studentName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Father's Name:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${enrollment.fatherName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Mobile Number:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${enrollment.mobileNumber}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Date of Birth:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${enrollment.dateOfBirth.day}/${enrollment.dateOfBirth.month}/${enrollment.dateOfBirth.year}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <strong style="color: #667eea; font-size: 14px;">Status:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="display: inline-block; padding: 5px 15px; background-color: #ffc107; color: #000; border-radius: 20px; font-size: 12px; font-weight: bold;">PENDING REVIEW</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <h3 style="margin: 30px 0 15px 0; color: #667eea; font-size: 18px;">Next Steps:</h3>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Our team will review your application within 24-48 hours</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• You will receive an email notification once reviewed</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Check your application status in your profile</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• You can resubmit from your profile if changes are needed</td>
                                    </tr>
                                </table>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">For any queries, contact us:</p>
                                            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> mysuccessmantrainstitute@gmail.com</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
                                <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; 2026 Success Mantra Institute. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

  await sendEmail(user.email, subject, html);

  const adminEmail =
    process.env.ADMIN_EMAIL || 'mysuccessmantrainstitute@gmail.com';
  const adminSubject = 'New Admission Form Submitted';

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 15px;">
                                            <img src="${process.env.FRONTEND_URL || 'https://success-mantra-dm.vercel.app'}/browser.png" alt="Success Mantra Institute" style="width: 80px; height: auto; display: block; border: 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Success Mantra Institute</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">New Admission Form Received</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 20px; background-color: #f8f9fa;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">A new admission form has been submitted and requires your review.</p>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Student Details</h3>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Application ID:</strong>
                                                        <span style="color: #333; font-size: 14px; word-break: break-all;">${enrollment._id}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Student Name:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.studentName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Father's Name:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.fatherName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Mother's Name:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.motherName}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Mobile Number:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.mobileNumber}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Email:</strong>
                                                        <span style="color: #333; font-size: 14px; word-break: break-all;">${user.email}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Date of Birth:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.dateOfBirth.day}/${enrollment.dateOfBirth.month}/${enrollment.dateOfBirth.year}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Gender:</strong>
                                                        <span style="color: #333; font-size: 14px; text-transform: capitalize;">${enrollment.gender}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Aadhar Number:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.aadharNumber}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Address:</strong>
                                                        <span style="color: #333; font-size: 14px;">${enrollment.address}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center" style="padding: 0 0 15px 0;">
                                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?id=${enrollment._id}&action=approve" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(40,167,69,0.3); margin: 5px;">Approve Application</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?id=${enrollment._id}&action=cancel" style="display: inline-block; padding: 15px 30px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(220,53,69,0.3); margin: 5px;">Cancel Application</a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 20px 0 0 0; text-align: center; color: #6c757d; font-size: 14px;">Or review this application in the admin panel</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 12px;">This is an automated notification from Success Mantra Institute.</p>
                                <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; 2026 Success Mantra Institute. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

  await sendEmail(adminEmail, adminSubject, adminHtml);
}

export async function sendStatusUpdateEmail(
  user,
  enrollment,
  oldStatus,
  newStatus
) {
  let emailSubject = '';
  let statusMessage = '';
  let statusColor = '';

  const isApproved = newStatus === 'active';
  const isCancelled = newStatus === 'cancelled';

  if (isApproved) {
    emailSubject = 'Admission Approved - Success Mantra Institute';
    statusMessage = 'Congratulations! Your admission has been approved.';
    statusColor = '#28a745';
  } else if (isCancelled) {
    emailSubject = 'Admission Status Update - Success Mantra Institute';
    statusMessage = 'Your admission application requires attention.';
    statusColor = '#dc3545';
  } else {
    emailSubject = 'Admission Status Update - Success Mantra Institute';
    statusMessage = 'Your admission application status has been updated.';
    statusColor = '#ffc107';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 15px;">
                                            <img src="${process.env.FRONTEND_URL || 'https://success-mantra-dm.vercel.app'}/browser.png" alt="Success Mantra Institute" style="width: 80px; height: auto; display: block; border: 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Success Mantra Institute</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Admission Status Update</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 20px; background-color: #f8f9fa;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">Dear <strong>${enrollment.studentName}</strong>,</p>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-left: 4px solid ${statusColor}; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 30px; text-align: center;">
                                            <h2 style="margin: 0 0 20px 0; color: ${statusColor}; font-size: 22px;">${statusMessage}</h2>
                                            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Your application status has been updated to:</p>
                                            <span style="display: inline-block; padding: 10px 25px; background-color: ${statusColor}; color: #ffffff; border-radius: 25px; font-size: 14px; font-weight: bold; text-transform: uppercase;">${newStatus}</span>
                                        </td>
                                    </tr>
                                </table>
                                
                                ${
                                  enrollment.adminRemarks
                                    ? `
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">Admin Remarks:</h4>
                                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">${enrollment.adminRemarks}</p>
                                        </td>
                                    </tr>
                                </table>
                                `
                                    : ''
                                }
                                
                                <p style="margin: 20px 0 10px 0; color: #667eea; font-size: 14px;"><strong>Application ID:</strong> ${enrollment._id}</p>
                                
                                ${
                                  newStatus === 'active'
                                    ? `
                                <h3 style="margin: 30px 0 15px 0; color: #667eea; font-size: 18px;">Welcome to Success Mantra Institute!</h3>
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 16px; line-height: 1.6;">Your admission has been confirmed. Please visit the institute for further formalities and fee payment.</p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Bring original documents for verification</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Complete the fee payment process</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Collect your student ID card</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0 5px 20px; color: #333; font-size: 14px; line-height: 1.6;">• Get your class schedule</td>
                                    </tr>
                                </table>
                                `
                                    : ''
                                }
                                
                                ${
                                  newStatus === 'cancelled'
                                    ? `
                                <p style="margin: 20px 0; color: #333; font-size: 16px; line-height: 1.6;">You can resubmit your admission form by visiting your profile page and updating the required information.</p>
                                `
                                    : ''
                                }
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">For any queries, contact us:</p>
                                            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> mysuccessmantrainstitute@gmail.com</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
                                <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; 2026 Success Mantra Institute. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

  await sendEmail(user.email, emailSubject, html);
}

export async function sendDemoBookingNotification(booking, userEmail) {
  const adminEmail =
    process.env.ADMIN_EMAIL || 'mysuccessmantrainstitute@gmail.com';
  const subject = 'New Demo Booking Request - Success Mantra Institute';

  const formattedDate = new Date(booking.preferredDate).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 15px;">
                                            <img src="https://success-mantra-dm.vercel.app/browser.png" alt="Success Mantra Institute" style="width: 80px; height: auto; display: block; border: 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Success Mantra Institute</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">New Demo Booking Request</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 30px 20px; background-color: #f8f9fa;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">A new demo class booking request has been received and requires your attention.</p>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Booking Details</h3>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Booking ID:</strong>
                                                        <span style="color: #333; font-size: 14px; word-break: break-all;">${booking._id}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Student Name:</strong>
                                                        <span style="color: #333; font-size: 14px;">${booking.name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Phone Number:</strong>
                                                        <span style="color: #333; font-size: 14px;">${booking.phone}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Preferred Date:</strong>
                                                        <span style="color: #333; font-size: 14px;">${formattedDate}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Preferred Time:</strong>
                                                        <span style="color: #333; font-size: 14px;">${booking.preferredTime}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0;">
                                                        <strong style="color: #667eea; font-size: 14px; display: block; margin-bottom: 4px;">Booking Date:</strong>
                                                        <span style="color: #333; font-size: 14px;">${new Date(booking.createdAt).toLocaleString('en-IN')}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 15px;">
                                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;"><strong>Action Required:</strong> Please contact the student within 24 hours to confirm the demo class schedule.</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 20px 0 0 0; text-align: center; color: #6c757d; font-size: 14px;">Manage this booking in the admin panel</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 12px;">This is an automated notification from Success Mantra Institute.</p>
                                <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; 2026 Success Mantra Institute. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

  await sendEmail(adminEmail, subject, html);

  if (userEmail) {
    const userSubject = 'Demo Class Booking Confirmed - Success Mantra Institute';
    const userHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 15px;">
                                            <img src="https://success-mantra-dm.vercel.app/browser.png" alt="Success Mantra Institute" style="width: 80px; height: auto; display: block; border: 0;" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Success Mantra Institute</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding-top: 10px;">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Demo Class Booking Received</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px 20px; background-color: #f8f9fa;">
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">Dear <strong>${booking.name}</strong>,</p>
                                <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">Thank you for booking a demo class with Success Mantra Institute. We have received your request and our team will contact you shortly to confirm the schedule.</p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Booking Details</h3>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Name:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${booking.name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Phone:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${booking.phone}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                                                        <strong style="color: #667eea; font-size: 14px;">Preferred Date:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${formattedDate}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <strong style="color: #667eea; font-size: 14px;">Preferred Time:</strong>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #333; font-size: 14px;">${booking.preferredTime}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                                    <tr>
                                        <td align="center">
                                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">For any queries, contact us:</p>
                                            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> mysuccessmantrainstitute@gmail.com</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
                                <p style="margin: 0; color: #6c757d; font-size: 12px;">&copy; 2026 Success Mantra Institute. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
    await sendEmail(userEmail, userSubject, userHtml);
  }
}
