const {Schema, model} = require("mongoose");

const wishlistSchema = new Schema({
    userId: {
        type : Schema.ObjectId,
        required : true
    },
    productId: {
        type : Schema.ObjectId,
        required : true,
        ref:"productsModel"
    },
},{ timestamps: true })

module.exports = model('wishlists',wishlistSchema)