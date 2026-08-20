import express from "express";
import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
} from "../controllers/auth.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin
router.get("/", protect, requireRole("admin"), (req, res) => res.status(501).json({ message: "Not implemented" }));

export default router;