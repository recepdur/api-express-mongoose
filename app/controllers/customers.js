const Customer = require("../models/customer");
const Insurance = require("../models/insurance");
const apiResponse = require("../helpers/apiResponse");
var mongoose = require("mongoose");
const { Client } = require('pg');
const moment = require("moment");

exports.postCustomers = async (req, res, next) => {
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
      case "SelectCustomerStatistics":
        return await SelectCustomerStatistics(res, data);
      case "MoveCustomer":
        return await MoveCustomer(res, data);
      default:
        return apiResponse.ErrorResponse(res, "Method not found!");
    }
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
};

async function SelectCustomerStatistics(res, data) {
  try {

    let { userId, isActive, chartNo } = data;
    let matchStr = {
      userId: mongoose.Types.ObjectId(userId)
    };

    if (isActive != undefined) matchStr.isActive = isActive;

    Customer
      .aggregate([
        { $match: matchStr },
        {
          $group: {
            _id: '$userId',
            totalCount: { $sum: 1 }
          }
        },
      ])
      .then((customers) => {
        if (customers.length > 0) {
          return apiResponse.successResponseWithData(res, apiResponse.Success, customers);
        } else {
          return apiResponse.successResponseWithData(res, apiResponse.Success, []);
        }
      });
  } catch (err) {
    return apiResponse.ErrorResponse(res, err);
  }
}

async function SelectByColumns(res, data) {
  let { userId, _id, isActive, firstName } = data;
  let matchStr = {
    userId: mongoose.Types.ObjectId(userId),
  };

  if (_id) matchStr._id = mongoose.Types.ObjectId(_id);
  if (isActive != undefined) matchStr.isActive = isActive;
  if (firstName) matchStr.firstName = new RegExp(firstName, 'i'); // insensitive   

  Customer
    .aggregate([
      { $match: matchStr },
      { $sort: { firstName: 1 } }
    ])
    .then((customers) => {
      if (customers.length > 0) {
        return apiResponse.successResponseWithData(res, apiResponse.Success, customers);
      } else {
        return apiResponse.successResponseWithData(res, apiResponse.Success, []);
      }
    });
}

async function SelectByKey(res, data) {
  const { _id } = data;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
  }
  Customer.findOne({ "_id": _id })
    .then((customer) => {
      if (customer !== null) {
        let customerData = new CustomerData(customer);
        return apiResponse.successResponseWithData(res, apiResponse.Success, customerData);
      } else {
        return apiResponse.successResponseWithData(res, apiResponse.Success, {});
      }
    });
}

async function Insert(res, data) {
  const { userId, tcNo } = data;
  if (!tcNo) {
    return apiResponse.validationErrorWithData(res, "TC No bilgisi boş olamaz!", {});
  }
  Customer.find({ 'userId': userId, 'tcNo': tcNo }, function (err, findTC) {
    if (findTC != null && findTC.length > 0) {
      return apiResponse.notFoundResponse(res, "TC No daha önce kullanılmış!");
    }
    var customer = new Customer({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      tcNo: data.tcNo,
    });
    customer.save(function (err) {
      if (err) {
        return apiResponse.ErrorResponse(res, err);
      }
      let customerData = new CustomerData(customer);
      return apiResponse.successResponseWithData(res, apiResponse.Success, customerData);
    });
  });
}

async function Update(res, data) {
  const { userId, _id, tcNo } = data;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
  }
  if (!tcNo) {
    return apiResponse.validationErrorWithData(res, "TC No bilgisi boş olamaz!", {});
  }

  Customer.findById(_id, function (err, findId) {
    if (findId === null) {
      return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
    }
    Customer.find({ 'userId': userId, 'tcNo': tcNo }, function (err, findTC) {
      if (findTC != null && findTC.length > 0 && _id != findTC[0]._id) {
        return apiResponse.notFoundResponse(res, "TC No daha önce kullanılmış!");
      }

      var customerObj = new Customer(data);
      customerObj.updated = moment().format();

      Customer.findByIdAndUpdate(_id, customerObj, {}, function (err) {
        if (err) {
          return apiResponse.ErrorResponse(res, err);
        } else {
          let customerData = new CustomerData(customerObj);
          return apiResponse.successResponseWithData(res, apiResponse.Success, customerData);
        }
      });
    });
  });
}

async function Delete(res, data) {
  const { _id } = data;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return apiResponse.validationErrorWithData(res, apiResponse.InvalidInfo, {});
  }
  Customer.findById(_id, function (err, foundCustomer) {
    if (foundCustomer === null) {
      return apiResponse.notFoundResponse(res, apiResponse.RecordNotFound);
    } else {
      Customer.findByIdAndRemove(_id, function (err) {
        if (err) {
          return apiResponse.ErrorResponse(res, err);
        } else {
          return apiResponse.successResponse(res, apiResponse.Success);
        }
      });
    }
  });
}

async function MoveCustomer(res, data) {

  await Customer.deleteMany({ userId: data.userId }).then(function () {
    console.log("DELETE Customers");
  });

  await Insurance.deleteMany({ userId: data.userId }).then(function () {
    console.log("DELETE Insurances");
  });

  let client = new Client({
    user: data.isProd ? '' : 'postgres',
    host: data.isProd ? '' : 'localhost',
    database: data.isProd ? '' : 'postgres',
    password: data.isProd ? '' : '123456',
    port: 5432,
  });
  client.connect();

  moment.locale('tr');
  //  where '2020-06-01'<=baslangic and baslangic<='2020-06-30' and durumu=true
  client.query(`select tc_no, COUNT(*) from sigorta group by tc_no`, (err1, res1) => {
    let groupSigortaList = res1.rows;

    client.query(`SELECT * FROM sigorta`, (err2, res2) => {
      let sigortaList = res2.rows;

      for (let gsRow of groupSigortaList) {
        let dbCustomer = sigortaList.filter(x => x.tc_no == gsRow.tc_no);

        var customer = new Customer({
          userId: mongoose.Types.ObjectId(data.userId),
          tcNo: dbCustomer[0].tc_no,
          firstName: dbCustomer[0].adi,
          lastName: dbCustomer[0].soyadi,
          phone: dbCustomer[0].telefon.replace(/\s+/g, ''),
          email: "",
          isActive: true,
        });
        customer.save().then(function (c) {

          for (let dbRow of dbCustomer) {
            var insurance = new Insurance({
              userId: mongoose.Types.ObjectId(data.userId),
              customerId: c._id,
              startTime: moment(dbRow.baslangic),
              endTime: moment(dbRow.baslangic).add(1, 'year'),
              description: dbRow.aciklama,
              plateNo: dbRow.plaka,
              carRegistNo: dbRow.tescil_no,
              company: dbRow.sirket,
              policyNo: dbRow.police_no,
              grossPrice: dbRow.brut,
              netPrice: dbRow.net,
              commissionRate: dbRow.oran,
              commissionPrice: dbRow.komisyon,
              isActive: dbRow.durumu,
            });
            insurance.save();
          }
        });
      }
      console.log("bitti");
      return apiResponse.successResponseWithData(res, apiResponse.Success, {});
    });
  });
}

function CustomerData(data) {
  this.id = data._id;
  this.userId = data.userId;
  this.firstName = data.firstName;
  this.lastName = data.lastName;
  this.phone = data.phone;
  this.email = data.email;
  this.tcNo = data.tcNo;
  this.isActive = data.isActive;
  this.created = data.created;
  this.updated = data.updated;
}