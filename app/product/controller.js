const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { policyFor } = require('../policy');

async function index(req, res, next) {
  try {
    let { limit = 10, skip = 0, q = '', category = '', tags = [] } = req.query;
    let criteria = {};

    if (q.length) {
      // --- gabungkan dengan criteria --- //
      criteria = {
        ...criteria,
        name: { $regex: `${q}`, $options: 'i' },
      };
    }

    if (category.length) {
      category = await Category.findOne({ name: { $regex: `${category}` }, $options: 'i' });
      if (category) {
        criteria = { ...criteria, category: category._id };
      }
    }

    if (tags.length) {
      tags = await Tag.find({ name: { $in: tags } });
      criteria = { ...criteria, tags: { $in: tags.map((tag) => tag._id) } };
    }

    const products = await Product.find(criteria).limit(parseInt(limit)).skip(parseInt(skip)).populate('category').populate('tags');
    const count = await Product.find().countDocuments();
    return res.json({ data: products, count });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    let policy = policyFor(req.user);
    if (!policy.can('create', 'Product')) {
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk membuat produk`,
      });
    }

    let payload = req.body;

    if (payload.category) {
      let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
      if (category) {
        payload = { ...payload, category: category._id };
      } else {
        delete payload.category;
      }
    }

    if (payload.tags && payload.tags.length) {
      let tags = await Tag.find({ name: { $in: payload.tags } });
      // (1) cek apakah tags membuahkan hasil
      if (tags.length) {
        // (2) jika ada, maka kita ambil `_id` untuk masing-masing `Tag` dan gabungkan dengan payload
        payload = { ...payload, tags: tags.map((tag) => tag._id) };
      }
    }

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
    //--- cek policy ---/
    let policy = policyFor(req.user);
    if (!policy.can('update', 'Product')) {
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk mengupdate produk`,
      });
    }

    let payload = req.body;

    if (payload.category) {
      let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
      if (category) {
        payload = { ...payload, category: category._id };
      } else {
        delete payload.category;
      }
    }

    if (payload.tags && payload.tags.length) {
      let tags = await Tag.find({ name: { $in: payload.tags } });

      // (1) cek apakah tags membuahkan hasil
      if (tags.length) {
        // (2) jika ada, maka kita ambil `_id` untuk masing-masing `Tag` dan gabungkan dengan payload
        payload = { ...payload, tags: tags.map((tag) => tag._id) };
      }
    }

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
    //--- cek policy ---/
    let policy = policyFor(req.user);
    if (!policy.can('delete', 'Product')) {
      // <-- can delete
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk menghapus produk`,
      });
    }

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
