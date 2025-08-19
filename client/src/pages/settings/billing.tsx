/* eslint-disable react-hooks/exhaustive-deps */
import { AppAlert } from "@/components/app-alert";
import { Separator } from "@/components/ui/separator";
import { PLAN_TYPE, PLANS } from "@/constant/plan.constant";
import {
  useGetUserSubscriptionStatusQuery,
  useManageSubscriptionBillingPortalMutation,
  useSwitchToSubscriptionPlanMutation,
  useUpgradeToProSubscriptionMutation,
} from "@/features/billing/billingAPI";
import { PROTECTED_ROUTES } from "@/routes/common/routePath";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BillingPlanCard from "./_components/billing-plan-card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const BILLING_URL = `${window.location.origin}${PROTECTED_ROUTES.SETTINGS_BILLING}`;

const PLAN_LIST = Object.values(PLANS);

const Billing = () => {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success");

  const [isYearly, setIsYearly] = useState(false);

  const [upgradeToProSubscription, { isLoading: upgradeLoading }] =
    useUpgradeToProSubscriptionMutation();

  const [manageSubscriptionBillingPortal, { isLoading: billingPortalLoading }] =
    useManageSubscriptionBillingPortalMutation();

  const [switchToSubscriptionPlan, { isLoading: switchPlanLoading }] =
    useSwitchToSubscriptionPlanMutation();

  const { data, isFetching, refetch } = useGetUserSubscriptionStatusQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const subscriptionData = data?.data;
  const currentPlan = subscriptionData?.currentPlan || "";
  const daysLeft = subscriptionData?.daysLeft || 0;
  const status = subscriptionData?.status || "trialing";
  const isPro =
    PLAN_LIST.includes(currentPlan as PLAN_TYPE) && status === "active";
  const planData = subscriptionData?.planData;

  const selectedPlanData = isYearly ? planData?.YEARLY : planData?.MONTHLY;

  useEffect(() => {
    setIsYearly(currentPlan === PLANS.YEARLY);
  }, [currentPlan]);

  useEffect(() => {
    if (isSuccess === "true") {
      toast.success("You have successfully subscribe to Finora pro plan");
    } else if (isSuccess === "false") {
      toast.error("Failed to subscribe to Finora pro plan");
    }
  }, []);

  const alertProps = useMemo(() => {
    if (isPro && status === "active") {
      return {
        title: "Pro Plan",
        variant: "success" as const,
        message: `You are currently on a ${currentPlan} plan.`,
      };
    }

    if (status === "trialing") {
      if (daysLeft && daysLeft > 3) {
        return {
          title: "Free Trial",
          variant: "info" as const,
          message: `You are on a free trial. ${daysLeft} days left.`,
        };
      }

      if (daysLeft && daysLeft <= 3) {
        return {
          title: "Trial Expiring",
          variant: "warning" as const,
          message: `Trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Please upgrade.`,
        };
      }

      // If trialing but daysLeft is 0 or undefined, treat it as expired fallback
      return {
        title: "Trial Expired",
        variant: "destructive" as const,
        message: "Your trial has ended. Please upgrade to continue.",
      };
    }

    if (status === "trial_expired") {
      return {
        title: "Trial Expired",
        variant: "destructive" as const,
        message: "Your trial has expired, please upgrade to continue.",
      };
    }

    if (status === "canceled") {
      return {
        title: "Subscription Canceled",
        variant: "destructive" as const,
        message:
          "Your subscription has been canceled, please upgrade to continue.",
      };
    }

    return {
      title: "Subscription Status Unknown",
      variant: "warning" as const,
      message: "We couldn't determine your subscription status.",
    };
  }, [currentPlan, daysLeft, isPro, status]);

  const handleSubscriptionAction = () => {
    if (!isPro) {
      upgradeToProSubscription({
        plan: isYearly ? PLANS.YEARLY : PLANS.MONTHLY,
        callbackUrl: BILLING_URL,
      })
        .unwrap()
        .then((res) => {
          window.location.href = res.url;
        })
        .catch((err) => {
          toast.error(
            err?.data?.message || "Failed to upgrad subscription, Trey again"
          );
        });
    } else if (currentPlan !== (isYearly ? PLANS.YEARLY : PLANS.MONTHLY)) {
      console.log("switch plan");
      handleSwitchSubscription();
    } else {
      handleManageSubscription();
    }
  };

  const handleManageSubscription = () => {
    manageSubscriptionBillingPortal({
      callbackUrl: BILLING_URL,
    })
      .unwrap()
      .then((res) => {
        window.location.href = res.url;
      })
      .catch((err) => {
        toast.error(
          err?.data?.message || "Failed to manage subscription, Try again"
        );
      });
  };

  const handleSwitchSubscription = () => {
    const targetPlan = isYearly ? PLANS.YEARLY : PLANS.MONTHLY;
    if (currentPlan === targetPlan) {
      toast.info("You are already on this plan");
      return;
    }
    switchToSubscriptionPlan({
      newPlan: targetPlan,
    })
      .unwrap()
      .then((res) => {
        setTimeout(() => {
          refetch();
        }, 1500);
        toast.success(`${res.message}, please reload the page`);
      })
      .catch((err) => {
        toast.error(err?.data?.message || "Failed to switch subscription");
      });
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>
      <Separator />

      <div className="w-full space-y-6">
        {/* Current Plan */}
        {/* Upgrade Options */}

        {isFetching ? (
          <BillingSkeleton />
        ) : (
          <>
            <AppAlert
              title={alertProps.title}
              message={alertProps.message}
              variant={alertProps.variant}
              showDismissButton={false}
            />

            <BillingPlanCard
              selectedPlan={selectedPlanData}
              isYearly={isYearly}
              isLoading={
                upgradeLoading || billingPortalLoading || switchPlanLoading
              }
              isPro={isPro || false}
              currentPlanType={currentPlan as PLAN_TYPE}
              onPlanChange={setIsYearly}
              onSubscriptionAction={handleSubscriptionAction}
            />
          </>
        )}
      </div>
    </div>
  );
};

const BillingSkeleton = () => (
  <div className="space-y-0">
    <Skeleton className="h-px w-full" />

    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="w-full">
        {[1].map((i) => (
          <Skeleton key={i} className="h-60 w-full rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

export default Billing;
