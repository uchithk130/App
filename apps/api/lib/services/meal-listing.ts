import { MealListingStatus } from "@prisma/client";

export function isActiveForListingStatus(status: MealListingStatus) {
  return status === MealListingStatus.ACTIVE;
}
