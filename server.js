require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./db");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csrf = require('csurf')


//connect database
connectDB();

const app = express();

const limitReach = (req, res) => {
  log.warn({ ip: req.ip }, "Friendly rate limiter triggered");
  res.status(429).send("Too many request. Try again later");
};

//rate limiter
const register = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  onLimitReached: limitReach,
  handler: limitReach,
  message: "Too many request. Please try again after an hour",
});

const logIn = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  onLimitReached: limitReach,
  handler: limitReach,
  message: "Too many request. Please try again after an hour",
  skipSuccessfulRequests: true,
});

const csrfProtection = csrf({cookie: true})
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-auth-token', 'X-CSRF-Token'],
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE"
}));

app.use((req, res, next)=> {
  res.header('Access-Control-Allow-Headers',"http://localhost:3000")
  req.header("Access-Control-Allow-Origin", "http://localhost:3000")
  res.header("Access-Control-Allow-Credentials", "true")
  res.removeHeader('X-Powered-By')
  next()
})
app.use(helmet());
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection)

//log in and user load route
app.use("/api/auth/", /* logIn, */ require("./route/auth"));
//register route
app.use("/api/user", /*  register, */ require("./route/user"));
//log out
app.use("/api/logout", require("./route/logOut"));

//post Profile content route
app.use("/api/profile", require("./route/profile"));

//public route
app.use("/api/public", require("./route/public"));

/* tokens */
app.use("/api/token", require("./route/tokens"));

app.use(
  "/confirmation",
  register,
  
  require("./confirmationEmail/emailReceiver")
);
app.get('/csrfToken', (req, res) => {
  res.json({csrfToken : req.csrfToken()})
})
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`running in port ${PORT}`));
