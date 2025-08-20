# Khatabook - Personal Finance Tracker

A simple personal finance tracking application built with Node.js, Express, MongoDB, and EJS.

## Features

- User registration and authentication
- Create, edit, and delete financial records
- Time-based record creation
- Secure password hashing
- Session management

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Create a .env file with:
   MONGODB_URI=mongodb://127.0.0.1:27017/khatabook
   SESSION_SECRET=your-secret-key
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Deployment on Render

### Prerequisites

1. **MongoDB Atlas Database**: 
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Get your connection string
   - Whitelist Render's IP addresses (0.0.0.0/0 for testing)

### Render Setup

1. **Connect your GitHub repository** to Render

2. **Create a new Web Service**

3. **Environment Variables** (set these in Render dashboard):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khatabook?retryWrites=true&w=majority
   SESSION_SECRET=your-super-secret-random-string-here
   ```

4. **Build Command**: Leave empty (not needed for Node.js)

5. **Start Command**: `npm start`

### Important Notes

- **MongoDB Atlas**: Ensure your cluster is accessible from Render's servers
- **Connection String**: Use the full connection string from MongoDB Atlas
- **IP Whitelist**: Add `0.0.0.0/0` to MongoDB Atlas IP access list for testing
- **Database Name**: The database will be created automatically when first accessed

### Troubleshooting

If you get "Operation `users.findOne()` buffering timed out after 10000ms":

1. Check your MongoDB Atlas connection string
2. Verify IP whitelist includes Render's servers
3. Ensure your MongoDB Atlas cluster is running
4. Check if your database user has proper permissions

## Project Structure

```
├── app.js              # Main application file
├── models/             # Database models
│   ├── User.js        # User model
│   └── Hisaab.js      # Financial record model
├── views/              # EJS templates
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Dependencies

- Express.js - Web framework
- Mongoose - MongoDB ODM
- EJS - Template engine
- bcryptjs - Password hashing
- express-session - Session management
- Tailwind CSS - Styling
