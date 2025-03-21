const {Schema, model} = require("mongoose");

const cardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "customers",
    },
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "productsModel",
    },
    quantity: {
        type: Number,
        required : true, 
    } 
},{ timestamps: true })

module.exports = model('cardProducts',cardSchema)