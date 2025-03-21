const { Schema, model } = require("mongoose");

const adminSellerMsgSchema = new Schema({
    senderName: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true // ต้องมีการระบุ ID ของผู้ขาย
    },
    receiverId: {
        type: String,
        required: true // ID ของแอดมินที่จะรับข้อความ
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'unseen' // ข้อความที่ยังไม่ได้อ่าน
    }
}, { timestamps: true });

module.exports = model('seller_admin_messages', adminSellerMsgSchema);
