// Script to create a test product in the database
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product-model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestProduct = async () => {
  try {
    // Product data with proper image structure
    const productData = {
      name: 'Advanced Python Programming',
      description: 'Master the art of Python programming with this comprehensive guide covering advanced topics, best practices, and real-world applications.',
      price: 44.99,
      category: 'Programming',
      subcategory: 'Python',
      brand: 'Tech Publishers',
      sku: 'PY-2023-002',
      stock: 18,
      discount: 15,
      ratings: {
        average: 4.7,
        count: 23
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHB5dGhvbiUyMHByb2dyYW1taW5nfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
          altText: 'Python Programming Book'
        },
        {
          url: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHB5dGhvbiUyMHByb2dyYW1taW5nfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
          altText: 'Python code example'
        },
        {
          url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGJvb2slMjBiYWNrJTIwY292ZXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60',
          altText: 'Book back cover'
        }
      ],
      tags: ['Python', 'Programming', 'Advanced', 'Data Science', 'Machine Learning'],
      sellerId: '655f4b52b24fdf3c95969127', // Replace with your seller ID if needed
      specifications: {
        pages: 520,
        language: 'English',
        publisher: 'Tech Press',
        publicationDate: '2023-06-22',
        isbn: '978-1-2345-6789-1'
      },
      isFeatured: true,
      isPublished: true,
      approvalStatus: 'approved',
      approvalDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if product with same SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    
    if (existingProduct) {
      console.log('Product with this SKU already exists. Creating with a modified SKU.');
      productData.sku = `${productData.sku}-${Date.now()}`;
    }

    const product = new Product(productData);
    await product.save();
    
    console.log('Test product created successfully!');
    console.log(JSON.stringify(product, null, 2));
  } catch (error) {
    console.error('Error creating test product:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Connect to DB and create test product
connectDB().then(() => {
  createTestProduct();
}); 