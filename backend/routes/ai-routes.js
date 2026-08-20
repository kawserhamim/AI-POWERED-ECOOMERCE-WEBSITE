import express from "express";
import  {getSmartSearchResults}  from "../services/ai-service.js";

const router = express.Router();



router.post("/", getSmartSearchResults);



export default router;