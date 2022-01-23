const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customers');
const authController = require('../controllers/auth');

router.use(authController.protect); 
router.route('/').post(customerController.postCustomers);
// rest api
// router.route('/').get(customerController.getAllCustomers);
// router.route('/:id').get(customerController.getCustomer);
// router.route('/').post(customerController.createCustomer);
// router.route('/:id').put(customerController.updateCustomer);
// router.route('/:id').delete(customerController.deleteCustomer);

module.exports = router;