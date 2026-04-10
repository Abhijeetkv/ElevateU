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

        // Find the most recent purchase for this user (pending OR completed)
        const purchaseData = await Purchase.findOne({ userId }).sort({ createdAt: -1 });

        if (!purchaseData) {
            return res.json({
                success: false,
                message: 'No purchase found'
            });
        }

        // If webhook already processed this purchase, just ensure enrollment state is correct
        if (purchaseData.status === 'completed') {
            const userData = await User.findById(userId);
            const courseIdStr = purchaseData.courseId.toString();
            const alreadyEnrolled = userData.enrolledCourses.some(
                (id) => id.toString() === courseIdStr
            );

            if (!alreadyEnrolled) {
                // Webhook marked completed but enrollment wasn't saved — fix it
                userData.enrolledCourses.push(purchaseData.courseId);
                await userData.save();
            }

            return res.json({
                success: true,
                message: 'Already enrolled'
            });
        }

        // Purchase is still pending — check Stripe for payment status
        // Use autopagination to search all sessions for this purchase
        let matchedSession = null;
        for await (const session of stripeInstance.checkout.sessions.list({ limit: 100 })) {
            if (session.metadata && session.metadata.purchaseId === purchaseData._id.toString()) {
                matchedSession = session;
                break;
            }
        }

        if (!matchedSession || matchedSession.payment_status !== 'paid') {
            return res.json({
                success: false,
                message: 'Payment not completed yet'
            });
        }

        // Payment confirmed — enroll the user
        const userData = await User.findById(userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!courseData) {
            return res.json({ success: false, message: 'Course not found' });
        }

        if (!courseData.enrolledStudents.includes(userId)) {
            courseData.enrolledStudents.push(userId);
            await courseData.save();
        }

        const courseIdStr = courseData._id.toString();
        const alreadyEnrolled = userData.enrolledCourses.some(
            (id) => id.toString() === courseIdStr
        );
        if (!alreadyEnrolled) {
            userData.enrolledCourses.push(courseData._id);
            await userData.save();
        }

        purchaseData.status = 'completed';
        await purchaseData.save();

        console.log(`✅ Payment verified & enrolled user ${userId} in course ${courseData._id}`);

        res.json({
            success: true,
            message: 'Payment verified and enrollment completed'
        });
    } catch (error) {
        console.error('verifyPayment error:', error.message);
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