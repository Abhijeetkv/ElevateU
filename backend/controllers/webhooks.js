import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import Purchase from "../models/Purchase.js";
import Course from "../models/Course.js";

export const clerkWebhooks = async (req, res) => {
  try {
    // req.body is a Buffer because of express.raw(), we convert it to a string payload
    const payload = req.body.toString();
    const headers = req.headers;

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify the signature using the raw payload string and headers
    const event = whook.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    });

    // The verified event object contains the data and type
    const { data, type } = event;

    switch (type) {
      case "user.created": {
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = (firstName + ' ' + lastName).trim() || data.email_addresses[0].email_address.split('@')[0] || 'User';
        const userData = {
          _id: data.id,
          name: fullName,
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url || "",
        };
        await User.create(userData);
        console.log(`User created: ${data.id}`);
        res.status(200).json({});
        break;
      }

      case "user.updated": {
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = (firstName + ' ' + lastName).trim() || data.email_addresses[0].email_address.split('@')[0] || 'User';
        const userData = {
          name: fullName,
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url || "",
        };
        await User.findByIdAndUpdate(data.id, userData);
        console.log(`User updated: ${data.id}`);
        res.status(200).json({});
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        console.log(`User deleted: ${data.id}`);
        res.status(200).json({});
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${type}`);
        res.status(200).json({});
        break;
    }
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(401).json({
      success: false,
      message:
        error.message || "An error occurred while processing the webhook.",
    });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to enroll user in course after payment
const enrollUserInCourse = async (purchaseId) => {
  const purchaseData = await Purchase.findById(purchaseId);
  if (!purchaseData) {
    console.error(`Purchase not found: ${purchaseId}`);
    return;
  }

  // Skip if already completed
  if (purchaseData.status === 'completed') {
    console.log(`Purchase ${purchaseId} already completed, skipping enrollment.`);
    return;
  }

  const userData = await User.findById(purchaseData.userId);
  const courseData = await Course.findById(purchaseData.courseId.toString());

  if (!userData || !courseData) {
    console.error(`User or Course not found for purchase ${purchaseId}`);
    return;
  }

  // Add student to course (avoid duplicates)
  if (!courseData.enrolledStudents.includes(userData._id)) {
    courseData.enrolledStudents.push(userData._id);
    await courseData.save();
  }

  // Add course to user's enrolled courses (avoid duplicates)
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

  console.log(`✅ Enrollment completed for user ${userData._id} in course ${courseData._id}`);
};

export const stripeWebhooks = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  console.log(`📨 Stripe webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    // This is the primary event for Stripe Checkout — fires when payment is completed
    case "checkout.session.completed": {
      const session = event.data.object;
      const { purchaseId } = session.metadata || {};

      if (!purchaseId) {
        console.error("No purchaseId in checkout session metadata");
        break;
      }

      if (session.payment_status === "paid") {
        await enrollUserInCourse(purchaseId);
      } else {
        console.log(`Checkout session ${session.id} payment_status: ${session.payment_status}`);
      }
      break;
    }

    // Fallback: also handle payment_intent.succeeded for robustness
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      try {
        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        });

        if (sessions.data.length > 0 && sessions.data[0].metadata) {
          const { purchaseId } = sessions.data[0].metadata;
          if (purchaseId) {
            await enrollUserInCourse(purchaseId);
          }
        }
      } catch (err) {
        console.error("Error processing payment_intent.succeeded:", err.message);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      try {
        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        });

        if (sessions.data.length > 0 && sessions.data[0].metadata) {
          const { purchaseId } = sessions.data[0].metadata;
          if (purchaseId) {
            const purchaseData = await Purchase.findById(purchaseId);
            if (purchaseData) {
              purchaseData.status = "failed";
              await purchaseData.save();
              console.log(`❌ Purchase ${purchaseId} marked as failed`);
            }
          }
        }
      } catch (err) {
        console.error("Error processing payment_intent.payment_failed:", err.message);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
