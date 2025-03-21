const mongoose = require("mongoose");
const payment_s = require("../../models/successpaymentModel");

const dash = async (req, res) => {
  const { sellId } = req.params; //ຮັບລະຫັດຜູ້ຂາຍ

  if (!sellId) {
    ///ຖ້າບໍ່ມີລະຫັດຜູ້ຂາຍ
    return res.status(400).json({ message: "Seller ID is required" });
  }
  const sellerObjectId = new mongoose.Types.ObjectId(sellId); //ສ້າງ ObjectID ຂອງຜູ້ຂາຍ
  try {
    const findget = await payment_s
      .find({ authId: { $exists: true } }) // Find documents with authId
      .populate({ path: "authId" }) // Populate only sellerId inside authId
      .populate({ path: "detailsId" }) // Populate only sellerId inside authId
      .lean();
    ///ຄົ້ນຫາຂໍ້ມູນທີ່ມີລະຫັດຜູ້ຂາຍຂອງຜູ້ຂາຍທີ່ກຳລັງຈ່າຍ

    ///ກອງຂໍ້ມູນທີ່ມີລະຫັດຜູ້ຂາຍຂອງຜູ້ຂາຍທີ່ກຳລັງຈ່າຍ ຕາມສະຖະຈ່າຍແລ້ວ ແລະ ລະຫັດຜູ້ຂາຍ
    // Filter the populated results to find documents with the matching sellerId
    const filteredResults = findget.filter(
      (item) =>
        item.authId &&
        item.authId.sellerId &&
        item.authId.sellerId.equals(sellerObjectId) &&
        item.authId.payment_status === "ຈ່າຍແລ້ວ"
    );
    res.status(200).json({
      success: true,
      dash: filteredResults, // Return only sellerId values
    });
  } catch (error) {
    console.error("Error fetching seller IDs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.dash = dash;
