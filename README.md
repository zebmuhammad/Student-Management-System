# Student Management System

A comprehensive web application for managing student records, built with Node.js, Express, MongoDB, and EJS templating.

## Features

- **Student Management**: Add, edit, delete, and view student records
- **User Authentication**: Secure login and signup system with session management
- **Advanced Search**: Search students by name, email, or department
- **Filtering & Sorting**: Filter by department and GPA range, sort by various fields
- **Responsive Design**: Modern UI built with Bootstrap 5
- **Data Validation**: Server-side validation with express-validator
- **Security**: Password hashing with bcrypt, session management

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: EJS with express-ejs-layouts
- **Frontend**: Bootstrap 5, Bootstrap Icons
- **Authentication**: express-session, bcryptjs
- **Validation**: express-validator

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/student_management
   SESSION_SECRET=your-super-secret-session-key-change-in-production
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
student-management/
├── models/              # Database models
│   ├── Student.js      # Student schema and model
│   └── User.js         # User authentication model
├── routes/              # Route handlers
│   ├── authRoutes.js   # Authentication routes
│   └── studentRoutes.js # Student management routes
├── views/               # EJS templates
│   ├── layout.ejs      # Main layout template
│   ├── index.ejs       # Home page
│   ├── students.ejs    # Student listing page
│   ├── addStudent.ejs  # Add student form
│   ├── editStudent.ejs # Edit student form
│   ├── studentDetails.ejs # Student details page
│   ├── login.ejs       # Login form
│   ├── signup.ejs      # Signup form
│   ├── error.ejs       # Error page
│   └── students/       # Student-related partials
│       └── parts/
│           └── form.ejs # Reusable student form
├── public/              # Static assets
│   ├── css/
│   │   └── style.css   # Custom styles
│   └── js/
│       └── validate.js # Client-side validation
├── server.js            # Main application file
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Login process
- `GET /signup` - Signup page
- `POST /signup` - Signup process
- `GET /logout` - Logout

### Students
- `GET /students` - List all students (with pagination, search, filters)
- `GET /students/new` - Add new student form
- `POST /students` - Create new student
- `GET /students/:id` - View student details
- `GET /students/:id/edit` - Edit student form
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student

## Database Schema

### Student Model
- `name` (String, required): Student's full name
- `rollNumber` (String, required, unique): Student's roll number
- `email` (String, required, unique): Student's email address
- `department` (String, required): Student's department
- `gpa` (Number, required): Student's GPA (0.0 - 4.0)
- `createdAt` (Date): Record creation timestamp
- `updatedAt` (Date): Record last update timestamp

### User Model
- `username` (String, required, unique): User's username
- `email` (String, required, unique): User's email address
- `password` (String, required): Hashed password
- `role` (String): User role (admin/user)
- `isActive` (Boolean): Account status
- `createdAt` (Date): Account creation timestamp
- `updatedAt` (Date): Account last update timestamp

## Features in Detail

### Search and Filtering
- **Text Search**: Search across name, email, and department fields
- **Department Filter**: Filter students by specific department
- **GPA Range**: Filter by minimum and maximum GPA values
- **Sorting**: Sort by any field in ascending or descending order
- **Pagination**: Navigate through large datasets efficiently

### Data Validation
- **Server-side**: Comprehensive validation using express-validator
- **Client-side**: HTML5 validation attributes
- **Database**: Mongoose schema validation
- **Error Handling**: User-friendly error messages

### Security Features
- **Password Hashing**: Bcrypt with salt rounds
- **Session Management**: Secure session handling
- **Input Sanitization**: Protection against injection attacks
- **Validation**: Comprehensive input validation

## Customization

### Adding New Fields
To add new fields to the Student model:

1. Update `models/Student.js` schema
2. Modify the form in `views/students/parts/form.ejs`
3. Update validation in `routes/studentRoutes.js`
4. Adjust display in relevant view files

### Styling
- Main styles: `public/css/style.css`
- Bootstrap 5 classes for responsive design
- Custom CSS variables for theming

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify database permissions

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process using the port

3. **Module Not Found Errors**
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility

4. **Session Issues**
   - Verify SESSION_SECRET in `.env`
   - Check browser cookie settings

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=express:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the code documentation

## Future Enhancements

- [ ] Role-based access control
- [ ] File upload for student documents
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] API endpoints for mobile apps
- [ ] Bulk import/export functionality
- [ ] Audit logging
- [ ] Multi-language support

