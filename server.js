import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "tmp/" });

mongoose
  .connect("mongodb+srv://admin:12Sm8O43@athelon.n4ntkjl.mongodb.net/AthelonDB?appName=Athelon")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  color: String,
  description: String,
  oldPrice: Number,
  newPrice: Number,
  sizes: [String],
  rating: Number,
  category: String,
  brand: String,
  images: [String],
  inStock: Number,       
  available: Boolean,     
});

const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
  items: [
    {
      id: Number,
      name: String,
      price: Number,
      size: String,
      color: String,
      quantity: Number,
      image: String,
    },
  ],
  total: Number,
  status: {
    type: String,
    enum: ["новий", "в обробці", "відправлено", "доставлено", "скасовано"],
    default: "новий",
  },
  customer: {
    name: String,
    surname: String,
    phone: String,
    mail: String,
  },
  city: String,
  department: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);


app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products",
    });
    fs.unlinkSync(req.file.path);
    res.json({ url: result.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    await Product.updateOne({ id: Number(req.params.id) }, { $set: req.body });
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/products/:id/stock", async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) return res.status(404).json({ error: "Товар не знайдений" });
    if (product.inStock < quantity)
      return res.status(400).json({ error: "Недостатньо товару на складі" });

    product.inStock -= quantity;
    product.available = product.inStock > 0; // автоматично оновлює наявність
    await product.save();
    res.json({ success: true, inStock: product.inStock, available: product.available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.deleteOne({ id: Number(req.params.id) });
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, total, name, surname, phone, mail, city, department } = req.body;
    const order = new Order({
      items,
      total,
      customer: { name, surname, phone, mail },
      city,
      department,
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: "Не вдалося створити замовлення" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: "Невірний ідентифікатор" });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: "Не вдалося оновити замовлення" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));