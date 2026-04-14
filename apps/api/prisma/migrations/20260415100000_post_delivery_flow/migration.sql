-- CreateTable
CREATE TABLE "OrderRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderRating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrderRating_orderId_key" ON "OrderRating"("orderId");
CREATE INDEX "OrderRating_customerId_idx" ON "OrderRating"("customerId");
ALTER TABLE "OrderRating" ADD CONSTRAINT "OrderRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderRating" ADD CONSTRAINT "OrderRating_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DriverRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DriverRating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverRating_orderId_key" ON "DriverRating"("orderId");
CREATE INDEX "DriverRating_riderId_idx" ON "DriverRating"("riderId");
CREATE INDEX "DriverRating_customerId_idx" ON "DriverRating"("customerId");
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TipTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TipTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TipTransaction_orderId_customerId_key" ON "TipTransaction"("orderId", "customerId");
CREATE INDEX "TipTransaction_riderId_idx" ON "TipTransaction"("riderId");
ALTER TABLE "TipTransaction" ADD CONSTRAINT "TipTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TipTransaction" ADD CONSTRAINT "TipTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TipTransaction" ADD CONSTRAINT "TipTransaction_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PostDeliveryFlowState" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "successModalSeen" BOOLEAN NOT NULL DEFAULT false,
    "orderRated" BOOLEAN NOT NULL DEFAULT false,
    "driverRated" BOOLEAN NOT NULL DEFAULT false,
    "tipHandled" BOOLEAN NOT NULL DEFAULT false,
    "mealsRated" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostDeliveryFlowState_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PostDeliveryFlowState_orderId_key" ON "PostDeliveryFlowState"("orderId");
CREATE INDEX "PostDeliveryFlowState_customerId_idx" ON "PostDeliveryFlowState"("customerId");
ALTER TABLE "PostDeliveryFlowState" ADD CONSTRAINT "PostDeliveryFlowState_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostDeliveryFlowState" ADD CONSTRAINT "PostDeliveryFlowState_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
