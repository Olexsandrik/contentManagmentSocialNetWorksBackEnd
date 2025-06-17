const createError = require("http-errors");
const express = require("express");
const path = require("path"); 
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
const logger = require("morgan");
require("./libs/facebookStrategy.js");
const fs = require("fs");
const app = express();
require("dotenv").config();
const cors = require("cors");

// view engine setup
app.use(bodyparser.json());
app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(logger("dev")); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("view engine", "jade");

app.use(express.static(path.join(__dirname, "public")));

// статичні файли із папки  'upload'
app.use("/uploads", express.static("uploads"));

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.use("/server", require("./routes/index.js"));

if (!fs.existsSync("uploads")) {
  // уомва перевірки папки сама умова синхронна
  fs.mkdirSync("uploads");
}
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
