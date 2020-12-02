require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = createRefreshToken = async (data, screat) => {
  const screatkey = process.env.jwtScreatRefresh + screat;
  const refreshToken = jwt.sign(data, screatkey, {
    algorithm: "HS256",
    expiresIn: "29.6d",
  });
  return refreshToken;
};
