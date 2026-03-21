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

app.get("/", (req, res) => {
  res.send("Server is running")
})

app.get("/api/products", async (req, res) => {
  const products = await Product.find()
  res.json(products)
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
