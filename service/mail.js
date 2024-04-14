const nodemailer = require("nodemailer");
const config = require("../config");
const path = require("path");
var hbs = require("nodemailer-express-handlebars");
class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "IMAP Mail Server",
      host: "mail.mazito.io",
      // for gmail service
      // host: 'smtp.gmail.com',
      security: true,
      port: 465,
      auth: {
        user: config.MAIL.EMAIL,
        pass: config.MAIL.PASSWORD,
      },
    });
    this.transporter.use(
      "compile",
      hbs({
        viewPath: path.resolve(__dirname, "views/email"),
        viewEngine: {
          extName: ".hbs",
          // partialsDir:path.resolve(__dirname,"/views/email"),
          defaultLayout: false,
        },
        extName: ".hbs",
      })
    );
  }
  verify=()=>{
    this.transporter.verify(function (error, success) {
      if (error) {
        console.error(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
  }
  sendMailToUser = (to, subject, html) => {
    const mailOptions = {
      from: config.MAIL.EMAIL,
      to,
      subject,
      html,
    };
    this.transporter.sendMail(mailOptions).then(() => {
      console.log(`[${subject}] mail sent to ${to}`);
    });
  };

  sendMailToUserNew = (to, subject, template, data) => {
    let mailOptions = {
      from: config.MAIL.EMAIL,
      to,
      subject,
      template,
      context: data,
    };
    this.transporter
      .sendMail(mailOptions)
      .then(() => {
        console.log(`[${subject}] mail sent to ${to}`);
      })
      .catch((err) => {
        console.error("error from [Mail]", err);
      });
  };
}
module.exports = new MailService();
