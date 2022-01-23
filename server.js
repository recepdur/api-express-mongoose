const express = require("express");
const app = express();
const mongoose = require("mongoose");
require('dotenv').config();
const config = require('./config');
const port = process.env.PORT || config.PORT;
require('./app/express')(app);
require('./app/routes')(app);

connect();

function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
}

function listen() {
  app.listen(port);
  console.log('App started ' + `Port:${port} ` + `NODE_ENV(DB):${process.env.NODE_ENV}`);
}