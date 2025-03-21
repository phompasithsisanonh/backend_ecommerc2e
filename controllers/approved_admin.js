const tranfer_seller = require("../models/transaction");
const amount_seller = require("../models/amount_seller_model");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");

const get_transation = async (req, res) => {
  try {
    const fin = await tranfer_seller.aggregate([
      {
        $group: {
          _id: "$sellerId", // Group by sellerId (adjust field name if needed)
          transactions: {
            $push: {
              id: "$_id", // Assuming _id is the unique transaction identifier
              amount: "$amount", // Adjust based on your data structure
              status: "$status",
              bank: "$bank",
              code_payments_seller: "$code_payments_seller",
              seller_name_bank: "$seller_name_bank",
              seller_account_bank_number: "$seller_account_bank_number",
              date: "$date",
            },
          },
        },
      },
      {
        $addFields: {
          // Sort the transactions array within each group
          transactions: {
            $sortArray: {
              input: "$transactions",
              sortBy: { date: -1 } // -1 for descending, 1 for ascending
            }
          }
        }
      },
    ]);
    res.status(200).json({
      data: fin,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error retrieving transactions",
    });
  }
};
const approved_admin = async (req, res) => {
  const { id_tran } = req.params;
  const { id } = req;
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Error parsing form data" });
    }

    let { status, messageWhy } = fields;
    let { images } = files;
    if (!images) {
      return res.status(404).json({
        message: "ກະລຸນາເພີ່ມຮູບພາບ",
      });
    }
    // Cloudinary config
    cloudinary.config({
      cloud_name: process.env.CLOUND_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
      secure: true,
    });

    try {
      // Handle "cancel" status
      if (status[0] === "cancel") {
        console.log("sd1");
        await tranfer_seller.findByIdAndUpdate(id_tran, {
          status: Array.isArray(status) ? status[0] : status,
          messageWhy: Array.isArray(messageWhy) ? messageWhy[0] : messageWhy,
        });
        return res.status(404).json({ message: "ຍົກເລິກອະນຸມັດວົງເງິນ" });
      }

      // Handle "completed" status
      if (status[0] === "completed") {
        let allImageUrl = [];
        console.log("sd");
        // Handle image upload only if there are images
        if (images) {
          if (!Array.isArray(images)) {
            images = [images];
          }
          for (let i = 0; i < images.length; i++) {
            if (images[i] && images[i].filepath) {
              const result = await cloudinary.uploader.upload(
                images[i].filepath,
                {
                  folder: "Payment_to_seller",
                }
              );
              allImageUrl.push(result.url);
            }
          }
        }

        // Update the transaction with status, images, and messageWhy
        await tranfer_seller.findByIdAndUpdate(id_tran, {
          adminId: id,
          status: Array.isArray(status) ? status[0] : status,
          images: allImageUrl,
          messageWhy: Array.isArray(messageWhy) ? messageWhy[0] : messageWhy,
        });

        // Update the seller's total sales
        const findtranfer_seller = await tranfer_seller.findById(id_tran);
        const findAmount = await amount_seller.findOne({
          sellerId: findtranfer_seller.sellerId,
        });

        if (findAmount) {
          findAmount.totalSales -= findtranfer_seller.amount;
          await findAmount.save();
        }

        return res.status(200).json({ message: "ອະນຸມັດສຳເລັດ" }); // Successfully approved
      }
      console.log(status);
      // Default response if the status is neither "cancel" nor "completed"
      return res.status(400).json({ error: "Invalid status" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  });
};

module.exports.get_transation = get_transation;
module.exports.approved_admin = approved_admin;
