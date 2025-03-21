const { Schema, model } = require("mongoose");

const productsSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "SellerModel",
    },
    code_products: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    images: {
      type: [String],

      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    sale: {
      type: Number,
      default: 0,
    },
    status_products: {
      type: String,
      eum: ["ຂາຍ", "ຢຸດຂາຍແລ້ວ"],
      default: "ຂາຍ",
    },
  },
  { timestamps: true }
);
productsSchema.index(
  {
    name: "text",
    category: "text",
    brand: "text",
    description: "text",
  },
  {
    weights: {
      name: 5,
      category: 4,
      brand: 3,
      description: 2,
    },
  }
);
productsSchema.virtual("cardProducts", {
  ref: "cardProducts",
  localField: "_id",
  foreignField: "productId",
});
productsSchema.virtual("wishlists", {
  ref: "wishlists",
  localField: "_id",
  foreignField: "productId",
});
productsSchema.virtual("reviews", {
  ref: "reviews",
  localField: "_id",
  foreignField: "productId",
});
productsSchema.virtual("banners", {
  ref: "banners",
  localField: "_id",
  foreignField: "productId",
});
module.exports = model("productsModel", productsSchema);
