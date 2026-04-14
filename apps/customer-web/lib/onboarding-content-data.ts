export type OnboardingSlideDef = {
  id: string;
  title: string;
  subtitle: string;
};

/** Data-driven slides — swap copy or add slides without touching layout logic. */
export const ONBOARDING_SLIDES: OnboardingSlideDef[] = [
  {
    id: "nutrition",
    title: "Personalized nutrition",
    subtitle: "Meals tailored to your calories and macros.",
  },
  {
    id: "delivery",
    title: "Fast healthy delivery",
    subtitle: "Fresh meals delivered on your schedule.",
  },
  {
    id: "journey",
    title: "Track your meal journey",
    subtitle: "Manage subscriptions and monitor your orders.",
  },
  {
    id: "offers",
    title: "Wellness offers",
    subtitle: "Plans, savings, and healthy meal bundles.",
  },
];
