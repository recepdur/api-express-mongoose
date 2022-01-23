const express = require("express");
const session = require("express-session");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const path = require("path");
const csrf = require("csurf");
const cors = require("cors");
const helmet = require("helmet");
//const xss = require("xss-clean");
const hpp = require("hpp");
const mongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const winston = require("winston");
const helpers = require("view-helpers");
const rateLimit = require("express-rate-limit");
const ultimatePagination = require("ultimate-pagination");
const config = require("../config");

module.exports = function (app) {

  app.use(cors());
  app.options('*', cors());
  app.use(helmet()); // Set security HTTP headers
  //app.use(xss()); // Data sanitization against XSS(clean user input from malicious HTML code)
  app.use(hpp()); // Prevent parameter pollution
  app.use(compression({ threshold: 512 })); // Compression middleware (should be placed before express.static)
  app.use(express.json({ limit: "15kb" })); // Body parser, reading data from body into req.body  
  app.use(bodyParser.json()); // bodyParser should be above methodOverride
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  //app.use(express.static("public"));
  //app.set("views", path.join(__dirname, "views"));
  //app.engine("html", require("ejs").renderFile);
  //app.set("view engine", "html"); 

};
