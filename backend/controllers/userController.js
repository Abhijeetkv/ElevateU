import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import CourseProgress from "../models/CourseProgress.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);


// Get user data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if(!user){
            return res.json({
                success: false,
                message: 'User not found'
            })
        }

        // Auto-fix users with "null null" name
        if (!user.name || user.name === 'null null' || user.name.trim() === '') {
            const email = user.email || '';
            user.name = email.split('@')[0] || 'User';
            await user.save();
        }

        res.json({
            success: true,
            user
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}


// Get Enrolled courses with lecture links

export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId)
        .populate('enrolledCourses')

        res.json({
            success: true,
            enrolledCourses: userData.enrolledCourses
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}


// purchase course
export const purchaseCourse = async (req, res) => {
    try {
        const {courseId} = req.body;
        const {origin} = req.headers;
        const userId = req.auth.userId;
        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)

        if(!userData || !courseData){
            return res.json({
                success: false,
                message: 'Invalid user or course data'
            })
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice /100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData)

        const currency = process.env.CURRENCY.toLowerCase();

        // creating line items for stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle,
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }]


        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {purchaseId: newPurchase._id.toString()}
        })

        res.json({
            success: true,
            session_url: session.url
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Verify payment and enroll user after Stripe redirect
export const verifyPayment = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Find the most recent pending purchase for this user
        const purchaseData = await Purchase.findOne({ userId, status: 'pending' }).sort({ createdAt: -1 });

        if (!purchaseData) {
            return res.json({
                success: false,
                message: 'No pending purchase found'
            });
        }

        // Check if user is already enrolled (idempotency)
        const userData = await User.findById(userId);
        if (userData.enrolledCourses.includes(purchaseData.courseId.toString())) {
            // Already enrolled, just mark purchase completed if needed
            if (purchaseData.status === 'pending') {
                purchaseData.status = 'completed';
                await purchaseData.save();
            }
            return res.json({
                success: true,
                message: 'Already enrolled'
            });
        }

        // List checkout sessions associated with this purchase
        const sessions = await stripeInstance.checkout.sessions.list({
            limit: 10,
        });

        // Find the session matching this purchase
        const matchedSession = sessions.data.find(
            s => s.metadata && s.metadata.purchaseId === purchaseData._id.toString()
        );

        if (!matchedSession || matchedSession.payment_status !== 'paid') {
            return res.json({
                success: false,
                message: 'Payment not completed yet'
            });
        }

        // Payment confirmed — enroll the user
        const courseData = await Course.findById(purchaseData.courseId);

        if (!courseData.enrolledStudents.includes(userId)) {
            courseData.enrolledStudents.push(userId);
            await courseData.save();
        }

        if (!userData.enrolledCourses.includes(courseData._id.toString())) {
            userData.enrolledCourses.push(courseData._id);
            await userData.save();
        }

        purchaseData.status = 'completed';
        await purchaseData.save();

        res.json({
            success: true,
            message: 'Payment verified and enrollment completed'
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
}

// update user course progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const {courseId, lectureId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({
                    success: true,
                    message: 'Lecture already completed'
                })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        }else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }
        res.json({
            success: true,
            message: 'Course updated'
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}
    

// get user course progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const {courseId} = req.query;
        const progressData = await CourseProgress.findOne({userId, courseId})
        res.json({
            success: true,
            progressData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Add user ratings to course

export const addUserRating = async (req, res) => {
    
        const userId = req.auth.userId;
        const {courseId, rating} = req.body;

        if(!courseId || !userId || !rating || rating < 1 || rating > 5){
            return res.json({
                success: false,
                message: 'Invalid input data'
            })
        }

     try {
        const course = await Course.findById(courseId)

        if(!course){
            return res.json({
                success: false,
                message: 'Course not found'
            })
        }

        const user = await User.findById(userId)

        if(!user || !user.enrolledCourses.includes(courseId)){
            return res.json({
                success: false,
                message: 'User not enrolled in this course'
            })
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)

        if(existingRatingIndex > -1){
            course.courseRatings[existingRatingIndex].rating = rating

        }else {
            course.courseRatings.push({userId, rating})
        }
        await course.save()

        return res.json({
            success: true,
            message: 'Rating added successfully'
        })
        
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}