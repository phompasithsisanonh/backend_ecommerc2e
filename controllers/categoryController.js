const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const CategoryModel = require("../models/categoryModel");
const categoryAdd = async (req, res) => {
  const form = new formidable.IncomingForm();

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ message: "Form parsing error" });
      }

      let { name } = fields;
      let { image } = files;

      if (!name || !image) {
        return res.status(400).json({ message: "Name and Image are required" });
      }

      name = String(name).trim();
      const slug = name.split(" ").join("-").toLowerCase();

      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });

      try {
        // ใช้ image.filepath แทนการใช้ image1.filepath
        const result = await cloudinary.uploader.upload(image[0].filepath, {
          folder: "categorys",
        });

        if (result) {
          const category = await CategoryModel.create({
            name,
            slug,
            image: result.url,
          });

          res.status(200).json({
            category,
            message: "Category uploaded successfully",
          });
        } else {
          res.status(500).json({ message: "Cloudinary upload failed" });
        }
      } catch (cloudError) {
        console.error(cloudError);
        res
          .status(500)
          .json({ message: "Cloudinary error", error: cloudError.message });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
const updatecategoryAdd = async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });
  form.parse(req, async (err, field, files) => {
    const { oldImage, categorysId } = field;
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
              folder: "categorys",
            }
          );
          if (result) {
            await CategoryModel.findByIdAndUpdate(categorysId, {
              image: result.url,
            });
            const product = await CategoryModel.findById(categorysId);
            // http://res.cloudinary.com/de7dle6h2/image/upload/v1736914302/ categorys/uyi1cbusbnttjwxdin5m.jpg
            // ແຍກອອກຈາກການເພື່ອດຶງແຕ່  uyi1cbusbnttjwxdin5m
            const oldPublicId = oldImage[0].split("/").pop().split(".")[0];
            console.log(oldPublicId);
            await cloudinary.uploader.destroy(`categorys/${oldPublicId}`);
            res.status(200).json({
              product,
              message: "categorys Image Updated Successfully",
            });
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
const getcategory = async (req, res) => {
  try {
    const categorys = await CategoryModel.find().sort({ createdAt: -1 });

    const totalCategory = await CategoryModel.countDocuments();

    res.status(200).json({ categorys, totalCategory});
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.categoryAdd = categoryAdd;
module.exports.getcategory = getcategory;
module.exports.updatecategoryAdd = updatecategoryAdd;
// Validate image
// const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
// if (!allowedTypes.includes(image.type)) {
//   return res.status(400).json({ message: "Invalid image type. Allowed types: jpg, jpeg, png" });
// }

// if (image.size > 5 * 1024 * 1024) {5MB limit
//   return res.status(400).json({ message: "Image size exceeds 5MB" });
// }

// Cloudinary configuration (move out of the handler if needed)
