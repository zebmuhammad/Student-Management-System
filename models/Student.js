import mongoose from 'mongoose';

const { Schema } = mongoose;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters']
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/i, 'Roll number must be alphanumeric'],
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Invalid email address']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department must be at most 100 characters']
    },
    gpa: {
      type: Number,
      required: [true, 'GPA is required'],
      min: [0, 'GPA cannot be less than 0.0'],
      max: [4.0, 'GPA cannot be greater than 4.0']
    }
  },
  { timestamps: true }
);

// Text index for search
StudentSchema.index({ name: 'text', email: 'text', department: 'text' });

export default mongoose.model('Student', StudentSchema);


