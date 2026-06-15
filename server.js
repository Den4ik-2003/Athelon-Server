import express from "express"
import mongoose from "mongoose"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect("mongodb+srv://admin:12Sm8O43@athelon.n4ntkjl.mongodb.net/AthelonDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err))

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  team: String,
  sizes: [String],
  oldPrice: Number,
  newPrice: Number,
  sezon: String,
  rating: Number,
  category: String,
  brand: String,
  images: [String],
  inStock: Number,
  reviews: Array
})

const Product = mongoose.model("Product", productSchema)

const orderSchema = new mongoose.Schema({
  items: [
    {
      id: Number,
      name: String,
      price: Number,
      size: String,
      quantity: Number,
      image: String
    }
  ],
  total: Number,
  status: {
    type: String,
    enum: ["новий", "в обробці", "відправлено", "доставлено", "скасовано"],
    default: "новий"
  },
  customer: {
    name: String,
    surname: String,
    patronymic: String,
    phone: String,
    mail: String
  },
  city: String,
  department: String,
  createdAt: { type: Date, default: Date.now }
})

const Order = mongoose.model("Order", orderSchema)

app.get("/", (req, res) => {
  res.send("Server is running")
})

app.get("/api/products", async (req, res) => {
  const products = await Product.find()
  res.json(products)
})

app.post("/api/orders", async (req, res) => {
  try {
    const {
      items,
      total,
      name,
      surname,
      patronymic,
      phone,
      mail,
      city,
      department
    } = req.body

    const order = new Order({
      items,
      total,
      customer: {
        name,
        surname,
        patronymic,
        phone,
        mail
      },
      city,
      department
    })

    await order.save()
    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ error: "Не вдалося створити замовлення" })
  }
})

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" })
  }
})

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" })
    res.json(order)
  } catch (err) {
    res.status(400).json({ error: "Невірний ідентифікатор" })
  }
})

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" })
    res.json(order)
  } catch (err) {
    res.status(400).json({ error: "Не вдалося оновити замовлення" })
  }
})

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: "Замовлення не знайдено" })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" })
  }
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))