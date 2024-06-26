import Stripe from "stripe";
import config from "../config/index.js";
import { calculateAmount } from "../utils/subscription.utils.js";
import jwt from "jsonwebtoken";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { nextMonth, nextYear } from "../utils/schedule.utils.js";
const stripe = new Stripe(config.stripe_secret);
import mongoose from "mongoose";
import Subscription from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import HomeOwner from "../models/homeOwner.model.js";
import Packages from "../models/Packages.model.js";
const createPaymentIntent = async (payload) => {
  const { amount } = payload;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateAmount(amount),
    currency: "usd",
    payment_method_types: ["card"],
  });

  return paymentIntent?.client_secret;
};

const BuySubscription = async (payload, token) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "you are not authorized!");
  }
  console.log(token);
  let decode;
  try {
    decode = jwt.verify(token, "tidybayti2023");
  } catch (err) {
    console.log(err);
    throw new AppError(httpStatus.UNAUTHORIZED, "unauthorized");
  }
  const { userId } = decode;
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "user not found");
  }
  const findPackage = await Packages.findById(payload?.package);
  if (!findPackage) {
    throw new AppError(httpStatus.BAD_REQUEST, "package not found");
  }
  const date = new Date();
  let endDate;
  if (findPackage?.duration === "monthly") {
    endDate = nextMonth(date);
  } else if (findPackage?.duration === "yearly") {
    endDate = nextYear(date);
  }
  const formatedData = {
    ...payload,
    startDate: date,
    endDate: endDate,
  };

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await Subscription.findOneAndUpdate(
      { user: userId },
      formatedData,
      { upsert: true, new: true, session }
    );
    if (!result) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to buy subscriptions");
    }
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          trialExpirationDate: endDate,
          trial: findPackage?.trial,
        },
      },
      { session }
    );
    await session.commitTransaction();
    await session.endSession();
    return result;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

const getMyPlan = async (id) => {
  const result = await Subscription.findOne({ user: id }).populate("package");
  return result;
};
const subscriptionServices = {
  createPaymentIntent,
  BuySubscription,
  getMyPlan,
};

export default subscriptionServices;
