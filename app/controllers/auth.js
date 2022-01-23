const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Token = require("../models/token");
const config = require("../../config");
const apiResponse = require("../helpers/apiResponse");

exports.protect = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (accessToken == null) {
    return apiResponse.unauthorizedResponse(res, "Erişim sorunu!");
  }

  jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return apiResponse.unauthorizedResponse(res, "Erişim sorunu!");
    }
    req.user = user;
    next();
  });
};

exports.register = async (req, res, next) => {
  try {
    const email = req.body.email;
    if (!email) {
      return apiResponse.validationErrorWithData(res, "E-Posta boş olamaz!", {});
    }
    const password = req.body.password;
    if (!password || password.length < 6) {
      return apiResponse.validationErrorWithData(res, "Şifreniz en az 6 karakter olmalıdır!", {});
    }
    const userFind = await User.findOne({ email });
    if (userFind) {
      return apiResponse.validationErrorWithData(res, "Bu E-Posta adresi daha önce kayıt edilmiş!", {});
    }
    const user = await User.create({
      email: email,
      password: password
    });

    const userInfo = { id: user.id };
    const accessToken = generateAccessToken(userInfo);
    const refreshToken = generateRefreshToken(userInfo);
    var tokenResult = await saveRefreshToken(refreshToken, user.id);
    user.password = undefined; // Remove the password from the output

    if (accessToken && refreshToken) {
      const responseData = { accessToken, refreshToken, user };
      return apiResponse.successResponseWithData(res, apiResponse.Success, responseData);
    } else {
      return apiResponse.notFoundResponse(res, apiResponse.UnSuccess);
    }
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return apiResponse.validationErrorWithData(res, "Giriş bilgileriniz boş olamaz!", {});
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      return apiResponse.validationErrorWithData(res, "Giriş başarısız!", {});
    }
    if (!user.isActive) {
      return apiResponse.validationErrorWithData(res, "Giriş başarısız!", {});
    }
    const userInfo = { id: user.id };
    const accessToken = generateAccessToken(userInfo);
    const refreshToken = generateRefreshToken(userInfo);
    var tokenResult = await saveRefreshToken(refreshToken, user.id);
    user.password = undefined; // Remove the password from the output

    if (accessToken && refreshToken) {
      const responseData = { accessToken, refreshToken, user };
      return apiResponse.successResponseWithData(res, apiResponse.Success, responseData);
    } else {
      return apiResponse.notFoundResponse(res, apiResponse.UnSuccess);
    }
  } catch (error) {
    return apiResponse.ErrorResponse(res, error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    var refreshToken = req.body.refreshToken;
    var accessToken = req.body.accessToken;

    // TODO
    // jwt de accessToken destroy etme yok, sebebi clientın browserında tutuluyor
    // bir daha refresh token ile acess token alamaz ama ilk ürettiği access token aktif olmaya devam eder.
    // burada kendi çözümünü üretmemiz gerekiyor

    var result = await deleteRefreshToken(refreshToken);

    if (result) {
      return apiResponse.successResponse(res, apiResponse.Success);
    } else {
      return apiResponse.ErrorResponse(res, apiResponse.UnSuccess);
    }
  } catch (error) {
    return apiResponse.ErrorResponse(res, error);
  }
};

exports.accessToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return apiResponse.validationErrorWithData(res, "RefreshToken required!", {});
    }

    jwt.verify(
      refreshToken,
      config.REFRESH_TOKEN_SECRET,
      async (err, userRefresh) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            deleteRefreshToken(refreshToken);
            return apiResponse.ErrorResponse(res, "RefreshToken expired!");
          }
          return apiResponse.ErrorResponse(res, err);
        }

        var foundTokens = await Token.find({ token: refreshToken });
        if (foundTokens.length > 0) {
          const userInfo = { id: userRefresh.id };
          const accessToken = generateAccessToken(userInfo);
          return apiResponse.successResponseWithData(res, apiResponse.Success, {
            accessToken: accessToken,
          });
        } else {
          return apiResponse.ErrorResponse(res, apiResponse.UnSuccess);
        }
      }
    );
  } catch (error) {
    return apiResponse.ErrorResponse(res, error);
  }
};

function generateAccessToken(user) {
  return jwt.sign(user, config.ACCESS_TOKEN_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRED_TIME,
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRED_TIME,
  });
}

async function saveRefreshToken(refreshToken, userId) {
  const token = new Token({
    token: refreshToken,
    userId: userId,
  });
  var savedToken = await token.save();
  return savedToken;
}

async function deleteRefreshToken(refreshToken) {
  var removedToken = await Token.deleteOne({ token: refreshToken });
  return removedToken;
}

async function deleteAllRefreshToken(refreshToken) {
  var foundTokens = await Token.find({ token: refreshToken });
  if (foundTokens.length > 0) {
    var userId = foundTokens[0].userId;
    var removedToken = await Token.deleteMany({ userId: userId });
    return removedToken;
  }
}
