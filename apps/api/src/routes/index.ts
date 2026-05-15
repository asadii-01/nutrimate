import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { predictionsRouter } from "../modules/predictions/predictions.routes.js";
import { recommendationsRouter } from "../modules/recommendations/recommendations.routes.js";
import { logsRouter } from "../modules/logs/logs.routes.js";
import { nutritionRouter } from "../modules/nutrition/nutrition.routes.js";
import { meRouter } from "./me.js";

export const apiV1Router: Router = Router();

apiV1Router.use("/auth", authRouter);
apiV1Router.use("/profile", profileRouter);
apiV1Router.use("/predictions", predictionsRouter);
apiV1Router.use("/recommendations", recommendationsRouter);
apiV1Router.use("/logs", logsRouter);
apiV1Router.use("/nutrition", nutritionRouter);
apiV1Router.use(meRouter);
