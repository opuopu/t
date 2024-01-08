import budgetCategoryServices from "../services/budget.service.js";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";

const insertBudgetCategoryIntoDb = catchAsync(async (req, res) => {
  const result = await budgetCategoryServices.insertBudgetCategoryIntoDb(
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Budget Category Created successfully",
    data: result,
  });
});
const getallFromDb = catchAsync(async (req, res) => {
  const result = await budgetCategoryServices.getallFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "budget categories  retrived successfully",
    data: result,
  });
});
const getSingleFromDb = catchAsync(async (req, res) => {
  const result = await budgetCategoryServices.getSingleFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "budget category  retrived successfully",
    data: result,
  });
});

const budgetCategoryControllers = {
  insertBudgetCategoryIntoDb,
  getallFromDb,
  getSingleFromDb,
};
export default budgetCategoryControllers;
