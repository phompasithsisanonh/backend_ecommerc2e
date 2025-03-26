const express = require("express");
const router = express.Router();
const {
  authController,
  authregisteradminController,
  getUser,
  seller_reigster,
  seller_login,
  profile_info_add,
  profile_image_upload,
  get_seller_profile,
  uploadKycDocument,
  verify_admin,
  send_otp,
  updateLastLogin,
} = require("../controllers/authController");
const {
  categoryAdd,
  getcategory,
  updatecategoryAdd,
} = require("../controllers/categoryController");
const {
  get_categorys,
  get_products,
  price_range,
  query_product,
  product_detail,
  add_reviws,
  get_reviews,
  get_profile_seller,
} = require("../controllers/workInUser/homeController");
const {
  productAdd,
  products_get,
  product,
  update_products_seller,
  product_image_update,
} = require("../controllers/productsController");
const {
  request_seller_get,
  get_seller,
  seller_status_update,
} = require("../controllers/sellerController");
const { authMiddlewares } = require("../middlewares/authMiddlewares");
const {
  registerCustomer,
  login_customer,
  edit_profile,
} = require("../controllers/workInUser/authCustomer/authCustomer");
const {
  add_to_card,
  get_card,
  quantity_update_minus,
  quantity_update_plus,
  delete_card,
  wishlists_add,
  get_wishlish,
} = require("../controllers/workInUser/cardController");
const {
  orderAdd,
  get_order,
  get_found_id,
  delete_customer_order,
} = require("../controllers/workInUser/order");
const {
  get_waittingpayment,
  get_paymentInProfileFrotnend,
  add_paymentTocomplete,
  get_statusgpayment,
  get_status_successpayment,
} = require("../controllers/workInUser/payment/payment");
const {
  get_success_payment,
  transaction,
  get_amount,
  get_order_to_admin,
} = require("../controllers/seller/get_controller");
const {
  confirmed,
  confirmed_delivery,
  add_tranfer,
} = require("../controllers/seller/confirmPayment");
const { dash } = require("../controllers/seller/dashboardSeller");
const {
  get_transation,
  approved_admin,
} = require("../controllers/approved_admin");
const { get_admin_messages } = require("../controllers/chat/admin_seller");
const { get_seller_admin } = require("../controllers/getcontroller_admin");
const {
  get_products_For_admin,
  banner_s,
  get_banner,
  delete_image_banner,
  update_status_buy,
} = require("../controllers/banner_controller");
const { dashbord_admin } = require("../controllers/dashbord_admin");
const {
  followSeller,
  getFollowingSellers,
  unfollowSeller,
} = require("../controllers/workInUser/following");
const {
  couponAdd,
  applyCoupon,
  get_all_coupon,
  couponEdit,
} = require("../controllers/coupon");
const { getWallet } = require("../controllers/getWalletAdmin");
const {
  send_email,
  resetPassword,
  sendResetPasswordEmail,
} = require("../utils/nodemalierService");
const { document } = require("../controllers/workInUser/download");

// รับ redisClient จาก index.js
module.exports = (redisClient) => {
  // ส่ง redisClient ไปยัง controller ที่ต้องการ

  // Routes อื่น ๆ ยังคงเหมือนเดิม

  //admin
  router.post("/admin-register", authregisteradminController);
  router.post("/admin-login", authController);
  router.post("/statusverified", authMiddlewares, verify_admin);
  ///seller
  router.post("/seller_reigster", seller_reigster);
  router.post("/seller-login", seller_login);
  router.get("/get_profile", authMiddlewares, get_seller_profile);
  router.post("/uploadKycDocument", authMiddlewares, uploadKycDocument);
  //admin
  router.get("/get-wallet", authMiddlewares, getWallet);
  //categoryAdd
  router.post("/category-add", authMiddlewares, categoryAdd);
  ///add products seller
  router.get("/get-user", authMiddlewares, getUser);
  //get-category
  router.get("/category-get", authMiddlewares, getcategory);
  //get-seller req
  router.get("/request-seller-get", authMiddlewares, request_seller_get);
  //only one seller get
  router.get("/get-seller/:sellerId", authMiddlewares, get_seller);
  //update seller active
  router.post("/seller-status-update", authMiddlewares, seller_status_update);
  router.get("/get_transation", authMiddlewares, get_transation);
  router.post("/approved_admin/:id_tran", authMiddlewares, approved_admin);
  ///get_seller_toadmin
  router.get("/get_seller_admin", authMiddlewares, get_seller_admin);

  ///get
  router.get(
    "/get_products_admin_seller",
    authMiddlewares,
    get_products_For_admin
  );
  router.post("/add_banner", authMiddlewares, banner_s);
  router.get("/get_banner/:productId", authMiddlewares, get_banner);
  router.delete(
    "/delete/:productId/:index",
    authMiddlewares,
    delete_image_banner
  );
  router.post("/status_buy/:productId", authMiddlewares, update_status_buy);
  router.get("/get_order_to_admin", authMiddlewares, get_order_to_admin);

  // router.get("/dashbord_admin", authMiddlewares, (req, res) =>
  //   dashbord_admin(req, res, redisClient)
  // );
  router.get("/dashbord_admin", authMiddlewares, dashbord_admin);
  router.post("/updatecategoryAdd", authMiddlewares, updatecategoryAdd);
  router.post("/coupon-add", authMiddlewares, couponAdd);

  ///seller
  router.post("/product-add", authMiddlewares, productAdd);
  //get-products
  router.get("/products-get", authMiddlewares, products_get);
  //getສົ່ງຄ່າຕາມໄອດີເພື່ອແກໄຂ້ອັບເດດ
  router.get("/product-get/:productId", authMiddlewares, product);
  //ອັບເດດສິນຄ້າ ຂອງຜູ້ຂາຍ seller
  router.post("/product-update", authMiddlewares, update_products_seller);
  //ອັບເດດຮຼບພາບ products_seller
  router.post("/product-image-update", authMiddlewares, product_image_update);
  //update profile seller
  router.post("/profile-info-add", authMiddlewares, profile_info_add);
  //upload profile-seller image
  router.post("/profile-image-upload", authMiddlewares, profile_image_upload);
  //get_controller
  router.get(
    "/get_success_payment/:sellId",
    authMiddlewares,
    get_success_payment
  );
  //confirmPayment
  router.post("/confirmed/:id", authMiddlewares, confirmed);
  router.post("/confirmed_delivery/:id", authMiddlewares, confirmed_delivery);
  ///dashbored seller
  router.get("/dash/:sellId", authMiddlewares, dash);
  ////ສະແດງຍອດເງິນໂອນ seller
  router.get("/transaction/:sellerId", authMiddlewares, transaction);
  router.post("/tranfer/:sellerId", authMiddlewares, add_tranfer);
  router.get("/get_amount/:sellerId", authMiddlewares, get_amount);

  //WorkInUser
  //homeRouter
  router.get("/get-categorys", get_categorys);
  router.get("/get-products", get_products);
  router.get("/price-range-latest-product", price_range);
  router.get("/query-products", query_product);
  router.get("/product-details/:slug", product_detail);
  router.post("/add-reviews/:productId", add_reviws);
  router.get("/get-reviews/:productId", get_reviews);
  router.get("/get_profile_seller/:sellerId", get_profile_seller);
  router.post("/register-customer", registerCustomer);
  router.post("/login-customer", login_customer);
  router.post("/edit_profile/:userId", edit_profile);
  router.post("/add-to-card", add_to_card);
  router.get("/get_card/:userId", get_card);
  router.post("/query-product-plus/:card_id", quantity_update_plus);
  router.post("/query-product-minus/:card_id", quantity_update_minus);
  router.post("/delete-card/:card_id", delete_card);
  router.post("/wishlist/:id", wishlists_add);
  router.get("/get_wishlish/:id", get_wishlish);
  router.post("/order-add", orderAdd);
  router.get("/get-orders/:customerId/:status", get_order);
  router.get("/wait_payment/:userId", get_waittingpayment);
  router.get("/pay/:paymentId", get_paymentInProfileFrotnend);
  router.post("/sucesspayment/:id/:sellerId", add_paymentTocomplete);
  router.get("/get_statusgpayment/:userId", get_statusgpayment);
  router.get("/get_status_successpayment/:userId", get_status_successpayment);
  router.post("/get_found", get_found_id);
  router.post("/delete_customer_order/:id", delete_customer_order);
  router.post("/follow", followSeller);
  router.get("/get-follow/:userId", getFollowingSellers);
  router.post("/unfollow", unfollowSeller);

  ////coupon user
  router.post("/apply-coupon", applyCoupon);
  // router.get("/get-coupon", (req, res) =>
  //   get_all_coupon(req, res, redisClient)
  // );
  router.get("/get-coupon", get_all_coupon);
  router.put("/couponEdit", couponEdit);

  ///reset-passowrd
  router.post("/send_email", send_email);
  router.post("/reset-password/:token", sendResetPasswordEmail);
  router.post("/reset-password", resetPassword);
  router.post("/send_otp", send_otp);
  //lasst-login
  router.get("/updateLastLogin", authMiddlewares, updateLastLogin);
  //download.js
  router.get("/download/:model", document);
  return router;
};
