const wallet = require("../models/adminWallet")

const getWallet = async(req, res) => {
  try {
    // Get wallet information from the database
    const walletInfo = await wallet.find({});
    
    // Return success response with wallet data
    return res.status(200).json({
      success: true,
      data: walletInfo
    });
  } catch(err) {
    console.log(err);
    // Return error response
    return res.status(500).json({
      success: false,
      message: "Error retrieving wallet information",
      error: err.message
    });
  }
}

module.exports.getWallet = getWallet;