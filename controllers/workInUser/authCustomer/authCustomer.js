const formidable = require("formidable");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

const customer = require("../../../models/customerModel");
const sellerCustomerModel = require("../../../models/chat/sellerCustomerModel");
const registerCustomer = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const findCustomer = await customer.findOne({ email });
    if (findCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const newCustomer = await customer.create({
        name,
        email,
        password: hashPassword,
        method: "menualy",
      });
      await sellerCustomerModel.create({
        myId: newCustomer._id,
      });
      const token = JWT.sign(
        {
          _id: newCustomer._id,
          name: newCustomer.name,
          email: newCustomer.email,
          method: newCustomer.method,
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      if (token) {
        res.cookie("customerToken", token, {
          httpOnly: true,
          securre: false, //ture HTTPS  //false test HTTP
          sameSite: "Strict",
          maxAge: 24 * 60 * 60 * 1000,
        });
      }
      await newCustomer.save();
      res.status(200).json({
        newCustomer,
        token,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const login_customer = async (req, res) => {
  const { email, password } = req.body;
  try {
    const findCustomer = await customer.findOne({ email }).select("+password");
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    if (!findCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer not found",
      });
    }
    const checkPassword = await bcrypt.compare(password, findCustomer.password);
    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Password not match",
      });
    }
    const token = JWT.sign(
      {
        _id: findCustomer._id,
        name: findCustomer.name,
        email: findCustomer.email,
        method: findCustomer.method,
        address: findCustomer.address,
        province: findCustomer.province,
        city: findCustomer.city,
        transport: findCustomer.transport,
        branch: findCustomer.branch,
        phone: findCustomer.phone,
        images: findCustomer.images,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );
    if (token) {
      res.cookie("customerToken", token, {
        httpOnly: true,
        securre: false, //ture HTTPS  //false test HTTP
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    res.status(200).json({
      success: true,
      message: "login successfully customer",
      token,
    });
  } catch (error) {
    console.log(error);
  }
};
const edit_profile = async (req, res) => {
  try {
    const { userId } = req.params;

    const findCustomer = await customer.findById({ _id: userId });
    if (!findCustomer) {
      return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນລູກຄ້າ" });
    }

    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Error parsing form data" });
      }

      const {
        name,
        address,
        province,
        city,
        transport,
        branch,
        phone,
      } = fields;
      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });
      let images = files.images;
      let allImageUrls = [];

      if (images) {
        if (!Array.isArray(images)) {
          images = [images];
        }

        for (const image of images) {
          if (image && image.filepath) {
            try {
              const result = await cloudinary.uploader.upload(image.filepath, {
                folder: "image_profileUser",
              });
              allImageUrls.push(result.secure_url);
            } catch (uploadErr) {
              console.error("Cloudinary upload error:", uploadErr);
              return res.status(500).json({ message: "Error uploading image" });
            }
          }
        }
      }

      // Update customer fields
      Object.assign(findCustomer, {
        name: Array.isArray(name) ? name[0] : name,
        address: Array.isArray(address) ? address[0] : address,
        province: Array.isArray(province) ? province[0] : province,
        city: Array.isArray(city) ? city[0] : city,
        transport: Array.isArray(transport) ? transport[0] : transport,
        branch: Array.isArray(branch) ? branch[0] : branch,
        phone: Array.isArray(phone) ? phone[0] : phone, // ✅ Fix
        images: allImageUrls, // Save uploaded image URLs
      });

      await findCustomer.save();

      return res.status(200).json({
        message: "ບັນທຶກສຳເລັດ",
        updatedProfile: findCustomer,
      });
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: "ມີຂໍ້ຜິດພາດໃນການບັນທຶກ",
      error: error.message,
    });
  }
};

module.exports.registerCustomer = registerCustomer;
module.exports.login_customer = login_customer;
module.exports.edit_profile = edit_profile;
