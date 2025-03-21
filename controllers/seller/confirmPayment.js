const authOrderModel = require("../../models/authOrder");
const customerOrder = require("../../models/customerOrder");
const products = require("../../models/productModel");
const amount_seller = require("../../models/amount_seller_model");
const tranfer_seller = require("../../models/transaction");
const admin_wallet = require("../../models/adminWallet");
const Coupon = require("../../models/CouponModel");
const confirmed = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (payment_status === "ຈ່າຍແລ້ວ") {
      const findf = await authOrderModel.findById(id);
      const salesCount = {};
      //ນັບຈຳນວນຫາເພີ່ມທີ່ຂາຍແລ້ວ
      // ລັກສະນະ { // 5f5c7e7f7f6f6f6f6f6f6f6f: 2,}
      findf.products.forEach((order) => {
        const { _id, quantity } = order;
        if (salesCount[_id]) {
          salesCount[_id] += quantity;
        } else {
          salesCount[_id] = quantity;
        }
      });
      // // อัปเดตยอดขายใน productModel
      // ເມື່ອມີການຈ່າຍແລ້ວ ຈະເພີ່ມຈຳນວນສິນຄ້າທີ່ຈ່າຍແລ້ວ
      for (const productId in salesCount) {
        const quantitySold = salesCount[productId];
        await products.findByIdAndUpdate(
          productId, ///ບັນທືກສິນຄ້າ ດ້ວຍລະຫັດໄອດີຕາມສິນຄ້າ
          {
            $inc: { sale: quantitySold }, // ເພີ່ມຈຳນວນທີ່່ຂາຍ ທີ່ຈ່າຍແລ້ວ
          },
          { new: true }
        );
      }
      /////ບັນທືກຈຳນວນເງິນ ຄົ້ນຫາໄອດີ
      const findSellerId = await authOrderModel.findById(id);
      if (!findSellerId) {
        return res.status(404).json({ message: "Order not found" });
      }
      // ค้นหาข้อมูลยอดเงินของผู้ขาຍ ມີໃນລະບົບບໍ່
      const findAmount = await amount_seller.findOne({
        sellerId: findSellerId.sellerId,
      });
      //ຄຳນວນຍອດທີ່ຜູ້ຂາຍຈະໄດ້
      const calute_price =
        findSellerId.price - Math.floor((findSellerId.price * 5) / 100); //ລາຄາ ລົບດ້ວຍຄ່າເປີເຊັນລະບົບ
      await authOrderModel.findByIdAndUpdate(id, {
        total_real_money: calute_price,
        commission: 5,
      }); ///ຫຼັງຈາກນັ້ນອັບເດດເຂົ້າໄປລະບົບ
      ////ຖາມີໃນລະບົບ ຍອດຂອງຜູ້ຊາຍຈະເພີ່ມຈເງິນທີ່ຂາຍ
      if (findAmount) {
        // อัปเดตยอดขายรวมของผู้ขาย
        await amount_seller.findByIdAndUpdate(findAmount._id, {
          $inc: { totalSales: calute_price }, // ใช้ $inc เพื่อบวกค่าเข้าไป
        });
      } else {
        // ຖ້າບໍ່ມີຂໍ້ມູນໃຫ້ສ້າງໃໝ່
        await amount_seller.create({
          sellerId: findSellerId.sellerId,
          totalSales: calute_price,
        });
      }
      ///ຫຼັງຈາກນັນເພີ່ມຄ່າລະບົບໃຫ້ແອດມິນເຂົ້າໄປ
      await admin_wallet.create({
        sellerId: findSellerId.sellerId,
        amount: Math.floor((findSellerId.price * 5) / 100),
      });
    }
    // // // อัปเดตจำนวนการใช้คูปอง
    const findCouponAuthId = await authOrderModel.findById(id);
    if (payment_status === "ຍົກເລີກຄຳສັ່ງຊື້") {
      await Coupon.updateOne(
        { code: findCouponAuthId.couponCode },
        {
          $inc: { usageCount: -1, usageLimit: 1 },
        }
      );
    }
    /// ອັບເດດສະຖານະ ຈ່າຍແລ້ວໃນ ຖານຂໍ້ມູນ ສອງຢ່າງ  ຜູ້ຂາຍ ແລະ ລູກຄ້າ
    if (payment_status) {
      const s = await authOrderModel.findByIdAndUpdate(id, {
        payment_status: payment_status,
      });
      await customerOrder.findByIdAndUpdate(s.orderId, {
        payment_status: payment_status,
      });

      res.status(200).json({
        message: "ອັບເດດສຳເລັດ",
        s,
      });
    }

    // If delivery_status is provided, update it after payment_status update
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//ຢືນຢັ້ນການຈັດສົ່ງສິນຄ້າ
const confirmed_delivery = async (req, res) => {
  try {
    const { id } = req.params; //ຄົ້ນຫາໄອດີດ້ວຍລະຫັດສິນຄ້າ
    const { delivery_status } = req.body; // ປ່ຽນສະຖານະການຈັດສົ່ງສິນຄ້າ
    // ຖ້າສະຖານະການຈັດສົ່ງສິນຄ້າ
    if (delivery_status) {
      const s = await authOrderModel.findByIdAndUpdate(id, {
        delivery_status: delivery_status,
      }); ////ອັບເດດສະຖານະການຈັດສົ່ງສິນຄ້າ
      await customerOrder.findByIdAndUpdate(s.orderId, {
        delivery_status: delivery_status,
      }); //ອັບເດດສະຖານະການຈັດສົ່ງສິນຄ້າ
      res.status(200).json({
        message: "ອັບເດດສຳເລັດ",
      });
    }
    // If delivery_status is provided, update it after payment_status update
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
////ການເພີ່ມການຕັດເງິນ
const add_tranfer = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const {
      bank,
      seller_name_bank,
      amount,
      seller_account_bank_number,
    } = req.body;

    // Ensure all required fields are provided
    if (!bank || !seller_name_bank || !amount || !seller_account_bank_number) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const findAmount = await amount_seller.findOne({ sellerId: sellerId }); ///ຄົ້ນຫາຈຳນວນເງິນຂອງຜູ້ຂາຍ
    // Check if the seller has any sales
    if (findAmount.totalSales === 0 || null) {
      res.status(404).json({ message: "ຈຳນວນເງິນບໍພໍພຽງ" });
    } else {
      // Create the transfer record
      const ran = Math.floor(100000 + Math.random() * 900000); ///ສ້າງລະຫັດໃບສົ່ງເງິນ 6 ໂຕເລກ
      const data = await tranfer_seller.create({
        sellerId,
        bank,
        seller_name_bank,
        amount,
        seller_account_bank_number,
        code_payments_seller: ran,
      });
      res.status(201).json({ message: "ສົ່ງຄຳສັ່ງຖອນສຳເລັດ", data });
    }
  } catch (err) {
    console.error("Error adding transfer:", err);
    res.status(500).json({ message: "ເງິນໃນລະບົບບໍ່ພຽງພໍ" });
  }
};

module.exports.confirmed_delivery = confirmed_delivery;
module.exports.confirmed = confirmed;
module.exports.add_tranfer = add_tranfer;
