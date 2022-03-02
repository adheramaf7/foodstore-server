// (1) import `router` dan `multer`
const router = require('express').Router();
const multer = require('multer');

// (2) import `cartController`
const cartController = require('./controller');

router.get('/carts', cartController.index);
router.put('/carts', multer().none(), cartController.update);

// (4) export router
module.exports = router;
