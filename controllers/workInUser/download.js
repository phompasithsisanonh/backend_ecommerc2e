const authorOrder = require("../../models/authOrder");
const customerOrder = require("../../models/customerOrder");
const xlsx = require("xlsx");

const models = {
  orderauth: authorOrder,
  customerOrder: customerOrder,
};

const document = async (req, res) => {
  try {
    const { model } = req.params;
    if (!models[model]) {
      return res.status(400).send("Model ไม่ถูกต้อง");
    }

    // ✅ ดึงข้อมูลและ populate customerId
    const data = await models[model]
      .find({ payment_status: "ຈ່າຍແລ້ວ" })
      .populate({ path: "customerId", select: "name email phone" })
      .populate("products");

    console.log(data);

    // ✅ แปลงข้อมูลให้พร้อมสำหรับ Excel
    const formattedData = data.map((item) => ({
      orderId: item._id.toString(),
      customerName: item.customerId?.name || "ไม่พบข้อมูล",
      customerEmail: item.customerId?.email || "ไม่พบข้อมูล",
      customerPhone: item.customerId?.phone || "ไม่พบข้อมูล",
      productCodeId: item.products.map((p) => p.code_products).join(","),
      totalPrice: item.price,
      paymentStatus: item.payment_status,
      deliveryStatus: item.delivery_status,
      shippingcustomerName: item.shippingInfo.name,
      shippingcustomerAddress: `${item.shippingInfo.address}, ${item.shippingInfo.city}, ${item.shippingInfo.province}`,
      shippingcustomerPhone: item.shippingInfo.phone,
      transportcustomerMethod: item.shippingInfo.transport,
      orderDate: item.date,
    }));

    // ✅ สร้างไฟล์ Excel
    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, model);

    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    res.setHeader("Content-Disposition", `attachment; filename=${model}.xlsx`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

module.exports.document = document;
