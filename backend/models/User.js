import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        // Using _id to store Clerk's external ID
        _id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        // Reference to other models, e.g., 'Course'
        enrolledCourses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        }],
    }, { timestamps: true }
)

const User = mongoose.model('User', userSchema);

export default User;
