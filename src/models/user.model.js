import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import config from "../config/index.js";
const userSchema = new Schema(
  {
    phoneNumber: {
      type: Number,
      // required: [true, "phone number is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      select: 0,
      required: [true, "password is required"],
    },
    passwordChangedAt: {
      type: Date,
    },
    needPasswordChange: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["homeowner", "employee"],
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  const user = this; // doc
  // hashing password and save into DB
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds)
  );

  next();
});
userSchema.statics.isUserExist = async function (email) {
  return await User.findOne({ email: email }).select("+password");
};
userSchema.statics.isDuplicatePhone = async function (phoneNumber) {
  return await User.findOne({ phoneNumber: phoneNumber });
};
userSchema.statics.checkUserExistById = async function (id) {
  return await User.findOne({ _id: id }).select("+password");
};
userSchema.statics.isPasswordMatched = async function (
  plainPassword,
  hashPassword
) {
  return await bcrypt.compare(plainPassword, hashPassword);
};
export const User = model("User", userSchema);
