import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Buat transporter (kurir pengirim email)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Kita menggunakan Gmail
      auth: {
        user: process.env.EMAIL_USER, // Email 
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Atur isi emailnya
    const mailOptions = {
      from: `"DailyGrind" <${process.env.EMAIL_USER}>`, // Nama pengirim
      to: to, // Email penerima (user yang mendaftar)
      subject: subject, // Judul email
      html: html, // Isi email dalam bentuk HTML
    };

    // Kirim email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default sendEmail;
