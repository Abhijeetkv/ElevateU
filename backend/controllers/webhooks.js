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
        const userData = {
          _id: data.id,
          name: data.first_name + " " + data.last_name,
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url || "",
        };
        await User.create(userData);
        console.log(`User created: ${data.id}`);
        res.status(200).json({});
        break;
      }

      case "user.updated": {
        const userData = {
          name: data.first_name + " " + data.last_name,
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

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":{
      const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntentId,
        })

        const {purchaseId} = session.data[0].metadata

        const purchaseData = await Purchase.findById(purchaseId)
        const userData = await User.findById(purchaseData.userId)
        const courseData = await Course.findById(purchaseData.courseId.toString())

        courseData.enrolledStudents.push(userData._id)
        await courseData.save()

        userData.enrolledCourses.push(courseData._id)
        await userData.save()

        purchaseData.status = 'completed'
        await purchaseData.save()

      break;
    }
    case "payment_intent.payment_failed":{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntentId,
        })

        const {purchaseId} = session.data[0].metadata
        const purchaseData = await Purchase.findById(purchaseId)
        purchaseData.status = 'failed'
        await purchaseData.save()

        break;
    }
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
