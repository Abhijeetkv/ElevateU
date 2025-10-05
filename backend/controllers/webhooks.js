import { Webhook } from "svix";
import User from "../models/User.js";

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
            "svix-signature": headers["svix-signature"]
        });

        // The verified event object contains the data and type
        const { data, type } = event;

        switch (type) {
            case "user.created": {
                const userData = {
                    _id: data.id,
                    name: data.first_name + ' ' + data.last_name, // Clerk provides first_name/last_name
                    email: data.email_addresses[0].email_address, // Clerk provides email_addresses array
                    imageUrl: data.image_url || '',
                }
                await User.create(userData);
                console.log(`User created: ${data.id}`);
                res.status(200).json({});
                break;
            }

            case "user.updated": {
                const userData = {
                    name: data.first_name + ' ' + data.last_name, // Clerk provides first_name/last_name
                    email: data.email_addresses[0].email_address, // Clerk provides email_addresses array
                    imageUrl: data.image_url || '',
                }
                await User.findByIdAndUpdate(data.id, userData);
                console.log(`User updated: ${data.id}`);
                res.status(200).json({});
                break;
            }

            case "user.deleted": {
                // When a user is deleted, Clerk provides the user ID in the data object
                await User.findByIdAndDelete(data.id);
                console.log(`User deleted: ${data.id}`);
                res.status(200).json({});
                break;
            }

            default:
                console.log(`Unhandled webhook event type: ${type}`);
                res.status(200).json({}); // Always respond 200 for unhandled events
                break;
        }
    } catch (error) {
        console.error("Webhook processing error:", error.message);
        // Respond with 400 or 401 if verification fails or an internal error occurs
        res.status(401).json({
            success: false,
            message: error.message || "An error occurred while processing the webhook."
        });
    }
}
