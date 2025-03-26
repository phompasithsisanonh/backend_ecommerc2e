const seller = require("../models/sellerModel");

const get_seller_admin = async (req, res) => {
  try {
    const findI = await seller.find({});

    res.status(200).json({
      success: true,
      data: findI,
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
      error: error.message,
    });
  }
};
module.exports.get_seller_admin = get_seller_admin;
