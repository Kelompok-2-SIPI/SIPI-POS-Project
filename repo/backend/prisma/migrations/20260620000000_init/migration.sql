-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('kasir', 'admin_gudang', 'owner');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('restock', 'usage', 'adjustment');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'non_cash');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "hpp" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "stock_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "min_stock_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "latest_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menu_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "qty_used" DECIMAL(12,3) NOT NULL,
    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_price_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "recorded_at" DATE NOT NULL,
    "recorded_by" UUID NOT NULL,
    CONSTRAINT "ingredient_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "qty_change" DECIMAL(12,3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_hpp" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cashier_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "menu_name" VARCHAR(150) NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "unit_hpp" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: recipe_items
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_menu_id_fkey"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ingredient_price_history
ALTER TABLE "ingredient_price_history" ADD CONSTRAINT "ingredient_price_history_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ingredient_price_history" ADD CONSTRAINT "ingredient_price_history_recorded_by_fkey"
    FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: stock_movements
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredient_id_fkey"
    FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: transactions
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashier_id_fkey"
    FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: transaction_items
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_menu_id_fkey"
    FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
