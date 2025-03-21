const cardModel = require("../../models/cardModel");
const {
  mongo: { ObjectId },
} = require("mongoose");

const wishlistsModel = require("../../models/wishlish");
const add_to_card = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const product = await cardModel.findOne({
      $and: [
        {
          productId: {
            $eq: productId,
          },
        },
        {
          userId: {
            $eq: userId,
          },
        },
      ],
    });

    if (product) {
      res.status(404).json({ message: "ມີສິນຄ້າໃນຕະກ້າແລ້ວ" });
    } else {
      const product = await cardModel.create({
        userId,
        productId,
        quantity,
      });
      res.status(200).json({ message: "ເພີ່ມສິນຄ້າໃນຕະກ້າສຳເລັດ", product });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const get_card = async (req, res) => {
  const commission = 5;
  const shippingFeePerSeller = 20;
  const { userId } = req.params;

  try {
    const card_products = await cardModel
      .find({ userId })
      .populate("userId")
      .populate("productId");

    let totalProductsInCart = 0; // ລວມສິນຄ້າທັງໝົດໃນກະຕ່າ นับจำนวนสินค้าทั้งหมดในตะกร้า (รวมสินค้าที่มีและไม่มีในสต็อก)
    let totalPurchasableProducts = 0; // ລວມສິນຄ້າທັງໝົດທີ່ສາມາດຊື້ໄດ້
    let totalPrice = 0; // ລວມລາຄາທັງໝົດ

    const outOfStockProducts = []; // ສິນຄ້າທີ່ບໍ່ມີໃນສາງ
    const sellerData = new Map(); // ຂໍ້ມູນຜູ້ຂາຍ

    card_products.forEach((item) => {
      const { quantity, productId } = item; //ຈຳນວນສິນຄ້າ ແລະ ລາຍລະອຽດສິນຄ້າ
      const { stock, price, discount, sellerId, shopName } = productId; //ລາຍລະອຽດສິນຄ້າ

      totalProductsInCart += quantity; //ລວມສິນຄ້າທັງໝົດໃນກະຕ່າ ຈຳນວນສິນຄ້າ

      if (stock < quantity) {
        //ຖ້າຈຳນວນສິນຄ້າໃນຕ້າກ້າຫຼາຍກວ່າສິນຄ້າໃນສະຕ໋ອກ ຈະເພີ່ມເຂົ້າໃນ outOfStockProducts
        outOfStockProducts.push(item);
      } else {
        // ຖ້າຍັງມີສິນຄ້າໃນສະຕ໋ອກດຳເນີນການຕໍ່ການຊື້
        totalPurchasableProducts += quantity; //ລວມສິນຄ້າທັງໝົດທີ່ສາມາດຊື້ໄດ້

        const discountedPrice = discount ///ຄຳນວນລາຄາຫັກສ່ວນຫລຸດ
          ? price - Math.floor((price * discount) / 100)
          : price;
        totalPrice += discountedPrice * quantity; ///ລວມລາຄາທັງໝົດ ຄູນຈຳນວນສິນຄ້າ

        // const finalPrice = discountedPrice - Math.floor((discountedPrice * commission) / 100); //ລາຄາທັງຫມົດຫລັງຫັກສ່ວນຫລຸດ ມາຫັກຄ່າຄອມມິສັນ
        const finalPrice = discountedPrice  //ລາຄາທັງຫມົດຫລັງຫັກສ່ວນຫລຸດ ມາຫັກຄ່າຄອມມິສັນ

        if (!sellerData.has(sellerId.toString())) {
          //❌ ถ้าร้านค้านี้ (sellerId) ยังไม่มีอยู่ใน sellerData → เพิ่มเข้าไป

          //ຖ້າຍັງບໍ່ມີຂໍ້ມູນຜູ້ຂາຍໃນ sellerData ກໍຈະເພີ່ມເຂົ້າໃນຂໍ້ມູນຜູ້ຂາຍ
          sellerData.set(sellerId.toString(), {
            sellerId,
            shopName,
            price: 0,
            products: [],
          });
        }
        //✅ ถ้ามีร้านค้านี้อยู่แล้ว → ข้ามไป ไม่เพิ่มซ้ำ
        const sellerInfo = sellerData.get(sellerId.toString()); //ຂໍ້ມູນຜູ້ຂາຍ
        sellerInfo.price += finalPrice * quantity; //ລວມລາຄາທັງໝົດຂອງຜູ້ຂາຍ
        sellerInfo.products.push({
          _id: item._id,
          quantity,
          productInfo: productId,
        });
      }
    });

    const structuredProducts = Array.from(sellerData.values()); //
    // card_products → รายการสินค้าตามร้านค้า
    // price → ราคาสินค้าที่สามารถซื้อได้
    // card_product_count → จำนวนสินค้าทั้งหมดในตะกร้า
    // shipping_fee → ค่าส่ง (20 บาทต่อร้านค้า)
    // outOfStockProducts → รายการสินค้าที่สต็อกไม่พอ
    // buy_product_item → จำนวนสินค้าที่สามารถซื้อได้
    res.status(200).json({
      card_products: structuredProducts,
      price: totalPrice,
      card_product_count: totalProductsInCart,
      shipping_fee: shippingFeePerSeller * structuredProducts.length,
      outOfStockProducts,
      buy_product_item: totalPurchasableProducts,
    });
  } catch (error) {
    console.error("Error fetching cart details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const quantity_update_plus = async (req, res) => {
  const { card_id } = req.params;
  try {
    const product = await cardModel.findById(card_id);
    const { quantity } = product;
    await cardModel.findByIdAndUpdate(card_id, { quantity: quantity + 1 });
    res.status(200).json({ message: "Qty Updated" });
  } catch (error) {
    console.log(error.message);
  }
};

const quantity_update_minus = async (req, res) => {
  const { card_id } = req.params;
  try {
    const product = await cardModel.findById(card_id);
    const { quantity } = product;
    await cardModel.findByIdAndUpdate(card_id, { quantity: quantity - 1 });
    res.status(200).json({ message: "Qty Updated" });
  } catch (error) {
    console.log(error.message);
  }
};
const delete_card = async (req, res) => {
  const { card_id } = req.params;
  try {
    await cardModel.findByIdAndDelete(card_id);
    res.status(200).json({ message: "Product Deleted" });
  } catch (error) {
    console.log(error.message);
  }
};
const wishlists_add = async (req, res) => {
  const { id } = req.params;
  const { productId } = req.body;
  console.log("id", id);
  console.log(" productId", productId);
  try {
    const wishlistshave = await wishlistsModel.findOne({
      productId: productId,
    });
    if (wishlistshave) {
      await wishlistsModel.findOneAndDelete(id);
      res.status(200).json({ message: "ລົບລາຍການໂປດສຳເລັດ" });
    } else {
      await wishlistsModel.create({
        userId: id,
        productId: productId,
      });
      res.status(200).json({ message: "ເພີ່ມລາຍການໂປດສຳເລັດ" });
    }
  } catch (err) {
    console.log(err);
  }
};
const get_wishlish = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const findwishlisth = await wishlistsModel
      .find({
        userId: id,
      })
      .populate("productId");
    res.status(200).json({
      wishlistCount: findwishlisth.length,
      dataWish: findwishlisth,
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports.add_to_card = add_to_card;
module.exports.get_card = get_card;
module.exports.quantity_update_plus = quantity_update_plus;
module.exports.quantity_update_minus = quantity_update_minus;
module.exports.delete_card = delete_card;
module.exports.wishlists_add = wishlists_add;
module.exports.get_wishlish = get_wishlish;
