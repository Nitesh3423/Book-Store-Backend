const express = require('express');
const router = express.Router();
const {registerUser, loginUser,googleLogin} = require('../controllers/user-controller');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

module.exports = router;
