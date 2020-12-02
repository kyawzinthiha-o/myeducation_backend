require("dotenv").config();
const nodemailer = require("nodemailer");

const Varification = require("../databases/Varification");

module.exports = main = async (id, email) => {
  let transporter = await nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.Email, // generated ethereal user
      pass: process.env.PASS, // generated ethereal password
    },
  });

  const alreadysend = await Varification.findOne({ id });

  if (alreadysend) {
    await Varification.findOneAndRemove({ id });
  }

  const varificationCode = Math.floor(1000 + Math.random() * 9000);
  const uservarify = new Varification({
    id,
    code: varificationCode,
  });

  try {
    await uservarify.save();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
  // send mail with defined transport object
  try {
    await transporter.sendMail({
      from: '"My Education" <noonieumsmith@gmail.com>', // sender address
      to: `${email} `, // list of receivers
      subject: "Confirmation Email", // Subject line
      html: ` <div style='text-align: center'> This is the code for your email varification  
      <div style = "width: 40%; height: auto; margin:auto; text-align: center; font-size: 1.5em; letter-spacing: 5px; font-weight: bolder; border: 1px solid black; border-radius: 10px"> ${varificationCode} </div> </div>`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
};
