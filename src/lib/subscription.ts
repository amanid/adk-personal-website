import { prisma } from "./prisma";
import { subscriptionGrantsAccess } from "./subscription-plans";

export interface AccessResult {
  hasDocumentAccess: boolean;
  hasDataAccess: boolean;
  subscriptionTier: string | null;
  requiresSubscription: boolean;
}

export async function checkPublicationAccess(
  userId: string | null,
  accessLevel: "FREE" | "GATED"
): Promise<AccessResult> {
  if (accessLevel === "FREE") {
    return {
      hasDocumentAccess: true,
      hasDataAccess: true,
      subscriptionTier: null,
      requiresSubscription: false,
    };
  }

  if (!userId) {
    return {
      hasDocumentAccess: false,
      hasDataAccess: false,
      subscriptionTier: null,
      requiresSubscription: true,
    };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // Active, or cancelled but still inside the period already paid for.
  if (!subscription || !subscriptionGrantsAccess(subscription)) {
    return {
      hasDocumentAccess: false,
      hasDataAccess: false,
      subscriptionTier: null,
      requiresSubscription: true,
    };
  }

  return {
    hasDocumentAccess:
      subscription.tier === "DOCUMENT_ACCESS" ||
      subscription.tier === "FULL_ACCESS",
    hasDataAccess:
      subscription.tier === "DATA_ACCESS" ||
      subscription.tier === "FULL_ACCESS",
    subscriptionTier: subscription.tier,
    requiresSubscription: true,
  };
}
