const FollowingModel = require("../../models/following_peopleModel"); // เส้นทางที่คุณใช้

// ฟังก์ชันการติดตามผู้ขาย
const followSeller = async (req, res) => {
  try {
    const { userId, followSellerId } = req.body; // รับข้อมูลจาก request

    // ค้นหาผู้ใช้งานที่ทำการติดตาม
    let following = await FollowingModel.findOne({ customers: userId });
    if (!following) {
      // ถ้ายังไม่มีข้อมูลการติดตาม ให้สร้างใหม่
      following = new FollowingModel({
        customers: userId,
        following: [followSellerId],
      });
      await following.save();
    } else {
      // ถ้ามีข้อมูลการติดตามแล้ว ให้เพิ่มผู้ขายที่ต้องการติดตาม
      const isFollowed = following.following.includes(followSellerId);
      if (isFollowed) {
        return res
          .status(400)
          .json({ message: "Already following this seller" });
      }
      following.following.push(followSellerId);
      await following.save();
    }
    res
      .status(200)
      .json({ message: "Successfully followed the seller", following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const unfollowSeller = async (req, res) => {
  try {
    const { userId, unfollowSellerId } = req.body;

    // ค้นหาผู้ใช้ที่ติดตาม
    let following = await FollowingModel.findOne({ customers: userId });
    if (!following) {
      return res.status(404).json({ message: "No following data found" });
    }

    // ตรวจสอบว่าผู้ใช้กำลังติดตามผู้ขายนี้อยู่หรือไม่
    if (!following.following.includes(unfollowSellerId)) {
      return res.status(400).json({ message: "Not following this seller" });
    }

    // ใช้ $pull เพื่อลบ unfollowSellerId ออกจากอาร์เรย์ following
    await FollowingModel.updateOne(
      { customers: userId },
      { $pull: { following: unfollowSellerId } }
    );

    res.status(200).json({ message: "Successfully unfollowed the seller" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ฟังก์ชันการดูรายชื่อผู้ขายที่ติดตาม
const getFollowingSellers = async (req, res) => {
  try {
    const { userId ,followSellerId} = req.params;

    const following = await FollowingModel.findOne({ customers: userId }).populate('following');
    if (!following) {
      return res.status(404).json({ message: "No following data found" });
    }
console.log( userId)
    res.status(200).json({ following: following.following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.followSeller = followSeller;
module.exports.getFollowingSellers = getFollowingSellers;
module.exports.unfollowSeller = unfollowSeller;
