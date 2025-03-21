const mongoose = require("mongoose");
const payment_s = require("../../models/successpaymentModel");
const amount_seller = require("../../models/amount_seller_model");
const tranfer_seller = require("../../models/transaction");
//ສະແດງການຊຳລະເງິນຂອງຜູ້ຂາຍ
const get_success_payment = async (req, res) => {
  const { sellId } = req.params; // Get the sellerId from the request params

  if (!sellId) {
    // Check if the sellerId is provided
    return res.status(400).json({ message: "Seller ID is required" });
  }

  const sellerObjectId = new mongoose.Types.ObjectId(sellId); // Convert the sellerId to an ObjectId

  try {
    const findget = await payment_s
      .find({ authId: { $exists: true } }) // Find documents with authId
      .populate({ path: "authId" }) // Populate only sellerId inside authId
      .populate({ path: "detailsId" }) // Populate only sellerId inside authId
      .lean();

    // Filter the populated results to find documents with the matching sellerId
    const filteredResults = findget.filter(
      (item) =>
        item.authId &&
        item.authId.sellerId &&
        item.authId.sellerId.equals(sellerObjectId)
    );

    res.status(200).json({
      success: true,
      authId: filteredResults, // Return only sellerId values
    });
  } catch (error) {
    console.error("Error fetching seller IDs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//ສະແດງຍອດເງິນໂອນ seller
const transaction = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const findAmount = await amount_seller.findOne({ sellerId: sellerId });
    res.status(200).json({
      message: "your amount income",
      data: findAmount,
    });
  } catch (error) {
    console.log(error);
  }
};
const get_amount = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const finded = await tranfer_seller.find({ sellerId });

    let pendingAmount = 0;
    let successAmount = 0;
    let cancelAmount = 0;

    let pendingItems = []; // Fixed: Changed {} to []
    let successItems = []; // Fixed: Changed {} to []
    let cencelItems = []; // Fixed: Changed {} to []

    finded.forEach((item) => {
      if (item.status === "pending") {
        pendingItems.push(item);
        pendingAmount += Number(item.amount) || 0; // Fixed potential NaN issue
      } else if (item.status === "completed") {
        successItems.push(item);
        successAmount += Number(item.amount) || 0;
      } else if (item.status === "cancel") {
        cencelItems.push(item);
        cancelAmount += Number(item.amount) || 0;
      }
    });
    res.status(200).json({
      message: "Transfer Details",
      data: finded,
      pendingItems: pendingItems,
      successItems: successItems,
      cencelItems: cencelItems,
      totalPending: pendingAmount,
      totalSuccess: successAmount,
      totalCancel: cancelAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const get_order_to_admin = async (req, res) => {
  try {
    const findget = await payment_s
      .find({ authId: { $exists: true } }) // Find documents with authId
      .populate({ path: "authId" }) // Populate only sellerId inside authId
      .populate({ path: "detailsId" }) // Populate only sellerId inside authId
      .populate({
        path: "authId",
        populate: {
          path: "sellerId", // Now, populate the sellerId inside authId
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      data: findget, // Return only sellerId values
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.get_success_payment = get_success_payment;
module.exports.transaction = transaction;
module.exports.get_amount = get_amount;
module.exports.get_order_to_admin = get_order_to_admin;
