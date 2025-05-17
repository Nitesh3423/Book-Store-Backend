// Script to create a product with pending approval status
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

const createPendingProduct = async () => {
  try {
    // Product data with pending approval status
    const productData = {
      name: 'Advanced Digital Marketing Strategies',
      description: 'A comprehensive guide to modern digital marketing techniques including SEO, social media, content marketing, and analytics.',
      price: 42.99,
      category: 'Business',
      subcategory: 'Marketing',
      brand: 'Business Press',
      sku: 'BIZ-2023-001',
      stock: 35,
      discount: 10,
      ratings: {
        average: 0,
        count: 0
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hcmtldGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
          altText: 'Digital Marketing Book'
        },
        {
          url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG1hcmtldGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
          altText: 'Marketing graphs'
        }
      ],
      tags: ['Marketing', 'Business', 'SEO', 'Social Media', 'Analytics'],
      sellerId: '655f4b52b24fdf3c95969127', // Replace with your seller ID if needed
      specifications: {
        pages: 410,
        language: 'English',
        publisher: 'Business Press',
        publicationDate: '2023-05-10',
        isbn: '978-1-2345-6789-6'
      },
      isFeatured: true,
      isPublished: true,
      approvalStatus: 'pending', // Setting as pending
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
    
    console.log('Pending approval product created successfully!');
    console.log(JSON.stringify(product, null, 2));
  } catch (error) {
    console.error('Error creating pending product:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Connect to DB and create pending product
connectDB().then(() => {
  createPendingProduct();
}); 