import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      enum: ["payment", "reminder"],
    },
  },

  {
    timestamps: true,
  }
);

const Notification = model("Notification", notificationSchema);
export default Notification;