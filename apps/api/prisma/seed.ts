import { PrismaClient, RoleCode, AppScope, OrderStatus, OrderType, PaymentStatus, RiderAvailability, RiderApprovalStatus, SubscriptionStatus, SubscriptionScheduleStatus, CustomMealRequestStatus, MealType, MealListingStatus, FitnessGoal, DietaryPreference, WalletTransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hash(password: string) {
  return bcrypt.hashSync(password, 12);
}

async function main() {
  const password = hash("Password123!");

  const [roleCustomer, roleAdmin, roleRider] = await Promise.all([
    prisma.role.upsert({
      where: { code: RoleCode.CUSTOMER },
      update: {},
      create: { code: RoleCode.CUSTOMER, name: "Customer" },
    }),
    prisma.role.upsert({
      where: { code: RoleCode.ADMIN },
      update: {},
      create: { code: RoleCode.ADMIN, name: "Admin" },
    }),
    prisma.role.upsert({
      where: { code: RoleCode.RIDER },
      update: {},
      create: { code: RoleCode.RIDER, name: "Rider" },
    }),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email_appScope: { email: "admin@fitmeals.dev", appScope: AppScope.ADMIN } },
    update: { passwordHash: password },
    create: {
      email: "admin@fitmeals.dev",
      passwordHash: password,
      appScope: AppScope.ADMIN,
      roles: { create: [{ roleId: roleAdmin.id }] },
      adminProfile: { create: { fullName: "Ops Admin" } },
    },
    include: { adminProfile: true },
  });
  if (!adminUser.adminProfile) {
    await prisma.adminProfile.create({ data: { userId: adminUser.id, fullName: "Ops Admin" } });
  }
  await prisma.userOnRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roleAdmin.id } },
    update: {},
    create: { userId: adminUser.id, roleId: roleAdmin.id },
  });

  const riderUser = await prisma.user.upsert({
    where: { email_appScope: { email: "rider@fitmeals.dev", appScope: AppScope.RIDER } },
    update: { passwordHash: password },
    create: {
      email: "rider@fitmeals.dev",
      phone: "+919800000001",
      passwordHash: password,
      appScope: AppScope.RIDER,
      roles: { create: [{ roleId: roleRider.id }] },
      riderProfile: {
        create: {
          fullName: "Raj Rider",
          availability: RiderAvailability.AVAILABLE,
          approvalStatus: RiderApprovalStatus.APPROVED,
          approvedAt: new Date(),
          vehicleType: "Bike",
          vehicleNumber: "KA01AB1234",
          kycStatus: "PENDING",
          wallet: { create: { balance: "1250.50", heldBalance: "0" } },
        },
      },
    },
    include: { riderProfile: { include: { wallet: true } } },
  });
  await prisma.userOnRole.upsert({
    where: { userId_roleId: { userId: riderUser.id, roleId: roleRider.id } },
    update: {},
    create: { userId: riderUser.id, roleId: roleRider.id },
  });

  const customer1 = await prisma.user.upsert({
    where: { email_appScope: { email: "alex@fitmeals.dev", appScope: AppScope.CUSTOMER } },
    update: { passwordHash: password },
    create: {
      email: "alex@fitmeals.dev",
      phone: "+919800000002",
      passwordHash: password,
      appScope: AppScope.CUSTOMER,
      roles: { create: [{ roleId: roleCustomer.id }] },
      customerProfile: {
        create: {
          fullName: "Alex Kapoor",
          fitnessGoal: FitnessGoal.MUSCLE_GAIN,
          dietaryPreference: DietaryPreference.HIGH_PROTEIN,
          dailyCalorieGoal: 2400,
          targetProteinG: 180,
          targetCarbG: 220,
          targetFatG: 70,
          allergies: "Peanuts",
          deliveryNotes: "Leave with security",
        },
      },
    },
    include: { customerProfile: true },
  });
  await prisma.userOnRole.upsert({
    where: { userId_roleId: { userId: customer1.id, roleId: roleCustomer.id } },
    update: {},
    create: { userId: customer1.id, roleId: roleCustomer.id },
  });

  const customer2 = await prisma.user.upsert({
    where: { email_appScope: { email: "priya@fitmeals.dev", appScope: AppScope.CUSTOMER } },
    update: { passwordHash: password },
    create: {
      email: "priya@fitmeals.dev",
      passwordHash: password,
      appScope: AppScope.CUSTOMER,
      roles: { create: [{ roleId: roleCustomer.id }] },
      customerProfile: {
        create: {
          fullName: "Priya Menon",
          fitnessGoal: FitnessGoal.FAT_LOSS,
          dietaryPreference: DietaryPreference.LOW_CARB,
          dailyCalorieGoal: 1650,
        },
      },
    },
    include: { customerProfile: true },
  });
  await prisma.userOnRole.upsert({
    where: { userId_roleId: { userId: customer2.id, roleId: roleCustomer.id } },
    update: {},
    create: { userId: customer2.id, roleId: roleCustomer.id },
  });

  const zone = await prisma.serviceableZone.upsert({
    where: { id: "seed-zone-central" },
    update: {},
    create: {
      id: "seed-zone-central",
      name: "Central Bengaluru",
      isActive: true,
      baseDeliveryFee: "49",
      minOrderAmount: "299",
      taxRatePercent: "5",
    },
  });

  await prisma.zonePincode.deleteMany({ where: { zoneId: zone.id } });
  await prisma.zonePincode.createMany({
    data: ["560001", "560002", "560003", "560034", "560076"].map((pincode) => ({
      zoneId: zone.id,
      pincode,
    })),
  });

  const slotMorning = await prisma.deliverySlot.upsert({
    where: { id: "seed_slot_morning" },
    update: {
      zoneId: zone.id,
      label: "Morning 7–9",
      startTime: new Date("2026-01-01T07:00:00.000Z"),
      endTime: new Date("2026-01-01T09:00:00.000Z"),
      capacity: 80,
      booked: 3,
      isActive: true,
    },
    create: {
      id: "seed_slot_morning",
      zoneId: zone.id,
      label: "Morning 7–9",
      startTime: new Date("2026-01-01T07:00:00.000Z"),
      endTime: new Date("2026-01-01T09:00:00.000Z"),
      capacity: 80,
      booked: 3,
      isActive: true,
    },
  });

  const slotEvening = await prisma.deliverySlot.upsert({
    where: { id: "seed_slot_evening" },
    update: {
      zoneId: zone.id,
      label: "Evening 6–8",
      startTime: new Date("2026-01-01T18:00:00.000Z"),
      endTime: new Date("2026-01-01T20:00:00.000Z"),
      capacity: 100,
      booked: 1,
      isActive: true,
    },
    create: {
      id: "seed_slot_evening",
      zoneId: zone.id,
      label: "Evening 6–8",
      startTime: new Date("2026-01-01T18:00:00.000Z"),
      endTime: new Date("2026-01-01T20:00:00.000Z"),
      capacity: 100,
      booked: 1,
      isActive: true,
    },
  });

  const catHighProtein = await prisma.mealCategory.upsert({
    where: { slug: "high-protein" },
    update: {},
    create: { name: "High protein", slug: "high-protein", sortOrder: 1 },
  });
  const catBalanced = await prisma.mealCategory.upsert({
    where: { slug: "balanced-fuel" },
    update: {},
    create: { name: "Balanced fuel", slug: "balanced-fuel", sortOrder: 2 },
  });

  await prisma.mealCategory.upsert({
    where: { slug: "salads" },
    update: {},
    create: { name: "Salads", slug: "salads", sortOrder: 3 },
  });
  await prisma.mealCategory.upsert({
    where: { slug: "bowls" },
    update: {},
    create: { name: "Bowls", slug: "bowls", sortOrder: 4 },
  });

  await prisma.homePromoBanner.deleteMany({});
  await prisma.homePromoBanner.create({
    data: {
      badge: "GREEN BOWL",
      headline: "Fresh macro-balanced meals",
      subline: "Up to 20% off this week",
      gradientFrom: "#059669",
      gradientTo: "#34d399",
      mealSlug: "grilled-chicken-quinoa-bowl",
      sortOrder: 0,
      isActive: true,
    },
  });

  const mealsData = [
    {
      slug: "grilled-chicken-quinoa-bowl",
      name: "Grilled chicken & quinoa bowl",
      mealType: MealType.LUNCH,
      basePrice: "389",
      description: "Lean chicken thigh, tri-color quinoa, charred broccoli, lemon herb yogurt.",
      nutrition: { calories: 520, proteinG: "48", carbG: "42", fatG: "14", fiberG: "8" },
    },
    {
      slug: "salmon-greens-power-plate",
      name: "Salmon greens power plate",
      mealType: MealType.DINNER,
      basePrice: "449",
      description: "Atlantic salmon, baby spinach, roasted sweet potato, omega drizzle.",
      nutrition: { calories: 580, proteinG: "42", carbG: "38", fatG: "24", fiberG: "7" },
    },
    {
      slug: "egg-white-masala-wrap",
      name: "Egg white masala wrap",
      mealType: MealType.BREAKFAST,
      basePrice: "249",
      description: "Whole wheat roti, spiced egg whites, peppers, mint chutney on the side.",
      nutrition: { calories: 410, proteinG: "32", carbG: "44", fatG: "10", fiberG: "6" },
    },
    {
      slug: "tofu-stir-fry-brown-rice",
      name: "Tofu stir-fry brown rice",
      mealType: MealType.LUNCH,
      basePrice: "329",
      description: "Crispy tofu, seasonal vegetables, low-sodium tamari glaze.",
      nutrition: { calories: 480, proteinG: "28", carbG: "58", fatG: "14", fiberG: "9" },
    },
  ];

  for (const m of mealsData) {
    const meal = await prisma.meal.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        description: m.description,
        mealType: m.mealType,
        basePrice: m.basePrice,
        compareAtPrice:
          m.slug === "grilled-chicken-quinoa-bowl" ? "449" : m.slug === "salmon-greens-power-plate" ? "549" : null,
        categoryId: m.mealType === MealType.BREAKFAST ? catBalanced.id : catHighProtein.id,
        isActive: true,
        listingStatus: MealListingStatus.ACTIVE,
        richInProtein: m.slug === "grilled-chicken-quinoa-bowl" || m.slug === "salmon-greens-power-plate",
        richInFiber: m.slug === "tofu-stir-fry-brown-rice" || m.slug === "egg-white-masala-wrap",
        richInLowCarb: m.slug === "salmon-greens-power-plate",
      },
      create: {
        slug: m.slug,
        name: m.name,
        description: m.description,
        mealType: m.mealType,
        basePrice: m.basePrice,
        compareAtPrice:
          m.slug === "grilled-chicken-quinoa-bowl" ? "449" : m.slug === "salmon-greens-power-plate" ? "549" : null,
        categoryId: m.mealType === MealType.BREAKFAST ? catBalanced.id : catHighProtein.id,
        isActive: true,
        listingStatus: MealListingStatus.ACTIVE,
        richInProtein: m.slug === "grilled-chicken-quinoa-bowl" || m.slug === "salmon-greens-power-plate",
        richInFiber: m.slug === "tofu-stir-fry-brown-rice" || m.slug === "egg-white-masala-wrap",
        richInLowCarb: m.slug === "salmon-greens-power-plate",
        nutrition: { create: m.nutrition },
        images: {
          create: [{ url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&fit=crop`, sortOrder: 0 }],
        },
      },
    });
    await prisma.mealNutrition.upsert({
      where: { mealId: meal.id },
      update: m.nutrition,
      create: { mealId: meal.id, ...m.nutrition },
    });
  }

  const planWeekly = await prisma.subscriptionPlan.upsert({
    where: { id: "seed-plan-athlete-week" },
    update: {},
    create: {
      id: "seed-plan-athlete-week",
      name: "Athlete week",
      description: "5 lunches + macro-balanced dinners",
      price: "4299",
      billingPeriodDays: 7,
      isActive: true,
      rules: {
        create: {
          mealsPerWeek: 10,
          deliveryDaysMask: "0111110",
          macroTargetsJson: { proteinG: 170, carbG: 200, fatG: 65 },
        },
      },
    },
  });

  await prisma.adminSetting.upsert({
    where: { key: "cod.enabled" },
    update: { value: false },
    create: { key: "cod.enabled", value: false },
  });
  await prisma.adminSetting.upsert({
    where: { key: "rider.wallet.creditOnCod" },
    update: { value: false },
    create: { key: "rider.wallet.creditOnCod", value: false },
  });
  await prisma.adminSetting.upsert({
    where: { key: "subscription.pauseCutoffHours" },
    update: { value: 24 },
    create: { key: "subscription.pauseCutoffHours", value: 24 },
  });

  await prisma.banner.deleteMany({});
  await prisma.banner.createMany({
    data: [
      {
        title: "Macro-perfect meals",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
        href: "/meals",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Train harder. Eat smarter.",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
        href: "/plans",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  const alexProfile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: customer1.id } });
  const priyaProfile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: customer2.id } });

  const addressAlex = await prisma.address.upsert({
    where: { id: "seed_addr_alex_home" },
    update: {
      customerId: alexProfile.id,
      zoneId: zone.id,
      line1: "42 Residency Road",
      city: "Bengaluru",
      state: "KA",
      pincode: "560001",
      lat: "12.9716",
      lng: "77.5946",
      isDefault: true,
      label: "Home",
    },
    create: {
      id: "seed_addr_alex_home",
      customerId: alexProfile.id,
      zoneId: zone.id,
      line1: "42 Residency Road",
      city: "Bengaluru",
      state: "KA",
      pincode: "560001",
      lat: "12.9716",
      lng: "77.5946",
      isDefault: true,
      label: "Home",
    },
  });

  await prisma.address.upsert({
    where: { id: "seed_addr_priya_home" },
    update: {
      customerId: priyaProfile.id,
      zoneId: zone.id,
      line1: "9 Koramangala 5th Block",
      city: "Bengaluru",
      state: "KA",
      pincode: "560034",
      isDefault: true,
      label: "Home",
    },
    create: {
      id: "seed_addr_priya_home",
      customerId: priyaProfile.id,
      zoneId: zone.id,
      line1: "9 Koramangala 5th Block",
      city: "Bengaluru",
      state: "KA",
      pincode: "560034",
      isDefault: true,
      label: "Home",
    },
  });

  const chickenMeal = await prisma.meal.findUniqueOrThrow({ where: { slug: "grilled-chicken-quinoa-bowl" } });

  await prisma.cart.upsert({
    where: { customerId: alexProfile.id },
    update: {},
    create: { customerId: alexProfile.id },
  });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { customerId: alexProfile.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      mealId: chickenMeal.id,
      quantity: 2,
      unitPrice: chickenMeal.basePrice,
    },
  });

  await prisma.customerSubscription.upsert({
    where: { id: "seed_sub_alex" },
    update: {
      customerId: alexProfile.id,
      planId: planWeekly.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: "seed_sub_alex",
      customerId: alexProfile.id,
      planId: planWeekly.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      schedules: {
        create: [
          {
            scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            slotId: slotMorning.id,
            status: SubscriptionScheduleStatus.SCHEDULED,
          },
        ],
      },
    },
  });

  const seedOrderId = "seed_order_one_time_alex";
  await prisma.walletTransaction.deleteMany({ where: { reference: seedOrderId } });
  await prisma.riderAssignment.deleteMany({ where: { orderId: seedOrderId } });
  await prisma.deliveryStatusLog.deleteMany({ where: { orderId: seedOrderId } });
  await prisma.payment.deleteMany({ where: { orderId: seedOrderId } }).catch(() => undefined);
  await prisma.orderItem.deleteMany({ where: { orderId: seedOrderId } });
  await prisma.order.deleteMany({ where: { id: seedOrderId } });

  const orderOne = await prisma.order.create({
    data: {
      id: seedOrderId,
      customerId: alexProfile.id,
      type: OrderType.ONE_TIME,
      status: OrderStatus.CONFIRMED,
      zoneId: zone.id,
      addressSnapshot: {
        line1: addressAlex.line1,
        city: addressAlex.city,
        pincode: addressAlex.pincode,
        lat: addressAlex.lat?.toString(),
        lng: addressAlex.lng?.toString(),
      },
      slotId: slotEvening.id,
      subtotal: "778",
      deliveryFee: "49",
      tax: "41.35",
      discount: "0",
      total: "868.35",
      items: {
        create: [
          {
            mealId: chickenMeal.id,
            quantity: 2,
            unitPrice: chickenMeal.basePrice,
            nutritionSnapshot: { calories: 520, proteinG: 48 },
          },
        ],
      },
      payment: {
        create: {
          status: PaymentStatus.CAPTURED,
          method: "UPI",
          amount: "868.35",
          providerOrderId: "seed_rzp_order_1",
          providerPaymentId: "seed_rzp_pay_1",
        },
      },
      statusLogs: {
        create: [
          { status: OrderStatus.PENDING_PAYMENT },
          { status: OrderStatus.PAID },
          { status: OrderStatus.CONFIRMED },
        ],
      },
    },
  });

  let riderProfile = await prisma.riderProfile.findUnique({ where: { userId: riderUser.id } });
  if (!riderProfile) {
    riderProfile = await prisma.riderProfile.create({
      data: {
        userId: riderUser.id,
        fullName: "Raj Rider",
        availability: RiderAvailability.AVAILABLE,
        vehicleType: "Bike",
        kycStatus: "PENDING",
        wallet: { create: { balance: "1250.50", heldBalance: "0" } },
      },
    });
  }
  let walletRow = await prisma.wallet.findUnique({ where: { riderId: riderProfile.id } });
  if (!walletRow) {
    walletRow = await prisma.wallet.create({
      data: { riderId: riderProfile.id, balance: "1250.50", heldBalance: "0" },
    });
  }

  await prisma.riderAssignment.create({
    data: {
      orderId: orderOne.id,
      riderId: riderProfile.id,
      assignedByAdminId: adminUser.id,
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: walletRow.id,
      type: WalletTransactionType.CREDIT_DELIVERY,
      amount: "45",
      reference: orderOne.id,
      meta: { orderId: orderOne.id },
    },
  });

  await prisma.customMealRequest.create({
    data: {
      customerId: priyaProfile.id,
      status: CustomMealRequestStatus.APPROVED,
      mealType: MealType.DINNER,
      targetCalories: 550,
      targetProteinG: 40,
      targetCarbG: 45,
      targetFatG: 18,
      targetFiberG: 10,
      exclusions: "No dairy",
      quantity: 1,
      notes: "Post-leg day meal",
      adminPrice: "399",
      adminNote: "Chef will use coconut aminos instead of soy",
    },
  });

  console.log("Seed complete. Login: admin@fitmeals.dev / rider@fitmeals.dev / alex@fitmeals.dev — Password123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
