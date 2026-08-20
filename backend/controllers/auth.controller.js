import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET env variable is required");
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const makeRoleNormal = (role) => (role === "admin" ? "admin" : "user");
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isGoodPassword = (password) => Boolean(password && password.length >= 6);
const checkRequiredFields = (fields, res) => {
    const missing = Object.keys(fields).filter((key) => !fields[key]);
    if (missing.length) {
        return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }
    return null;
};
const makeUserSafe = (user) => ({
    id: user._id,
    email: user.email,
    name: user.name,
    role: makeRoleNormal(user.role),
    createdAt: user.createdAt,
});
const createToken = (userId, role) =>
    jwt.sign({ id: userId, role: makeRoleNormal(role) }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

// Send the JWT in a single httpOnly cookie. The browser auto-attaches it on
// every request — no JS can read the token, no role cookie is needed.
const setAuthCookie = (res, token) => {
    res.cookie(COOKIE_NAME, token, {
        maxAge: COOKIE_MAX_AGE,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
};
const clearAuthCookie = (res) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
};
const sendTokenResponse = (user, statusCode, res, message) => {
    const role = makeRoleNormal(user.role);
    setAuthCookie(res, createToken(user._id, role));
    res.status(statusCode).json({
        success: true,
        message,
        data: { user: makeUserSafe(user) },
    });
};

// ---------- REGISTER ----------
export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    // Note: `role` is intentionally NOT read from req.body.
    // All new accounts are always created as "user". Admins are promoted manually.

    const missingError = checkRequiredFields({ name, email, password }, res);
    if (missingError) return missingError;

    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (!isGoodPassword(password)) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",   // always "user" — never trust client-supplied role
    });

    return sendTokenResponse(user, 201, res, "Account created successfully");
});

// ---------- LOGIN ----------
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const missingError = checkRequiredFields({ email, password }, res);
    if (missingError) return missingError;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, "Login successful");
});

export const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true, message: "Logged out" });
});

export const getMe = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: { user: makeUserSafe(req.user) },
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const allowedFields = ["name", "shippingAddress"];
    const updates = {};

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = typeof req.body[field] === "string"
                ? req.body[field].trim()
                : req.body[field];
        }
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
    ).select("-password");

    res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const missingError = checkRequiredFields({ currentPassword, newPassword }, res);
    if (missingError) return missingError;

    if (!isGoodPassword(newPassword)) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
});