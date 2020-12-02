require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = createAuthToken = async (data) => {
  try {
    const authToken = await jwt.sign(data, process.env.jwtScreatPrivate, {
      algorithm: "HS256",
      expiresIn: "1d",
    });
    return authToken;
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "server error" });
  }
};
