const adminSellerMessage = require("../../models/chat/adminSeller");
const sellerModel = require("../../models/sellerModel");
const get_admin_messages = async (req, res) => {
  const receverId = "";
  const { id } = req.id;

  try {
    const messages = await adminSellerMessage.find({
      $or: [
        {
          $and: [
            {
              receverId: { $eq: id },
            },
          ],
        },
        {
          $and: [
            {
              receverId: { $eq: id },
            },
          ],
        },
      ],
    });
    res.status(200).json({
      message: messages,
    });
  } catch (error) {
    console.log(error);
  }
};
module.exports.get_admin_messages = get_admin_messages;
