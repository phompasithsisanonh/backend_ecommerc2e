const customerOrder = require("../../../models/customerOrder");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const moment = require("moment");
const authOrderModel = require("../../../models/authOrder");
const SucessPayments = require("../../../models/successpaymentModel");
const productsModel = require("../../../models/productModel");
const Coupon = require("../../../models/CouponModel");
///in profile get
/// ຢູ່ໜ້າໂປຣໄຟຣ ລໍຖ້າຊຳລະເງິນ
const get_waittingpayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const findPaymentNotpay = await customerOrder.find({
      customerId: userId,
      payment_status: "ລໍຖ້າ",
    });

    if (findPaymentNotpay) {
      res.status(200).json({
        waitpayment: findPaymentNotpay,
        payment_count: findPaymentNotpay.length,
      });
    } else {
      res.status(404).json({
        message: "not have Items",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
//ສະຖານະການສັ່ງຊຶ້
const get_statusgpayment = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find orders where payment_status is not 'unpaid'
    const findPaymentNotUnpaid = await customerOrder.find({
      customerId: userId,
      payment_status: { $in: ["check_unpaid", "ຈ່າຍແລ້ວ"] }, // Exclude 'unpaid' status
    });
    if (findPaymentNotUnpaid.length > 0) {
      res.status(200).json({
        statusgpayment: findPaymentNotUnpaid,
        statusgpayment_count: findPaymentNotUnpaid.length,
      });
    } else {
      res.status(404).json({
        message: "No items with a payment status other than 'unpaid'.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
//ປະຫວັດສັ່ງຊື້ສຳເລັດ
const get_status_successpayment = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find orders where payment_status is not 'unpaid'
    const findPaymentNotUnpaid = await customerOrder.find({
      customerId: userId,
      delivery_status: "ຈັດສົ່ງສຳເລັດ",
    });
    if (findPaymentNotUnpaid) {
      res.status(200).json({
        success_payment: findPaymentNotUnpaid,
      });
    } else {
      res.status(404).json({
        message: "No items with a payment status other than 'unpaid'.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/// ຢູ່ໜ້າໂປຣໄຟຣ ປຸມແດງສົງໄປ
const get_paymentInProfileFrotnend = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const pay = await customerOrder.find({
      _id: paymentId,
    });
    if (pay) {
      res.status(200).json({
        pay: pay,
      });
    } else {
      res.status(404).json({
        message: "not have Items",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const add_paymentTocomplete = async (req, res) => {
  try {
    const { id, sellerId } = req.params;

    const customerOr = await customerOrder.findById(id);
    const authId = await authOrderModel.findOne({
      orderId: id,
    });
    if (!customerOr) {
      return res.status(404).json({ message: "คำสั่งซื้อนี้ไม่พบ" });
    }
    for (const item of customerOr.products) {
      const find = await productsModel.findById(item._id);
      if (find && find.stock === 1) {
        await customerOrder.findByIdAndDelete(id);
        return res
          .status(404)
          .json({ message: `❌ ສິນຄ້າ "${item.name}" ໝົດ` });
      }
      //   // if (result.modifiedCount === 1) {
      //   //   return res.status(400).json({
      //   //     message: `❌ ສິນຄ້າ "${item.name}" ໝົດ หรือ สต็อกไม่เพียงพอ`,
      //   //   });
      //   // }
      await productsModel.updateOne(
        { _id: item._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
    }
    const tempDate = moment().format("LLL");
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Error parsing form data" });
      }

      const { images } = files;
      if (!images || (Array.isArray(images) && images.length === 0)) {
        return res.status(400).json({ error: "No image file provided" });
      }

      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });

      let imagesUrl = [];
      if (!Array.isArray(images)) {
        images = [images];
      }

      try {
        for (let i = 0; i < images.length; i++) {
          if (images[i] && images[i].filepath) {
            const result = await cloudinary.uploader.upload(
              images[i].filepath,
              {
                folder: "payment_receipts",
                public_id: `payment_${id}_${Date.now()}`,
                overwrite: true,
              }
            );
            if (!result || !result.url) {
              throw new Error("Failed to upload image to Cloudinary");
            }
            imagesUrl.push(result.url);
          }
        }

        const newPayment = new SucessPayments({
          detailsId: id,
          authId: authId._id,
          images: imagesUrl,
          datePayment: tempDate,
          customerId: sellerId,
        });

        await newPayment.save();
        await customerOrder.findByIdAndUpdate(id, {
          payment_status: "check_unpaid",
        });
        await authOrderModel.findOneAndUpdate(
          { orderId: id },
          { payment_status: "check_unpaid" }
        );
        // // // อัปเดตจำนวนการใช้คูปอง
        const findAuthforCoupon = await authOrderModel.findOne({
          orderId: id,
        });
        await Coupon.updateOne(
          { code: findAuthforCoupon.couponCode },
          {
            $inc: { usageCount: 1, usageLimit: -1 },
          }
        );
        return res.status(200).json({
          message:
            "Payment completed, image uploaded, and details saved successfully",
        });
      } catch (uploadError) {
        console.error(uploadError);
        return res.status(500).json({
          error: "Error uploading image to Cloudinary or saving to database",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports.get_waittingpayment = get_waittingpayment;
module.exports.get_paymentInProfileFrotnend = get_paymentInProfileFrotnend;
module.exports.get_statusgpayment = get_statusgpayment;
module.exports.add_paymentTocomplete = add_paymentTocomplete;
module.exports.get_status_successpayment = get_status_successpayment;
