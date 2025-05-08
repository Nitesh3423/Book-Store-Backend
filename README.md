# Book Store Backend

A robust Node.js backend API for an e-commerce book store, handling user authentication, product management, orders, and more.

## Features

- **Authentication System**: JWT-based authentication for users, sellers, and admins
- **User Management**: Registration, login, profile management
- **Seller Platform**: Seller onboarding, product management, order fulfillment
- **Product Catalog**: Comprehensive product management with categories and search
- **Order Processing**: Cart management, checkout, payment integration
- **Admin Dashboard API**: Backend for admin operations and store management

## Tech Stack

- Node.js and Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- RESTful API architecture
- Middleware for request validation and authorization

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `POST /api/sellers/register` - Register a new seller
- `POST /api/sellers/login` - Seller login
- `POST /api/admin/login` - Admin login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/sellers/add-product` - Add a new product (seller only)
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Sellers
- `GET /api/sellers/profile` - Get seller profile
- `PUT /api/sellers/profile` - Update seller profile
- `GET /api/sellers/products` - Get seller's products
- `GET /api/sellers/orders` - Get seller's orders
- `GET /api/sellers/dashboard/stats` - Get seller dashboard statistics

### Admin
- `GET /api/admin/sellers` - Get all sellers
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `POST /api/admin/approve-seller/:id` - Approve a seller

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/Book-Store-Backend.git
cd Book-Store-Backend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env` file in the root directory and add:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your_jwt_secret_key
```

4. Start the server
```bash
# Development mode
npm run dev
# or
yarn dev

# Production mode
npm start
# or
yarn start
```

## Project Structure

```
/
├── controllers/         # Request handlers
├── models/              # Database models
├── middlewares/         # Custom middleware
├── routes/              # API routes
├── utils/               # Utility functions
├── config/              # Configuration files
├── server.js            # Entry point
└── package.json         # Project dependencies
```

## Database Schema

The application uses the following main collections:
- Users
- Sellers
- Products
- Orders
- Categories
- Reviews

## Error Handling

The API uses standard HTTP status codes for responses:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error 