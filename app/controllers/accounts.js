const Account = require("../models/account");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
const moment = require('moment');

exports.postAccounts = async (req, res, next) => {
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
      case "SelectAccountStatistics":
        return await SelectAccountStatistics(res, data);
      default:
        return apiResponse.ErrorResponse(res, "Method not found!");
    }
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
};

async function SelectAccountStatistics(res, data) {
  try {

    let { userId, isActive, chartNo, month, year } = data;
    let matchStr = {
      userId: mongoose.Types.ObjectId(userId),
      $expr: { $and: [] }
    };

    if (isActive != undefined) matchStr.isActive = isActive;
    if (month > 0) matchStr.$expr.$and.push({ $eq: [{ $month: '$startTime' }, parseInt(month)] });
    if (year > 0) matchStr.$expr.$and.push({ $eq: [{ $year: '$startTime' }, parseInt(year)] });

    Account
      .aggregate([
        { $match: matchStr },
        {
          $group: {
            _id: '$userId',
            totalCount: { $sum: 1 },
            totalGrossPrice: { $sum: "$grossPrice" },
            totalNetPrice: { $sum: "$netPrice" },
            totalCommissionPrice: { $sum: "$commissionPrice" },
          }
        },
      ])
      .then((insurances) => {
        if (insurances.length > 0) {
          return apiResponse.successResponseWithData(res, apiResponse.Success, insurances);
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

    let { userId, _id, customerId, isActive } = data;

    let matchStr = {
      userId: mongoose.Types.ObjectId(userId)
    };

    if (_id) matchStr._id = mongoose.Types.ObjectId(_id);
    if (customerId) matchStr.customerId = mongoose.Types.ObjectId(customerId);
    if (isActive != undefined) matchStr.isActive = isActive;

    Account
      .aggregate([
        { $match: matchStr },
        { $sort: { tranDate: 1 } },
        // { $limit: 20 },
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
          }
        },
        { $unwind: "$customer" },
        {
          $project: {
            _id: true,
            userId: 1,
            customerId: true,
            //customer: "$customer", 
            customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
            tranDate: true,
            tranType: true,
            tranTypeName: {
              $cond: { if: { $eq: ['$tranType', 'l'] }, then: 'Borç', else: 'Alındı' }
            },
            description: true,
            loanAmount: true,
            creditAmount: true,
            isActive: true,
            created: true,
            updated: true,
          }
        }
      ])
      .then((accounts) => {
        if (accounts.length > 0) {
          return apiResponse.successResponseWithData(res, apiResponse.Success, accounts);
        } else {
          return apiResponse.successResponseWithData(res, apiResponse.Success, []);
        }
      });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function SelectByKey(res, data) {
  try {
    const { _id } = data;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }
    Account.findOne({ "_id": _id })
      .then((account) => {
        if (account !== null) {
          let accountData = new AccountData(account);
          return apiResponse.successResponseWithData(res, apiResponse.Success, accountData);
        } else {
          return apiResponse.successResponseWithData(res, apiResponse.Success, {});
        }
      });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function Insert(res, data) {
  try {
    var account = new Account({
      userId: data.userId,
      customerId: data.customerId,
      tranDate: data.tranDate,
      tranType: data.tranType,
      description: data.description,
      loanAmount: data.loanAmount,
      creditAmount: data.creditAmount,
    });
    account.save(function (err) {
      if (err) {
        return apiResponse.ErrorResponse(res, err);
      }
      let accountData = new AccountData(account);
      return apiResponse.successResponseWithData(res, apiResponse.Success, accountData);
    });
  } catch (error) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function Update(res, data) {
  try {
    const { _id } = data;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }
    var account = new Account(data);
    account.updated = moment().format();
    //console.log(account)

    Account.findById(_id, function (err, foundAccount) {
      if (foundAccount === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {
        Account.findByIdAndUpdate(_id, account, {}, function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            let accountData = new AccountData(account);
            return apiResponse.successResponseWithData(res, apiResponse.Success, accountData);
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
    const { _id } = data;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
    }
    Account.findById(_id, function (err, foundAccount) {
      if (foundAccount === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {
        Account.findByIdAndRemove(_id, function (err) {
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

function AccountData(data) {
  this.id = data._id;
  this.userId = data.userId;
  this.customerName = "";
  this.customerId = data.customerId;
  this.tranDate = data.tranDate;
  this.tranType = data.tranType;
  this.description = data.description;
  this.loanAmount = data.loanAmount;
  this.creditAmount = data.creditAmount;
  this.isActive = data.isActive;
  this.created = data.created;
  this.updated = data.updated;
}