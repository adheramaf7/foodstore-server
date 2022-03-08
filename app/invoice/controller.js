const { subject } = require('@casl/ability');
const Invoice = require('./model');
const { policyFor } = require('../policy');
const midtrans = require('midtrans-client');
const config = require('../config');

async function show(req, res, next) {
  try {
    let { order_id } = req.params;

    let invoice = await Invoice.findOne({ order: order_id }).populate('order').populate('user');

    // (1) deklarasikan `policy` untuk `user`
    let policy = policyFor(req.user);

    // (2) buat `subjectInvoice`
    let subjectInvoice = subject('Invoice', { ...invoice, user_id: invoice.user._id });

    // (3) cek policy `read` menggunakan `subjectInvoice`
    if (!policy.can('read', subjectInvoice)) {
      return res.json({
        error: 1,
        message: `Anda tidak memiliki akses untuk melihat invoice ini.`,
      });
    }

    return res.json(invoice);
  } catch (err) {
    return res.json({
      error: 1,
      message: `Error when getting invoice.`,
    });
  }
}

let snap = new midtrans.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey,
});

async function initiatePayment(req, res) {
  try {
    let { order_id } = req.params;

    let invoice = await Invoice.findOne({ order: order_id }).populate('order').populate('user');

    if (!invoice) {
      return res.json({
        error: 1,
        message: 'Invoice Not Found',
      });
    }

    let parameter = {
      transaction_details: {
        order_id: invoice.order._id,
        gross_amount: invoice.total,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: invoice.user.full_name,
        email: invoice.user.email,
      },
    };

    let response = await snap.createTransaction(parameter);

    return res.json(response);
  } catch (error) {
    console.log(error);

    return res.json({
      error: 1,
      message: 'Something when wrong',
      errors: error?.message,
    });
  }
}

async function handleMidtransNotification(req, res) {
  try {
    let statusResponse = await snap.transaction.notification(req.body);

    let orderId = statusResponse.order_id;
    let transactionStatus = statusResponse.transaction_status;
    let fraudStatus = statusResponse.fraud_status;

    //untuk handle pembayaran kartu kredit
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        await snap.transaction.approve(orderId);

        await Invoice.findOneAndUpdate({ order: orderId }, { payment_status: 'paid' });

        await Order.findOneAndUpdate({ _id: orderId }, { status: 'processing' });

        return res.json('success');
      }

      if (fraudStatus === 'accept') {
        await Invoice.findOneAndUpdate({ order: orderId }, { payment_status: 'paid' });

        await Order.findOneAndUpdate({ _id: orderId }, { status: 'processing' });

        return res.json('success');
      }

      return res.json('ok');
    }

    // (untuk non kartu kredit, artinya berhasil juga)
    if (transactionStatus === 'settlement') {
      await Invoice.findOneAndUpdate({ order: orderId }, { payment_status: 'paid' }, { new: true });

      await Order.findOneAndUpdate({ _id: orderId }, { status: 'delivered' });

      return res.json('success');
    }

    return res.json('ok');
  } catch (error) {
    return res.status(500).json('Something went wrong');
  }
}

module.exports = { show, initiatePayment, handleMidtransNotification };
