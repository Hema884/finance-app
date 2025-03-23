# Finance App

A full-stack personal finance management application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- User Authentication
- Transaction Management
- Budget Tracking
- Bank Account Management
- Analytics Dashboard
- Profile Management

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Cors
- Morgan for logging

### Frontend
- React
- Material-UI
- React Router
- TypeScript
- Axios for API calls

## Project Structure

```
finance-app/
├── backend/             # Backend Node.js server
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── server.js       # Server entry point
│
└── frontend/           # Frontend React application
    ├── public/         # Static files
    └── src/
        ├── components/ # React components
        ├── context/    # React context
        └── App.tsx     # Main application component
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:
   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend development server
   cd ../frontend
   npm start
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Users
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile

### Transactions
- GET `/api/transactions` - Get all transactions
- POST `/api/transactions` - Create new transaction
- PUT `/api/transactions/:id` - Update transaction
- DELETE `/api/transactions/:id` - Delete transaction

### Budgets
- GET `/api/budgets` - Get all budgets
- POST `/api/budgets` - Create new budget
- PUT `/api/budgets/:id` - Update budget
- DELETE `/api/budgets/:id` - Delete budget

### Bank Accounts
- GET `/api/bank-accounts` - Get all bank accounts
- POST `/api/bank-accounts` - Add new bank account
- PUT `/api/bank-accounts/:id` - Update bank account
- DELETE `/api/bank-accounts/:id` - Delete bank account

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 