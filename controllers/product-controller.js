const Product = require("../models/product-model");

exports.getAllProducts = async (req, res) => {
  try {
    // By default, fetch only approved products
    const filter = req.query.includeAll === 'true' ? {} : { approvalStatus: 'approved' };
    
    // Fetch products based on filter
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ success: false, error: "Could not fetch products" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).json({ success: false, error: "Could not fetch product" });
  }
};

exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Get the current product
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find related products based on category and subcategory
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: currentProduct.category,
      approvalStatus: 'approved'
    })
    .limit(Number(limit))
    .sort({ 'ratings.average': -1 });

    res.json(relatedProducts);
  } catch (err) {
    console.error("Error fetching related products:", err.message);
    res.status(500).json({ error: "Could not fetch related products" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      approvalStatus: 'pending',
    });

    await newProduct.save();
    res.status(201).json({
      success: true,
      message: "Product created and pending approval",
      product: newProduct,
    });
  } catch (err) {
    console.error("Error creating product:", err.message);
    res.status(500).json({ success: false, error: "Could not create product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const importantFields = ['name', 'price', 'description', 'category'];
    const needsReapproval = importantFields.some(field => updates[field] !== undefined);

    if (needsReapproval) {
      updates.approvalStatus = 'pending';
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({
      success: true,
      message: needsReapproval ? "Product updated and requires re-approval" : "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("Error updating product:", err.message);
    res.status(500).json({ success: false, error: "Could not update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).json({ success: false, error: "Could not delete product" });
  }
};

// Admin specific endpoints
exports.getPendingProducts = async (req, res) => {
  try {
    const pendingProducts = await Product.find({ approvalStatus: 'pending' });
    res.json({ success: true, pendingProducts });
  } catch (err) {
    console.error("Error fetching pending products:", err.message);
    res.status(500).json({ success: false, error: "Could not fetch pending products" });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'approved',
        approvalDate: Date.now(),
        approvalNote: req.body.note || 'Product approved by admin',
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product approved successfully",
      product,
    });
  } catch (err) {
    console.error("Error approving product:", err.message);
    res.status(500).json({ success: false, error: "Could not approve product" });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.note) {
      return res.status(400).json({ success: false, error: "Rejection reason is required" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'rejected',
        approvalDate: Date.now(),
        approvalNote: req.body.note,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, message: "Product rejected", product });
  } catch (err) {
    console.error("Error rejecting product:", err.message);
    res.status(500).json({ success: false, error: "Could not reject product" });
  }
};

// Admin delete product
exports.adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Admin attempting to delete product with ID: ${id}`);

    if (!req.admin) {
      console.error("Admin authentication missing");
      return res.status(401).json({ success: false, error: "Admin authentication required" });
    }

    console.log(`Admin authenticated: ${req.admin.email}`);

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error(`Invalid product ID format: ${id}`);
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    const product = await Product.findById(id);

    if (!product) {
      console.error(`Product not found with ID: ${id}`);
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    await Product.findByIdAndDelete(id);
    console.log(`Successfully deleted product: ${id}`);

    res.json({
      success: true,
      message: "Product deleted successfully by admin",
      deletedProduct: {
        id: product._id,
        name: product.name,
      },
    });
  } catch (err) {
    console.error(`Error deleting product by admin: ${err.message}`);
    res.status(500).json({ success: false, error: "Could not delete product", details: err.message });
  }
};
