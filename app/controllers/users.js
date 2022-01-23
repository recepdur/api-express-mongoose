const User = require("../models/user");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const { ConsoleTransportOptions } = require("winston/lib/winston/transports");
const moment = require('moment');

exports.postUsers = async (req, res, next) => {
  try {
    const methodName = req.body.methodName;
    const data = req.body.data;
    if (!data.userId) {
      return apiResponse.validationErrorWithData(res, "Kullanıcı bilgisi boş olamaz!", {});
    }
    if (!mongoose.Types.ObjectId.isValid(data.userId)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }
    switch (methodName) {
      case "SelectByColumns":
        return await SelectByColumns(res, data);
      case "SelectByKey":
        return await SelectByKey(res, data);
      case "Insert":
        return await Insert(res, data);
      case "Update":
        return await Update(res, data);
      case "Delete":
        return await Delete(res, data);
      case "SelectUserStatistics":
        return await SelectUserStatistics(res, data);
      default:
        return apiResponse.ErrorResponse(res, "Method not found!");
    }
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
};

async function SelectUserStatistics(res, data) {
  try {

    let { userId, isActive, chartNo } = data;

    if (userId != '5fccaa2c9065c724ec82d0ca') { // reeceep@gmail.com
      return apiResponse.unauthorizedResponse(res, apiResponse.UnauthorizedTransaction, {});
    }

    let matchStr = {};
    if (isActive != undefined) matchStr.isActive = isActive;

    User
      .aggregate([
        { $match: matchStr },
        {
          $group: {
            _id: 'user',
            totalCount: { $sum: 1 }
          }
        },
      ])
      .then((users) => {
        if (users.length > 0) {
          return apiResponse.successResponseWithData(res, apiResponse.Success, users);
        } else {
          return apiResponse.successResponseWithData(res, apiResponse.Success, []);
        }
      });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function SelectByColumns(res, data) {
  try {
    let { userId, isActive } = data;

    if (userId != '5fccaa2c9065c724ec82d0ca') { // reeceep@gmail.com
      return apiResponse.unauthorizedResponse(res, apiResponse.UnauthorizedTransaction, {});
    }

    let matchStr = {};

    if (isActive != undefined) matchStr.isActive = isActive;

    User
      .aggregate([
        //{ $match: matchStr },
        //{ $sort: { firstName: 1 } },
        {
          $project: {
            _id: true,
            name: true,
            displayName: true,
            email: true,
            //password: true,
            phone: true,
            role: true,
            isActive: true,
            created: true,
            updated: true,
          }
        }
      ])
      .then((users) => {
        if (users.length > 0) {
          return apiResponse.successResponseWithData(res, apiResponse.Success, users);
        } else {
          return apiResponse.successResponseWithData(res, apiResponse.Success, []);
        }
      });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function SelectByKey(res, data) {
  const { _id } = data;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
  }
  User.findOne({ _id })
    .then((user) => {
      if (user !== null) {
        let userData = new UserData(user);
        return apiResponse.successResponseWithData(res, apiResponse.Success, userData);
      } else {
        return apiResponse.successResponseWithData(res, apiResponse.Success, {});
      }
    });
}

async function Insert(res, data) {
  try {
    const { userId, email, password, name, displayName, phone, isActive, role } = data;

    if (userId != '5fccaa2c9065c724ec82d0ca') { // reeceep@gmail.com
      return apiResponse.unauthorizedResponse(res, apiResponse.UnauthorizedTransaction, {});
    }

    if (!password || password.length < 6) {
      return apiResponse.validationErrorWithData(res, "Şifreniz en az 6 karakter olmalıdır!", {});
    }

    const userFind = await User.findOne({ email });
    if (userFind) {
      return apiResponse.validationErrorWithData(res, "E-Posta adresi daha önce kayıt edilmiş!", {});
    }

    const user = User({
      email: email,
      password: password,
      name: name,
      displayName: displayName,
      phone: phone,
      isActive: isActive,
      role: role,
    });

    user.save(function (err) {
      if (err) {
        return apiResponse.ErrorResponse(res, err);
      }
      let userData = new UserData(user);
      return apiResponse.successResponseWithData(res, apiResponse.Success, userData);
    });
  } catch (error) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function Update(res, data) {
  try {
    const { _id, email, password, name, displayName, phone, isActive, role } = data;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }

    let cryptedPassword = undefined;
    if (password) {
      if (password.length < 6)
        return apiResponse.validationErrorWithData(res, "Şifreniz en az 6 karakter olmalıdır!", {});
      else
        cryptedPassword = await bcrypt.hash(password, 12);
    }

    const userFind = await User.findOne({ email });
    if (userFind) {
      if (userFind._id != _id)
        return apiResponse.validationErrorWithData(res, "E-Posta adresi daha önce kayıt edilmiş!", {});
    }

    let user = User({
      _id: _id,
      email: email,
      password: cryptedPassword,
      name: name,
      displayName: displayName,
      phone: phone,
      isActive: isActive,
      role: role,
      updated: moment().format()
    });
    user.created = undefined;
    //console.log(user)

    User.findById(_id, function (err, foundUser) {
      if (foundUser === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {

        //console.log(foundUser)

        User.findByIdAndUpdate(_id, user, {}, function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            let userData = new UserData(user);
            return apiResponse.successResponseWithData(res, apiResponse.Success, userData);
          }
        });
      }
    });
  } catch (error) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function Delete(res, data) {
  try {
    const { userId, _id } = data;

    if (userId != '5fccaa2c9065c724ec82d0ca') { // reeceep@gmail.com
      return apiResponse.unauthorizedResponse(res, apiResponse.UnauthorizedTransaction, {});
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }
    User.findById(_id, function (err, foundUser) {
      if (foundUser === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {
        User.findByIdAndRemove(_id, function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            return apiResponse.successResponse(res, apiResponse.Success);
          }
        });
      }
    });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

function UserData(data) {
  this.id = data._id;
  this.name = data.name;
  this.displayName = data.displayName;
  this.role = data.role;
  this.email = data.email;
  this.phone = data.phone;
  this.isActive = data.isActive;
  this.role = data.role;
  this.created = data.created;
  this.updated = data.updated;
} 