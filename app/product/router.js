const router = require('express').Router();
const multer = require('multer');
const os = require('os');

const ProductController = require('./controller');

router.get('/products', ProductController.index);
router.post('/products', multer({ dest: os.tmpdir() }).single('image'), ProductController.store);
router.put('/products/:id', multer({ dest: os.tmpdir() }).single('image'), ProductController.update);
router.delete('/products/:id', ProductController.destroy);

module.exports = router;
