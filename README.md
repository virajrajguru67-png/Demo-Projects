# Corporate MIS - Employee, Project & Asset Management System

A comprehensive Management Information System designed for IT corporate offices to streamline management of employees, projects, and IT resources.

## 🚀 Features

### Admin Features
- **Employee Management**: Complete CRUD operations for employee records
- **Project Management**: Track projects, assign employees, monitor progress
- **Asset Management**: Manage IT assets, track assignments and availability
- **Dashboard**: Real-time metrics and analytics
- **Reports**: Generate and export reports

### Employee Features
- **Personal Dashboard**: View assigned projects and assets
- **Project Tracking**: Monitor project progress and deadlines
- **Asset Management**: View assigned IT resources

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with proper relationships
- **JWT** authentication with role-based access
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Context** for state management
- **Axios** for API calls

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd corporate-mis
```

### 2. Install Dependencies
```bash
npm run setup
# or
npm run install-all
```

### 3. Database Setup
1. Create a MySQL database named `corporate_mis`
2. Import the database schema:
```bash
mysql -u root -p corporate_mis < server/database/schema.sql
```

### 4. Environment Configuration
1. Copy the environment example file:
```bash
cp server/env.example server/.env
```

2. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=corporate_mis
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 5. Start the Application
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

## 📁 Project Structure

```
corporate-mis/
├── client/                 # Next.js frontend application
│   ├── app/               # App router pages and layouts
│   ├── components/         # Reusable React components
│   │   ├── Layout/        # Layout components
│   │   └── ui/            # UI components
│   ├── contexts/          # React context providers
│   ├── lib/               # Utility functions
│   ├── package.json       # Frontend dependencies
│   └── ...                # Next.js configuration files
├── server/                # Express.js backend API
│   ├── routes/           # API route handlers
│   ├── middleware/        # Custom middleware (auth, permissions)
│   ├── config/            # Database and app configuration
│   ├── database/          # Database schema and migrations
│   ├── package.json       # Backend dependencies
│   └── ...                # Server configuration files
├── .gitignore             # Git ignore rules
├── package.json           # Root package.json (monorepo config)
└── README.md              # Project documentation
```

## 🗄 Database Schema

The system includes the following main entities:

- **Users**: Authentication and role management
- **Employees**: Employee records with personal and work information
- **Departments**: Organizational departments
- **Projects**: Project management with status tracking
- **Project Assignments**: Many-to-many relationship between projects and employees
- **Assets**: IT assets and equipment
- **Asset Categories**: Asset classification
- **Asset Assignments**: Asset allocation to employees

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (Admin/Employee)
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet.js security headers

## 📊 Key Metrics

The dashboard provides insights into:
- Employee distribution by department
- Project status and progress
- Asset utilization and availability
- Recent activities and changes
- Resource allocation efficiency

## 🚧 Development Status

### ✅ Completed
- [x] Project structure setup
- [x] Database schema design
- [x] Backend API with authentication
- [x] Frontend authentication system
- [x] Admin dashboard with metrics

### 🚧 In Progress
- [ ] Employee management interface
- [ ] Project management interface
- [ ] Asset management interface
- [ ] Reporting functionality

### 📋 Planned
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] File upload capabilities
- [ ] Mobile responsiveness improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.
# Demo-Projects
