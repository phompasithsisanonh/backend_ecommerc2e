const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const reviewModel = require("../../models/reviewModel");
const moment = require("moment");
const get_categorys = async (req, res) => {
  try {
    const categorys = await categoryModel.find({});
    res.status(200).json({
      categorys,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const formateProduct = (products) => {
  const productArray = [];
  let i = 0;
  while (i < products.length) {
    let temp = [];
    let j = i;
    while (j < i + 4) {
      if (products[j]) {
        temp.push(products[j]);
      }
      j++;
    }
    productArray.push([...temp]);
    i = j;
  }
  return productArray;
};
const get_products = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .limit(12)
      .sort({ createdAt: -1 });
    const allProduct1 = await productModel
      .find({})
      .limit(9)
      .sort({ createdAt: -1 });
    const allProduct2 = await productModel
      .find({})
      .limit(9)
      .sort({ rating: -1 });
    const allProduct3 = await productModel
      .find({})
      .limit(9)
      .sort({ discount: -1 });

    const topRated_product = formateProduct(allProduct2);
    const latest_product = formateProduct(allProduct1);
    const discount_product = formateProduct(allProduct3);

    // Create response object
    const responseData = {
      products,
      latest_product,
      topRated_product,
      discount_product,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const price_range = async (req, res) => {
  try {
    const priceRange = {
      low: 0,
      high: 0,
    };
    const products = await productModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(9); //ລ່າສຸດ
    const latest_product = formateProduct(products);
    const getForPrice = await productModel.find({}).sort({
      price: 1,
    });

    if (getForPrice.length > 0) {
      priceRange.high = getForPrice[getForPrice.length - 1].price;
      priceRange.low = getForPrice[0].price;
    }
    res.status(200).json({
      priceRange,
      latest_product,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const query_product = async (req, res) => {
  try {
    let filterCriteria = {};
    if (req.query.category) {
      filterCriteria.category = req.query.category;
    }

    // ดึงข้อมูลสินค้าจากฐานข้อมูลพร้อมทั้งกรองตามหมวดหมู่
    let products = await productModel
      .find(filterCriteria)
      .sort({ createdAt: -1 });

    let totalProducts = products.length;
    if (req.query.lowPrice && req.query.highPrice) {
      products = products.filter(
        (p) => p.price >= req.query.lowPrice && p.price <= req.query.highPrice
      );
    }
    if (req.query.rating) {
      products = req.query.rating
        ? products.filter(
            (c) =>
              parseInt(req.query.rating) <= c.rating &&
              c.rating < parseInt(req.query.rating) + 1
          )
        : products;
    }
    // การเรียงลำดับตามราคาหากมีการเลือก
    if (req.query.sortPrice) {
      if (req.query.sortPrice === "low-to-high") {
        products.sort((a, b) => a.price - b.price);
      } else if (req.query.sortPrice === "high-to-low") {
        products.sort((a, b) => b.price - a.price);
      }
    }
    // ///skip
    let parPage = 4;
    req.query.parPage = parPage;
    let { pageNumber } = req.query;
    const skipPage = (parseInt(pageNumber) - 1) * req.query.parPage;
    let skipProduct = [];
    for (let i = skipPage; i < products.length; i++) {
      skipProduct.push(products[i]);
    }
    products = skipProduct;
    //  limit
    let temp = [];
    if (products.length > req.query.parPage) {
      for (let i = 0; i < req.query.parPage; i++) {
        temp.push(products[i]);
      }
    } else {
      temp = products;
    }
    products = temp;

    res.status(200).json({
      products,
      totalProducts,
      parPage,
    });
    if (req.query.searchValue) {
      products = req.query.searchValue
        ? products.filter(
            (p) =>
              p.name
                .toUpperCase()
                .indexOf(req.query.searchValue.toUpperCase()) > -1
          )
        : products;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const product_detail = async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await productModel
      .findOne({ _id: slug })
      .populate("sellerId");
    const relatedProducts = await productModel
      .find({
        $and: [
          {
            _id: {
              $ne: product.id, // ไม่เอาสินค้าชิ้นเดิม
            },
          },
          {
            category: {
              $eq: product.category, // อยู่ในหมวดหมู่เดียวกัน  หรือ คล้ายกัน
            },
          },
        ],
      })
      .limit(12);
    const moreProducts = await productModel
      .find({
        $and: [
          {
            _id: {
              $ne: product.id,
            },
          },
          {
            sellerId: {
              $eq: product.sellerId._id,
            },
          },
        ],
      })
      .limit(3);
    res.status(200).json({
      product,
      relatedProducts,
      moreProducts,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const add_reviws = async (req, res) => {
  try {
    const { rating, review, name } = req.body;
    const { productId } = req.params;

    // ✅ สร้างรีวิวใหม่
    await reviewModel.create({
      productId, // ใช้ productId ที่ได้จาก params
      name,
      rating,
      review,
      date: moment().format("LL"), // วันที่เป็นรูปแบบสากล
    });

    // ✅ ดึงรีวิวทั้งหมดของสินค้านั้น
    const reviews = await reviewModel.find({ productId });

    // ✅ คำนวณค่าเฉลี่ยของคะแนนรีวิว
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const productRating = reviews.length
      ? (totalRating / reviews.length).toFixed(1)
      : 0;

    // ✅ อัปเดตคะแนนเฉลี่ยของสินค้า
    await productModel.findByIdAndUpdate(productId, { rating: productRating });

    res.status(200).json({ message: "ສະແດງຄວາມຄິດເຫັນສຳເລັດ" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "ມີຂໍ້ຜິດພາດໃນການບັນທຶກຄວາມຄິດເຫັນ" });
  }
};

const get_reviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewModel.find({ productId: productId });
    res.status(200).json({
      reviews: reviews,
      reviews_count: reviews.length,
    });
  } catch (error) {
    console.log(error);
  }
};
const get_profile_seller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Find all products from this seller
    const find_sellerId = await productModel.find({ sellerId: sellerId });

    // Extract product IDs from the found products
    const productIds = find_sellerId.map((product) => product._id);

    // Find all reviews that match the product IDs
    const find_products_from_review = await reviewModel.find({
      productId: { $in: productIds },
    });

    res.status(200).json({
      products_seller: find_sellerId,
      reviews: find_products_from_review, // Fixed typo from 'reviwes' -> 'reviews'
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" }); // Send an error response
  }
};

module.exports.get_categorys = get_categorys;
module.exports.get_products = get_products;
module.exports.price_range = price_range;
module.exports.query_product = query_product;
module.exports.product_detail = product_detail;
module.exports.add_reviws = add_reviws;
module.exports.get_reviews = get_reviews;
module.exports.get_profile_seller = get_profile_seller;
