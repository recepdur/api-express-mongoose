
require('dotenv').config();

module.exports = {
  development: require('./env/dev'),
  test: require('./env/test'),
  production: require('./env/prod')
}[process.env.NODE_ENV];