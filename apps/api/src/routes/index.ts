import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { meRouter } from "./me.js";

export const apiV1Router: Router = Router();

apiV1Router.use("/auth", authRouter);
apiV1Router.use(meRouter);
