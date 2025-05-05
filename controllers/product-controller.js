const Product = require("../models/product-model");

exports.getAllProducts = async (req, res) => {
  try {
    // Fetch all products
    const products = await Product.find(); //  filters if needed
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Could not fetch products" });
  }
};
