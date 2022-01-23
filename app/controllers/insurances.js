const Insurance = require("../models/insurance");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
const moment = require('moment');

exports.postInsurances = async (req, res, next) => {
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
      case "SelectInsuranceStatistics":
        return await SelectInsuranceStatistics(res, data);
      default:
        return apiResponse.ErrorResponse(res, "Method not found!");
    }
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
};

async function SelectInsuranceStatistics(res, data) {
  try {

    let { userId, isActive, chartNo, month, year } = data;
    let matchStr = {
      userId: mongoose.Types.ObjectId(userId),
      $expr: { $and: [] }
    };

    if (isActive != undefined) matchStr.isActive = isActive;
    if (month > 0) matchStr.$expr.$and.push({ $eq: [{ $month: '$startTime' }, parseInt(month)] });
    if (year > 0) matchStr.$expr.$and.push({ $eq: [{ $year: '$startTime' }, parseInt(year)] });

    Insurance
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

    let { userId, _id, customerId, isActive, plateNo, month, year } = data;

    let matchStr = {
      userId: mongoose.Types.ObjectId(userId),
      $expr: { $and: [] }
    };

    if (_id) matchStr._id = mongoose.Types.ObjectId(_id);
    if (customerId) matchStr.customerId = mongoose.Types.ObjectId(customerId);
    if (isActive != undefined) matchStr.isActive = isActive;
    if (plateNo) matchStr.plateNo = new RegExp(plateNo, 'i'); // insensitive 
    //if (month > 0) matchStr.$expr.$and.push({ $eq: [{ $month: '$startTime' }, parseInt(month)] });
    if (year > 0) matchStr.$expr.$and.push({ $eq: [{ $year: '$startTime' }, parseInt(year)] });

    Insurance
      .aggregate([
        { $match: matchStr },
        { $sort: { startTime: 1 } },
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
            _id: 1,
            userId: 1,
            customerId: true,
            //customer: "$customer", 
            customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
            startTime: true,
            endTime: true,
            description: true,
            plateNo: true,
            carRegistNo: true,
            company: true,
            policyNo: true,
            grossPrice: true,
            netPrice: true,
            commissionRate: true,
            commissionPrice: true,
            isActive: true,
            created: true,
            updated: true,
          }
        }
      ])
      .then((insurances) => {
        if (insurances.length > 0) {
          moment.locale('tr');
          if (month > 0)
            return apiResponse.successResponseWithData(res, apiResponse.Success,
              insurances.filter(x => moment(x.startTime).month() == month - 1));
          else
            return apiResponse.successResponseWithData(res, apiResponse.Success, insurances);
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
    Insurance.findOne({ "_id": _id })
      .then((insurance) => {
        if (insurance !== null) {
          let insuranceData = new InsuranceData(insurance);
          return apiResponse.successResponseWithData(res, apiResponse.Success, insuranceData);
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
    var insurance = new Insurance({
      userId: data.userId,
      customerId: data.customerId,
      startTime: data.startTime,
      endTime: data.endTime,
      description: data.description,
      plateNo: data.plateNo,
      carRegistNo: data.carRegistNo,
      company: data.company,
      policyNo: data.policyNo,
      grossPrice: data.grossPrice,
      netPrice: data.netPrice,
      commissionRate: data.commissionRate,
      commissionPrice: data.commissionPrice,
    });
    insurance.save(function (err) {
      if (err) {
        return apiResponse.ErrorResponse(res, err);
      }
      let insuranceData = new InsuranceData(insurance);
      return apiResponse.successResponseWithData(res, apiResponse.Success, insuranceData);
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
    var insurance = new Insurance(data);
    insurance.updated = moment().format();
    //console.log(insurance)

    Insurance.findById(_id, function (err, foundInsurance) {
      if (foundInsurance === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {
        Insurance.findByIdAndUpdate(_id, insurance, {}, function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          } else {
            let insuranceData = new InsuranceData(insurance);
            return apiResponse.successResponseWithData(res, apiResponse.Success, insuranceData);
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
    Insurance.findById(_id, function (err, foundInsurance) {
      if (foundInsurance === null) {
        return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
      } else {
        Insurance.findByIdAndRemove(_id, function (err) {
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

function InsuranceData(data) {
  this.id = data._id;
  this.userId = data.userId;
  this.customerName = "";
  this.customerId = data.customerId;
  this.startTime = data.startTime;
  this.endTime = data.endTime;
  this.description = data.description;
  this.plateNo = data.plateNo;
  this.carRegistNo = data.carRegistNo;
  this.company = data.company;
  this.policyNo = data.policyNo;
  this.grossPrice = data.grossPrice;
  this.netPrice = data.netPrice;
  this.commissionRate = data.commissionRate;
  this.commissionPrice = data.commissionPrice;
  this.isActive = data.isActive;
  this.created = data.created;
  this.updated = data.updated;
}