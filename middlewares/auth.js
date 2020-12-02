require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(400).json({ msg: "No token authorization denied" });
  }
  try {
    // decode tue jwt url to the payloads thet will get the user.id from payload
    const decode = jwt.verify(token, process.env.jwtScreatPrivate, {
      algorithm: "HS256",
    });
    // make the req.user = user.id from teh decoded payload
    req.user = decode.user;
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(401).json({ msg: "Token is not valid" });
  }
};
