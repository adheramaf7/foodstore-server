const router = require('express').Router();
const multer = require('multer');
const os = require('os');

const TagController = require('./controller');

router.post('/tags', multer().none(), TagController.store);
router.put('/tags/:id', multer().none(), TagController.update);
router.delete('/tags/:id', TagController.destroy);

module.exports = router;
