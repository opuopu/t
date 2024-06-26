import mongoose, { Types } from "mongoose";
import { SundayToThursday } from "../constant/workingDays.js";
import AssignSchedule from "../models/AssignWorkSchedule.model.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { findArrayIntersection } from "../utils/schedule.utils.js";
import Employee from "../models/employee.model.js";
// const insertScheduleIntoDb = async (payload) => {
//   const findSchedule = await AssignSchedule.findOne({
//     employee: payload?.employee,
//     workingDays: {
//       $in: payload?.workingDays,
//     },
//   });
//   const dateConflict = findArrayIntersection(
//     payload?.workingDays,
//     payload?.weekend
//   );

//   if (dateConflict.length < 0) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "you cannot assign the same date to both working days and weekends"
//     );
//   }
//   if (findSchedule) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "day conflict. employee has already assigned during this days"
//     );
//   }
//   const result = await AssignSchedule.create(payload);
//   return result;
// };
const insertScheduleIntoDb = async (payload) => {
  const findEmployee = await Employee.findById(payload?.employee);
  if (!findEmployee) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Employee Not Found.Please select valid employee"
    );
  }
  const result = await AssignSchedule.findOneAndUpdate(
    {
      employee: payload.employee,
    },
    {
      $set: payload,
    },
    { new: true, upsert: true }
  );
  return result;
};
const getAllAssignSchedule = async (query) => {
  const result = await AssignSchedule.find(query).populate("employee");
  return result;
};
const getAssignedSchedule = async (id) => {
  const result = await AssignSchedule.findById(id).populate("employee");
  return result;
};
const updateAssignSchedule = async (id, payload) => {
  const findSchedule = await AssignSchedule.find({
    _id: { $ne: id },
    employee: payload?.employee,
    workingDays: {
      $in: payload?.workingDays,
    },
  });
  if (findSchedule?.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Day conflict: Employee already has assigned during these days."
    );
  }
  const result = await AssignSchedule.findByIdAndUpdate(id, payload);
  return result;
};

const getDataFromSundayToThursday = async (userId) => {
  const userObjectId = new Types.ObjectId(userId);
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        homeOwner: userObjectId,
        workingDays: {
          $in: SundayToThursday,
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
    {
      $project: {
        _id: "$_id",
        employee: "$employee",
        schedules: "$schedules",
      },
    },
  ]);

  return result;
};
const getSaturdayData = async (userId) => {
  const userObjectId = new Types.ObjectId(userId);
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        homeOwner: userObjectId,
        workingDays: {
          $in: ["Sat"],
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
    {
      $project: {
        _id: "$_id",
        employee: "$employee",
        schedules: "$schedules",
      },
    },
  ]);

  return result;
};
const getFridayData = async (userId) => {
  const userObjectId = new Types.ObjectId(userId);
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        homeOwner: userObjectId,
        workingDays: {
          $in: ["Fri"],
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
    {
      $project: {
        _id: "$_id",
        employee: "$employee",
        schedules: "$schedules",
      },
    },
  ]);

  return result;
};

const getWeekendData = async (userId) => {
  const result = await AssignSchedule.find({ homeOwner: userId })
    .populate({
      path: "employee",
      select: "name",
    })
    .select("weekend employee");
  return result;
};

const getAllEmployeesScheduleDataForDownload = async (homeOwnerId) => {
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        homeOwner: new mongoose.Types.ObjectId(homeOwnerId),
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
    {
      $unwind: "$schedules",
    },
    {
      $lookup: {
        from: "rooms",
        let: { roomId: "$schedules.room" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$roomId"] },
            },
          },
          {
            $lookup: {
              from: "homes",
              localField: "home",
              foreignField: "_id",
              as: "home",
            },
          },
          {
            $unwind: "$home",
          },
          {
            $project: {
              _id: 0,
              title: { $ifNull: ["$title", "N/A"] },
              home: "$home.title",
            },
          },
        ],
        as: "room",
      },
    },
    {
      $unwind: {
        path: "$room",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        employee: { $first: "$employee.name" },
        weekend: { $first: "$weekend" },
        workingDays: { $first: "$workingDays" },
        schedules: {
          $push: {
            $mergeObjects: [
              "$schedules",
              {
                room: { $ifNull: ["$room.title", "N/A"] },
                home: { $ifNull: ["$room.home", "N/A"] },
              },
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        workingDays: 1,
        weekend: 1,
        employee: 1,
        schedules: 1,
      },
    },
  ]);
  return result;
};

const employeeWorkDetailsByScheduleId = async (id) => {
  const ScheduleId = new Types.ObjectId(id);
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        _id: ScheduleId,
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: "$employee",
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
  ]);
  return result;
};
const getScheduleDataByEmployee = async (id) => {
  const result = await AssignSchedule.aggregate([
    {
      $match: {
        employee: new Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "workschedules",
        localField: "_id",
        foreignField: "schedule",
        as: "schedules",
      },
    },
    {
      $unwind: "$schedules", // Unwind the schedules array
    },
    {
      $lookup: {
        from: "rooms",
        localField: "schedules.room",
        foreignField: "_id",
        as: "schedules.room",
      },
    },
    {
      $unwind: {
        path: "$schedules.room",
        preserveNullAndEmptyArrays: true, // Preserve documents without a matching room
      },
    },
    {
      $lookup: {
        from: "homes",
        localField: "schedules.room.home",
        foreignField: "_id",
        as: "schedules.room.home",
      },
    },

    {
      $addFields: {
        "schedules.room": { $ifNull: ["$schedules.room", {}] },
      },
    },
    {
      $unwind: {
        path: "$schedules.room.home",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        workingDays: { $first: "$workingDays" },
        weekend: { $first: "$weekend" },
        employee: { $first: "$employee" },
        // Reconstruct the schedules array
        schedules: {
          $push: {
            $cond: {
              if: { $eq: ["$schedules.room", {}] },
              then: { $mergeObjects: ["$schedules", { room: null }] },
              else: "$schedules",
            },
          },
        },
      },
    },
  ]);
  return result;
};

// get assignedschedule by employee id

const getAssignScheduleByEmployeeId = async (id) => {
  const result = await AssignSchedule.findOne({ employee: id });
  return result;
};
const AssignScheduleServices = {
  insertScheduleIntoDb,
  getAllAssignSchedule,
  getAssignedSchedule,
  updateAssignSchedule,
  getDataFromSundayToThursday,
  getWeekendData,
  getSaturdayData,
  getFridayData,
  getScheduleDataByEmployee,
  employeeWorkDetailsByScheduleId,
  getAssignScheduleByEmployeeId,
  getAllEmployeesScheduleDataForDownload,
};
export default AssignScheduleServices;
