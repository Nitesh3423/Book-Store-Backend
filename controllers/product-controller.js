const Product = require("../models/product-model");

exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      sort = 'popular',
      limit = 12,
      page = 1,
      minPrice,
      maxPrice,
      search,
      isFeatured
    } = req.query;

    // Build filter object
    const filter = { approvalStatus: 'approved' };
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (isFeatured) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
      default:
        sortObj = { 'ratings.average': -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Could not fetch products" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).json({ error: "Could not fetch product" });
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
    res.status(201).json({ message: "Product created and pending approval", product: newProduct });
  } catch (err) {
    console.error("Error creating product:", err.message);
    res.status(500).json({ error: "Could not create product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // If important fields are changed, set approval status back to pending
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
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ 
      message: needsReapproval ? "Product updated and requires re-approval" : "Product updated successfully", 
      product 
    });
  } catch (err) {
    console.error("Error updating product:", err.message);
    res.status(500).json({ error: "Could not update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).json({ error: "Could not delete product" });
  }
};

// Admin specific endpoints
exports.getPendingProducts = async (req, res) => {
  try {
    const pendingProducts = await Product.find({ approvalStatus: 'pending' });
    res.json(pendingProducts);
  } catch (err) {
    console.error("Error fetching pending products:", err.message);
    res.status(500).json({ error: "Could not fetch pending products" });
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
        approvalNote: req.body.note || 'Product approved by admin'
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ message: "Product approved successfully", product });
  } catch (err) {
    console.error("Error approving product:", err.message);
    res.status(500).json({ error: "Could not approve product" });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.body.note) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { 
        approvalStatus: 'rejected',
        approvalDate: Date.now(),
        approvalNote: req.body.note
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ message: "Product rejected", product });
  } catch (err) {
    console.error("Error rejecting product:", err.message);
    res.status(500).json({ error: "Could not reject product" });
  }
};

// Admin delete product
exports.adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Admin attempting to delete product with ID: ${id}`);
    
    if (!req.admin) {
      console.error("Admin authentication missing");
      return res.status(401).json({ error: "Admin authentication required" });
    }
    
    console.log(`Admin authenticated: ${req.admin.email}`);
    
    // Validate the product ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error(`Invalid product ID format: ${id}`);
      return res.status(400).json({ error: "Invalid product ID format" });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      console.error(`Product not found with ID: ${id}`);
      return res.status(404).json({ error: "Product not found" });
    }
    
    console.log(`Found product: ${product.name} (${product._id})`);
    
    // Proceed with deletion
    await Product.findByIdAndDelete(id);
    console.log(`Successfully deleted product: ${id}`);
    
    res.json({ 
      message: "Product deleted successfully by admin",
      deletedProduct: {
        id: product._id,
        name: product.name
      }
    });
  } catch (err) {
    console.error(`Error deleting product by admin: ${err.message}`);
    res.status(500).json({ error: "Could not delete product", details: err.message });
  }
};
