const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accounts');
const authController = require('../controllers/auth');

router.use(authController.protect); // Protect all routes after this middleware 
router.route('/').post(accountController.postAccounts);

module.exports = router;