import { Schema, model } from "mongoose";

const homeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "title is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "user id is required"],
      ref: "User",
    },
    category: {
      type: Schema.Types.ObjectId,
      required: [true, "home category is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Home = model("Home", homeSchema);
export default Home;