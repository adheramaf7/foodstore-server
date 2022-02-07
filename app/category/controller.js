const Category = require('./model');
const { policyFor } = require('../policy');

async function store(req, res, next) {
  try {
    //--- cek policy ---/
    let policy = policyFor(req.user);
    if (!policy.can('create', 'Category')) {
      // <-- can delete
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk menambah kategori`,
      });
    }

    const payload = req.body;

    const category = new Category(payload);
    await category.save();

    return res.json(category);
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: error.message,
        fields: error.fields,
      });
    }
    next(error);
  }
}

async function update(req, res, next) {
  try {
    //--- cek policy ---/
    let policy = policyFor(req.user);
    if (!policy.can('update', 'Category')) {
      // <-- can delete
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk mengubah kategori`,
      });
    }

    let payload = req.body;
    let category = await Category.findOneAndUpdate({ _id: req.params.id }, payload, { new: true, runValidators: true });
    return res.json(category);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: err.message,
        fields: err.errors,
      });
    }
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    //--- cek policy ---/
    let policy = policyFor(req.user);
    if (!policy.can('delete', 'Category')) {
      // <-- can delete
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk menghapus kategori`,
      });
    }

    // (1) cari dan hapus categori di MongoDB berdasarkan field _id
    let deleted = await Category.findOneAndDelete({ _id: req.params.id });

    // (2) respon ke client dengan data category yang baru saja dihapus;
    return res.json(deleted);
  } catch (err) {
    // (3) handle kemungkinan error
    next(err);
  }
}

module.exports = {
  store,
  update,
  destroy,
};
