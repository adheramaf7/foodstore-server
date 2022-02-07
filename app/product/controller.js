const Product = require('./model');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function index(req, res, next) {
  try {
    let { limit = 10, skip = 0 } = req.query;
    const products = await Product.find().limit(parseInt(limit)).skip(parseInt(skip));
    return res.json(products);
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const payload = req.body;

    if (req.file) {
      let tempPath = req.file.path;
      let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
      let filename = req.file.filename + '.' + originalExt;
      let targetPath = path.resolve(config.rootPath, `public/upload/${filename}`);

      // (1) baca file yang masih di lokasi sementara
      const src = fs.createReadStream(tempPath);

      // (2) pindahkan file ke lokasi permanen
      const dest = fs.createWriteStream(targetPath);

      // (3) mulai pindahkan file dari `src` ke `dest`
      src.pipe(dest);

      src.on('end', async () => {
        try {
          let product = new Product({ ...payload, image_url: filename });
          await product.save();
          return res.json(product);
        } catch (error) {
          // (1) jika error, hapus file yang sudah terupload pada direktori
          fs.unlinkSync(target_path);

          // (2) cek apakah error disebabkan validasi MongoDB
          if (err && err.name === 'ValidationError') {
            return res.json({
              error: 1,
              message: err.message,
              fields: err.errors,
            });
          }

          // (3) berikan ke express error lainnya
          next(err);
        }
      });

      src.on('error', async () => {
        next(err);
      });
    } else {
      const product = new Product(payload);
      await product.save();

      return res.json(product);
    }
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: error.message,
        fields: error.errors,
      });
    }

    next(error);
  }
}

async function update(req, res, next) {
  try {
    const payload = req.body;

    if (req.file) {
      let tempPath = req.file.path;
      let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
      let filename = req.file.filename + '.' + originalExt;
      let targetPath = path.resolve(config.rootPath, `public/upload/${filename}`);

      // (1) baca file yang masih di lokasi sementara
      const src = fs.createReadStream(tempPath);

      // (2) pindahkan file ke lokasi permanen
      const dest = fs.createWriteStream(targetPath);

      // (3) mulai pindahkan file dari `src` ke `dest`
      src.pipe(dest);

      src.on('end', async () => {
        try {
          let product = await Product.findOne({ _id: req.params.id });

          // (1) dapatkan path lengkap ke tempat penyimpanan image berdasarkan `product.image_url`;
          let currentImage = `${config.rootPath}/public/upload/${product.image_url}`;

          // (2) cek apakah `file` benar-benar ada di file system
          if (fs.existsSync(currentImage)) {
            // (3) hapus jika ada.
            fs.unlinkSync(currentImage);
          }

          product = await Product.findOneAndUpdate({ _id: req.params.id }, { ...payload, image_url: filename }, { new: true, runValidators: true });

          await product.save();

          return res.json(product);
        } catch (error) {
          // (1) jika error, hapus file yang sudah terupload pada direktori
          fs.unlinkSync(target_path);

          // (2) cek apakah error disebabkan validasi MongoDB
          if (err && err.name === 'ValidationError') {
            return res.json({
              error: 1,
              message: err.message,
              fields: err.errors,
            });
          }

          // (3) berikan ke express error lainnya
          next(err);
        }
      });

      src.on('error', async () => {
        next(err);
      });
    } else {
      let product = await Product.findOneAndUpdate({ _id: req.params.id }, payload, { new: true, runValidators: true });
      await product.save();

      return res.json(product);
    }
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: error.message,
        fields: error.errors,
      });
    }

    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id });

    const currentImage = `${config.rootPath}/public/upload/${product.image_url}`;
    if (fs.existsSync(currentImage)) {
      fs.unlinkSync(currentImage);
    }

    return res.json(product);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  store,
  update,
  destroy,
};
