/**
 * Seeds the `food_catalog` collection with curated Pakistani dishes.
 *
 * The dish data is generated from `services/ml/pipelines/seed_data.py` (the
 * same `DISHES` library the KNN recommender uses) and checked in as
 * `src/data/food-catalog-seed.json`. Upserts by `slug`, so it is idempotent.
 *
 * Run with:  pnpm --filter @nutrimate/api seed:catalog
 */
import { readFile } from "node:fs/promises";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { logger } from "../lib/logger.js";
import { FoodCatalog } from "../models/FoodCatalog.js";

interface SeedDish {
  foodId: string;
  name: string;
  kcal: number;
  macros: { protein: number; carbs: number; fats: number };
  costTier: "low" | "medium" | "high";
  hostelFriendly: boolean;
  dietTags: string[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  region: "pakistani" | "general";
  source: "curated" | "spoonacular";
}

async function main(): Promise<void> {
  const seedUrl = new URL("../data/food-catalog-seed.json", import.meta.url);
  const dishes = JSON.parse(await readFile(seedUrl, "utf8")) as SeedDish[];

  await connectMongo();

  const result = await FoodCatalog.bulkWrite(
    dishes.map((d) => ({
      updateOne: {
        filter: { slug: d.foodId },
        update: {
          $set: {
            slug: d.foodId,
            name: d.name,
            mealType: d.mealType,
            kcal: d.kcal,
            macros: d.macros,
            costTier: d.costTier,
            hostelFriendly: d.hostelFriendly,
            dietTags: d.dietTags,
            region: d.region,
            source: d.source,
          },
        },
        upsert: true,
      },
    })),
  );

  logger.info(
    { upserted: result.upsertedCount, modified: result.modifiedCount, total: dishes.length },
    "food_catalog seeded",
  );

  await disconnectMongo();
}

main().catch((err) => {
  logger.fatal({ err }, "food catalog seed failed");
  process.exit(1);
});
