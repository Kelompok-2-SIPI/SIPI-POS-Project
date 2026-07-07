-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- Seed default Business for existing single-tenant data ("Ayam Geprek Bu Yuli" demo account)
INSERT INTO "businesses" ("id", "name", "created_at")
VALUES ('9f1e47fa-f91a-4155-8f29-c62c75fa2324', 'Ayam Geprek Bu Yuli', CURRENT_TIMESTAMP);

-- AlterTable: add business_id as nullable first so existing rows can be backfilled
ALTER TABLE "users" ADD COLUMN "business_id" TEXT;
ALTER TABLE "menus" ADD COLUMN "business_id" TEXT;
ALTER TABLE "ingredients" ADD COLUMN "business_id" TEXT;
ALTER TABLE "recipe_items" ADD COLUMN "business_id" TEXT;
ALTER TABLE "ingredient_price_history" ADD COLUMN "business_id" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "business_id" TEXT;
ALTER TABLE "transactions" ADD COLUMN "business_id" TEXT;
ALTER TABLE "transaction_items" ADD COLUMN "business_id" TEXT;
ALTER TABLE "menu_hpp_history" ADD COLUMN "business_id" TEXT;

-- Backfill: point all existing rows at the "Ayam Geprek Bu Yuli" business
UPDATE "users" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "menus" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "ingredients" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "recipe_items" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "ingredient_price_history" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "stock_movements" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "transactions" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "transaction_items" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';
UPDATE "menu_hpp_history" SET "business_id" = '9f1e47fa-f91a-4155-8f29-c62c75fa2324';

-- AlterTable: now enforce NOT NULL now that every row is backfilled
ALTER TABLE "users" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "menus" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "ingredients" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "recipe_items" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "ingredient_price_history" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "transaction_items" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "menu_hpp_history" ALTER COLUMN "business_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_business_id_idx" ON "users"("business_id");

-- CreateIndex
CREATE INDEX "menus_business_id_idx" ON "menus"("business_id");

-- CreateIndex
CREATE INDEX "ingredients_business_id_idx" ON "ingredients"("business_id");

-- CreateIndex
CREATE INDEX "recipe_items_business_id_idx" ON "recipe_items"("business_id");

-- CreateIndex
CREATE INDEX "ingredient_price_history_business_id_idx" ON "ingredient_price_history"("business_id");

-- CreateIndex
CREATE INDEX "stock_movements_business_id_idx" ON "stock_movements"("business_id");

-- CreateIndex
CREATE INDEX "transactions_business_id_idx" ON "transactions"("business_id");

-- CreateIndex
CREATE INDEX "transaction_items_business_id_idx" ON "transaction_items"("business_id");

-- CreateIndex
CREATE INDEX "menu_hpp_history_business_id_idx" ON "menu_hpp_history"("business_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_price_history" ADD CONSTRAINT "ingredient_price_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_hpp_history" ADD CONSTRAINT "menu_hpp_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
