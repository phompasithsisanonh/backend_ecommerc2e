const sellerModel = require("../models/sellerModel");

///ດືງລາຍຊື່ ຜູ້ຂາຍທັງໝົດ
const request_seller_get = async (req, res) => {
  try {

      const sellers = await sellerModel
        .find({ status: "pending" })
        .sort({ createdAt: -1 });
      const totalSeller = await sellerModel
        .find({ status: "pending" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
  } catch (error) {
    console.log(error);
  }
};
//ດຶງສະເພາະຄົນດຽວ
const get_seller = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const seller = await sellerModel.findById(sellerId);
    res.status(200).json({ seller });
  } catch (error) {
    console.log(error);
  }
};
const seller_status_update = async (req, res) => {
  const { sellerId, status } = req.body;
  try {
    await sellerModel.findByIdAndUpdate(sellerId, { status });
    const seller = await sellerModel.findById(sellerId);
    res
      .status(200)
      .json({ seller, message: "Seller Status Updated Successfully" });
  } catch (error) {
    console.log(error);
  }
};

module.exports.request_seller_get = request_seller_get;
module.exports.get_seller = get_seller;
module.exports.seller_status_update  = seller_status_update ;
