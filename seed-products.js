require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product-model');
const Seller = require('./models/seller-model');
const connectDB = require('./utils/db');

// Sample product data
const sampleProducts = [
  {
    name: 'Vintage Hardcover Classic Novel',
    description: 'First edition vintage hardcover classic novel with original dust jacket. Perfect for collectors, this rare book features gilded edges and a beautifully preserved binding.',
    brand: 'Penguin Classics',
    category: 'Books',
    subcategory: 'Fiction',
    sku: 'BOOK001',
    price: 49.99,
    discount: 0,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e',
        altText: 'Vintage book cover'
      }
    ],
    stock: 15,
    specifications: {
      material: 'Hardcover',
      size: '5.5 x 8.5 inches',
    },
    tags: ['classic', 'vintage', 'collector', 'fiction'],
    returnPolicy: '30-day return policy for unopened items',
    isFeatured: true,
  },
  {
    name: 'Modern Philosophy Anthology',
    description: 'Comprehensive anthology of modern philosophical works covering existentialism, phenomenology, and post-structuralism. Includes annotations and commentary from leading scholars.',
    brand: 'Oxford University Press',
    category: 'Books',
    subcategory: 'Philosophy',
    sku: 'BOOK002',
    price: 85.50,
    discount: 10,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
        altText: 'Philosophy book cover'
      }
    ],
    stock: 20,
    specifications: {
      material: 'Paperback',
      size: '6 x 9 inches',
    },
    tags: ['philosophy', 'academic', 'anthology'],
    returnPolicy: '14-day return policy',
    isFeatured: false,
  },
  {
    name: 'Children\'s Illustrated Encyclopedia',
    description: 'Full-color illustrated encyclopedia designed for young readers ages 8-12, covering science, history, geography, and more with engaging visuals and simplified explanations.',
    brand: 'DK Publishing',
    category: 'Books',
    subcategory: 'Children',
    sku: 'BOOK003',
    price: 29.99,
    discount: 15,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1530538987395-032d1800fdd4',
        altText: 'Children\'s encyclopedia cover'
      }
    ],
    stock: 35,
    specifications: {
      material: 'Hardcover',
      size: '9 x 11 inches',
    },
    tags: ['children', 'educational', 'illustrated'],
    returnPolicy: '30-day satisfaction guarantee',
    isFeatured: true,
  },
  {
    name: 'Technical Programming Reference',
    description: 'Comprehensive programming reference covering advanced algorithms, data structures, and system design patterns with practical examples in multiple languages.',
    brand: 'O\'Reilly Media',
    category: 'Books',
    subcategory: 'Technology',
    sku: 'BOOK004',
    price: 59.99,
    discount: 5,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d',
        altText: 'Programming book cover'
      }
    ],
    stock: 25,
    specifications: {
      material: 'Paperback',
      size: '7 x 9 inches',
    },
    tags: ['programming', 'technical', 'reference', 'technology'],
    returnPolicy: '30-day no-questions-asked return',
    isFeatured: false,
  },
  {
    name: 'Historical Biography Collection',
    description: 'Boxed set of award-winning historical biographies featuring influential figures from the 20th century, including politicians, scientists, and cultural icons.',
    brand: 'Simon & Schuster',
    category: 'Books',
    subcategory: 'Biography',
    sku: 'BOOK005',
    price: 120.00,
    discount: 20,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73',
        altText: 'Biography collection box set'
      }
    ],
    stock: 10,
    specifications: {
      material: 'Mixed Hardcover/Paperback',
      size: 'Various',
    },
    tags: ['biography', 'history', 'collection', 'boxed set'],
    returnPolicy: '15-day return for undamaged items',
    isFeatured: true,
  }
];

// Connect to DB and seed products
connectDB()
  .then(async () => {
    try {
      // Find a seller to associate with products
      const seller = await Seller.findOne({});
      
      if (!seller) {
        console.log('No seller found in the database. Please create a seller first.');
        mongoose.connection.close();
        return;
      }
      
      console.log(`Found seller: ${seller.fullName} (${seller.email})`);
      
      // First remove existing test products
      await Product.deleteMany({ sku: { $in: sampleProducts.map(p => p.sku) } });
      console.log('Removed existing test products with matching SKUs');
      
      // Create products with seller ID and pending status
      const productPromises = sampleProducts.map(product => {
        const newProduct = new Product({
          ...product,
          sellerId: seller._id,
          approvalStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return newProduct.save();
      });
      
      const createdProducts = await Promise.all(productPromises);
      
      console.log(`Successfully created ${createdProducts.length} pending products:`);
      createdProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (SKU: ${product.sku})`);
      });
      
      console.log('\nProduct approval requests are now ready for testing in the admin dashboard!');
      
      // Close the connection
      mongoose.connection.close();
    } catch (error) {
      console.error('Error seeding products:', error);
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Failed to connect to the database:', err);
  }); 