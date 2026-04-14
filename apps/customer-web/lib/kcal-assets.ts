/**
 * Drop exported Figma PNGs into `public/images/` with these names to replace SVG fallbacks.
 * Paths are optional — components fall back to inline SVGs when files are missing.
 */
export const KC_IMAGE = {
  splashBg: "/images/kcal-splash-bg.png",
  onboardEat: "/images/kcal-onboard-eat-healthy.png",
  onboardRecipes: "/images/kcal-onboard-healthy-recipes.png",
  onboardTrack: "/images/kcal-onboard-track-health.png",
  homeHero: "/images/kcal-home-hero.png",
  profileAvatar: "/images/kcal-profile-avatar.png",
} as const;
