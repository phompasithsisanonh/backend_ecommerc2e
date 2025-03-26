const ProductsModel = require("../models/productModel");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
// const Redis = require("ioredis");
// const redis = new Redis();
const productAdd = async (req, res) => {
  try {
    const { id } = req;
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Error parsing form data" });
      }

      let {
        name,
        category,
        description,
        stock,
        price,
        discount,
        shopName,
        brand,
      } = fields;
      let { images } = files;

      name = String(name).trim();
      category = Array.isArray(category) ? category.join(", ") : category;
      description = Array.isArray(description)
        ? description.join(", ")
        : description;
      shopName = Array.isArray(shopName) ? shopName.join(", ") : shopName;
      brand = Array.isArray(brand) ? brand.join(", ") : brand;

      const slug = name.split(" ").join("-").toLowerCase();

      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });

      try {
        let allImageUrl = [];

        if (!Array.isArray(images)) {
          images = [images];
        }

        for (let i = 0; i < images.length; i++) {
          if (images[i] && images[i].filepath) {
            const result = await cloudinary.uploader.upload(
              images[i].filepath,
              {
                folder: "products",
              }
            );
            allImageUrl.push(result.url);
          }
        }
        const ran = Math.floor(100000 + Math.random() * 900000);
        await ProductsModel.create({
          sellerId: id,
          name,
          slug,
          shopName,
          category,
          description,
          stock: parseInt(stock),
          price: parseInt(price),
          discount: parseInt(discount),
          images: allImageUrl,
          brand,
          code_products: ran,
        });

        res.status(200).json({ message: "Added Successfully" });
      } catch (uploadError) {
        console.error(uploadError);
        res.status(500).json({ error: "Error uploading images" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const products_get = async (req, res) => {
  const { id } = req;

  try {
    let products = await ProductsModel.find({ sellerId: id }).sort({
      createdAt: -1,
    });
    const totalProduct = await ProductsModel.find({
      sellerId: id,
    }).countDocuments();
    if (req.query.searchValue) {
      const searchValue = req.query.searchValue.toUpperCase();

      products = products.filter(
        (p) =>
          p.name.toUpperCase().includes(searchValue) ||
          p._id.toString().includes(req.query.searchValue)
      );
      req.query.page = 1;
    }
    // ///skip
    let parPage = 2;
    req.query.parPage = parPage;
    let { page } = req.query;

    const skipPage = (parseInt(page) - 1) * req.query.parPage;
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
    res.status(200).json({ products, totalProduct, parPage });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error fetching products" });
  }
};
const product = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const product = await ProductsModel.findById(productId)

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const update_products_seller = async (req, res) => {
  let {
    name,
    description,
    stock,
    price,
    discount,
    brand,
    productId,
    status_products,
  } = req.body;
  name = String(name).trim();
  const slug = name.split(" ").join("-").toLowerCase();
  try {
    await ProductsModel.findByIdAndUpdate(productId, {
      name,
      description,
      stock,
      price,
      discount,
      brand,
      productId,
      slug,
    });
    ///ເມື່ອອັບເດດແລ້ວສົ່ງຄ່າທີ່ອັບເດດກັບໄປ
    const product = await ProductsModel.findById(productId);
    res.status(200).json({ product, message: "Product Updated Successfully" });
  } catch (error) {
    console.log(error);
  }
};
const product_image_update = async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });
  form.parse(req, async (err, field, files) => {
    const { oldImage, productId } = field;
    let { newImage } = files;

    if (err) {
      return res
        .status(400)
        .json({ message: "เกิดข้อผิดพลาดในการแปลงฟอร์ม", error: err });
    }

    // ตรวจสอบว่า newImage เป็นอาร์เรย์หรืออ็อบเจ็กต์เดียว
    newImage = Array.isArray(newImage) ? newImage : [newImage];

    if (!newImage || newImage.length === 0 || !newImage[0].filepath) {
      return res.status(400).json({ message: "พารามิเตอร์ไฟล์หายไป" });
    }

    try {
      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });
      for (let i = 0; i < newImage.length; i++) {
        if (newImage[i] && newImage[i].filepath) {
          const result = await cloudinary.uploader.upload(
            newImage[i].filepath,
            {
              folder: "products",
            }
          );
          if (result) {
            let { images } = await ProductsModel.findById(productId);
            const index = images.findIndex((img) => oldImage.includes(img));
            images[index] = result.url;
            if (index !== -1) {
              await ProductsModel.findByIdAndUpdate(productId, { images });
              const product = await ProductsModel.findById(productId);
              // http://res.cloudinary.com/de7dle6h2/image/upload/v1736914302/products/uyi1cbusbnttjwxdin5m.jpg
              // ແຍກອອກຈາກການເພື່ອດຶງແຕ່  uyi1cbusbnttjwxdin5m
              const oldPublicId = oldImage[0].split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(`products/${oldPublicId}`);
              res.status(200).json({
                product,
                message: "Product Image Updated Successfully",
              });
            } else {
              return res.status(400).json({ message: "ไม่พบภาพเก่าในสินค้า" });
            }
          } else {
            res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
          }
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error });
    }
  });
};

module.exports.productAdd = productAdd;
module.exports.products_get = products_get;
module.exports.product = product;
module.exports.update_products_seller = update_products_seller;
module.exports.product_image_update = product_image_update;
