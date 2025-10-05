import {Webhook} from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],    
            "svix-signature": req.headers["svix-signature"]
        })

        const {data, type} = req.body;

        switch (type) {
            case "user.created": {
                const userData = {
                    _id: data.id,
                    name: data.firstName + ' ' + data.lastName,
                    email: data.emailAddresses[0].emailAddress,
                    imageUrl: data.profileImageUrl || '',
                }
                await User.create(userData);
                res.json({})
                break;
            }
                

            case "user.updated":{
                const userData =  {
                    name: data.firstName + ' ' + data.lastName,
                    email: data.emailAddresses[0].emailAddress,
                    imageUrl: data.profileImageUrl || '',
                }
                await User.findByIdAndUpdate(data.id, userData);
                res.json({})
                break;
            }

            case "user.deleted": {
                await User.findByIdAndDelete(data.id);
                res.json({})
                break;
            }
                

            default:
                break;
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.message || "An error occurred while processing the webhook."
        })
    }
}