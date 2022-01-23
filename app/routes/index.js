var apiResponse = require("../helpers/apiResponse");
var log = require('../helpers/log')(module);

module.exports = function (app) {
  app.get('/', (req, res) => res.send('API'))
  app.get('/v1/', (req, res) => res.send('API V1'))
  app.use("/v1/auth", require("./auth"));
  app.use("/v1/users", require("./users"));
  app.use("/v1/customers", require("./customers"));
  app.use("/v1/insurances", require("./insurances"));
  app.use("/v1/accounts", require("./accounts"));
  app.all("*", function (req, res) {
    //log.debug('%s %d %s', req.method, res.statusCode, req.url);
    return apiResponse.notFoundResponse(res, "Page not found");
  });
  app.use((err, req, res) => {
    if (err.name == "UnauthorizedError") {
      //log.error('%s %d %s', req.method, res.statusCode, err.message);
      return apiResponse.unauthorizedResponse(res, err.message);
    }
  });
};