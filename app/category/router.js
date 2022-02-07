const router = require('express').Router();
const multer = require('multer');
const os = require('os');

const CategoryController = require('./controller');

router.post('/categories', multer().none(), CategoryController.store);
router.put('/categories/:id', multer().none(), CategoryController.update);
router.delete('/categories/:id', CategoryController.destroy);

module.exports = router;
