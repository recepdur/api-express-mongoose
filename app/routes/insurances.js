const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insurances');
const authController = require('../controllers/auth');

router.use(authController.protect); // Protect all routes after this middleware 
router.route('/').post(insuranceController.postInsurances);

module.exports = router;