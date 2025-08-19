import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middlerware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getUserSubscriptionStatusService,
  manageSubscriptionBillingPortalService,
  switchToSubscriptionPlanService,
  upgradeToProSubscriptionService,
} from "../services/billing.service";
import {
  manageSubscriptionBillingPortalSchema,
  switchToSubscriptionPlanSchema,
  upgradeToProSubscriptionSchema,
} from "../validators/billing.validator";

export const getUserSubscriptionStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const { subscriptionData } = await getUserSubscriptionStatusService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Subscription  fetched successfully",
      data: subscriptionData,
    });
  }
);

export const upgradeToProSubscriptionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = upgradeToProSubscriptionSchema.parse(req.body);

    const { url } = await upgradeToProSubscriptionService(userId, body);

    return res.status(HTTPSTATUS.OK).json({
      message: "Payment Url generated successfully",
      url,
    });
  }
);

export const manageSubscriptionBillingPortalController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = manageSubscriptionBillingPortalSchema.parse(req.body);

    const url = await manageSubscriptionBillingPortalService(
      userId,
      body.callbackUrl
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Payment URL generated successfully",
      url,
    });
  }
);

export const switchToSubscriptionPlanController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = switchToSubscriptionPlanSchema.parse(req.body);

    const { success, message } = await switchToSubscriptionPlanService(
      userId,
      body
    );

    return res.status(HTTPSTATUS.OK).json({
      success,
      message,
    });
  }
);
