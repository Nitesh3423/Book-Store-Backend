const mongoose = require('mongoose');
const Product = require('../models/product-model');
const User = require('../models/user-model');
const ProductReview = require('../models/product-review-model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding reviews'))
.catch(err => console.error('MongoDB connection error:', err));

const seedReviews = async () => {
  try {
    // Clear existing reviews
    await ProductReview.deleteMany({});
    console.log('Cleared existing reviews');

    // Find some products to add reviews to
    const products = await Product.find().limit(10);
    if (products.length === 0) {
      console.log('No products found. Please run seed-products.js first.');
      process.exit(1);
    }
    
    // Find some users to assign as reviewers
    const users = await User.find().limit(5);
    if (users.length === 0) {
      console.log('No users found. Creating demo users for reviews...');
      
      // Create some demo users if none exist
      const demoUsers = [
        {
          name: 'Rajesh Kumar',
          email: 'rajesh@example.com',
          password: 'password123',
          role: 'customer'
        },
        {
          name: 'Priya Sharma',
          email: 'priya@example.com',
          password: 'password123',
          role: 'customer'
        },
        {
          name: 'Amit Singh',
          email: 'amit@example.com',
          password: 'password123',
          role: 'customer'
        }
      ];
      
      for (const userData of demoUsers) {
        const user = new User(userData);
        await user.save();
        users.push(user);
      }
    }
    
    // Sample review texts
    const positiveReviews = [
      "This book exceeded my expectations. The content is well-structured and easy to understand.",
      "Excellent book! The author has a great writing style that keeps you engaged throughout.",
      "One of the best books I've read on this subject. Very comprehensive and detailed.",
      "Great value for money. The quality of content is exceptional.",
      "This book has helped me tremendously. I highly recommend it to anyone interested in this topic."
    ];
    
    const neutralReviews = [
      "Decent book with good information, but some chapters could have been more detailed.",
      "The book is okay. It has useful information but the presentation could be better.",
      "Average read. Good for beginners but might be too basic for experienced readers.",
      "Not bad, but I expected more examples and practical applications.",
      "Some parts were very good while others were a bit dry. Overall, worth reading."
    ];
    
    const negativeReviews = [
      "Disappointed with this book. The content seems outdated and not very relevant.",
      "The book arrived with damaged pages. The content is also not what I expected.",
      "I found several errors in the book which made it confusing to follow.",
      "Not worth the price. The information is too basic and can be found online for free.",
      "The book is poorly structured and hard to follow. Would not recommend."
    ];
    
    const reviewsToCreate = [];
    
    // Generate random reviews for each product
    for (const product of products) {
      const numberOfReviews = Math.floor(Math.random() * 5) + 1; // 1-5 reviews per product
      
      for (let i = 0; i < numberOfReviews; i++) {
        // Randomly select a user
        const user = users[Math.floor(Math.random() * users.length)];
        
        // Randomly determine the rating (weighted towards positive)
        const rating = Math.floor(Math.random() * 5) + 1;
        
        // Select review text based on rating
        let reviewText;
        let title;
        
        if (rating >= 4) {
          reviewText = positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
          title = "Excellent read";
        } else if (rating === 3) {
          reviewText = neutralReviews[Math.floor(Math.random() * neutralReviews.length)];
          title = "Decent book";
        } else {
          reviewText = negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
          title = "Disappointed";
        }
        
        // Create aspect ratings (for some reviews)
        const hasAspects = Math.random() > 0.5;
        const aspects = hasAspects ? [
          {
            aspectName: 'Content Quality',
            aspectRating: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1))
          },
          {
            aspectName: 'Value for Money',
            aspectRating: Math.min(5, Math.max(1, rating + Math.floor(Math.random() * 2) - 1))
          }
        ] : [];
        
        // Random date in the past 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - daysAgo);
        
        // Create review
        const review = {
          productId: product._id,
          userId: user._id,
          rating,
          title,
          reviewText,
          reviewDate,
          authorName: user.name,
          authorLocation: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'][Math.floor(Math.random() * 5)],
          verifiedPurchase: Math.random() > 0.2, // 80% chance of being verified
          helpfulVotes: Math.floor(Math.random() * 20),
          notHelpfulVotes: Math.floor(Math.random() * 5),
          aspects
        };
        
        reviewsToCreate.push(review);
      }
    }
    
    // Insert all reviews
    await ProductReview.insertMany(reviewsToCreate);
    console.log(`${reviewsToCreate.length} reviews seeded successfully!`);
    
    // Update product ratings
    for (const product of products) {
      const productReviews = await ProductReview.find({ productId: product._id });
      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / productReviews.length;
        
        await Product.findByIdAndUpdate(product._id, {
          ratings: {
            average: parseFloat(averageRating.toFixed(1)),
            count: productReviews.length
          }
        });
      }
    }
    
    console.log('Product ratings updated successfully');
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  }
};

seedReviews(); 