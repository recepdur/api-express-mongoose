const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const authController = require('../controllers/auth');

router.use(authController.protect);
router.route('/').post(userController.postUsers);
// rest api
// router.route('/').get(userController.getAllUsers);
// router.route('/:id').get(userController.getUser);
// router.route('/').post(userController.createUser);
// router.route('/:id').put(userController.updateUser);
// router.route('/:id').delete(userController.deleteUser);

module.exports = router;