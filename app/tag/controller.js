const Tag = require('./model');

async function store(req, res, next) {
  try {
    const payload = req.body;

    const tag = new Tag(payload);
    await tag.save();

    return res.json(tag);
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
    let payload = req.body;
    let tag = await Tag.findOneAndUpdate({ _id: req.params.id }, payload, { new: true, runValidators: true });
    return res.json(tag);
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
    // (1) cari dan hapus categori di MongoDB berdasarkan field _id
    let deleted = await Tag.findOneAndDelete({ _id: req.params.id });

    // (2) respon ke client dengan data tag yang baru saja dihapus;
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
