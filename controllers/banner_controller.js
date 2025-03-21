const bannerModel = require("../models/banner");
const productModel = require("../models/productModel");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const banner_s = async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, field, files) => {
    if (err) {
      return res.status(400).json({ message: "Error parsing form data" });
    }

    const { productId } = field;
    let { images } = files;

    // Ensure Cloudinary is configured properly
    cloudinary.config({
      cloud_name: process.env.CLOUND_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
      secure: true,
    });

    try {
      const existingBanner = await bannerModel.findOne({ productId });

      const product = await productModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!Array.isArray(images)) {
        images = images ? [images] : [];
      }

      let allImageUrl = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i] && images[i].filepath) {
          const result = await cloudinary.uploader.upload(images[i].filepath, {
            folder: "banners",
          });
          allImageUrl.push(result.url);
        }
      }

      if (!existingBanner) {
        // Create new banner entry
        const banner = await bannerModel.create({
          productId,
          banner: allImageUrl,
          link: product._id,
        });
        return res.status(200).json({
          message: "Banner added successfully",
          banner,
        });
      } else {
        // Update existing banner by appending new images
        existingBanner.banner = [...existingBanner.banner, ...allImageUrl];
        await existingBanner.save();

        return res.status(200).json({
          message: "Banner updated successfully",
          banner: existingBanner,
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

const get_products_For_admin = async (req, res) => {
  try {
    
    const findProducts = await productModel.find().populate("sellerId");

    // จัดกลุ่มตาม sellerId
    const groupedProducts = findProducts.reduce((acc, product) => {
      const sellerId = product.sellerId?._id.toString(); // แปลง _id เป็น String เพื่อให้จัดกลุ่มง่าย
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: product.sellerId, // ข้อมูลของ seller
          products: [],
        };
      }
      acc[sellerId].products.push(product);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: Object.values(groupedProducts), // แปลง Object เป็น Array ก่อนส่งออก
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
const get_banner = async (req, res) => {
  const { productId } = req.params;
  try {
    const banner = await bannerModel.findOne({ productId: productId });
    res.status(200).json({ get_banners: banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const delete_image_banner = async (req, res) => {
  try {
    const { index } = req.params;
    const { productId } = req.params;
    const bannerFind = await bannerModel.findOne({ productId: productId });
    bannerFind.banner.splice(index, 1); // Remove by index
    await bannerFind.save(); // Save updated document
    res.status(200).json({
      message: "ລົບສຳເລັດ",
    });
  } catch (err) {
    console.log(err);
  }
};
const update_status_buy = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newStatus } = req.body;
    const findUpdate = await productModel.findByIdAndUpdate(productId, {
      status_products: newStatus,
    });
    res.status(200).json({
      message: `ອັດເດດ ${findUpdate. status_products} ສຳເລັດ`,
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.get_products_For_admin = get_products_For_admin;
module.exports.banner_s = banner_s;
module.exports.get_banner = get_banner;
module.exports.delete_image_banner = delete_image_banner;
module.exports.update_status_buy = update_status_buy;
