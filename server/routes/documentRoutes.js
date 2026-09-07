import express from "express";

import {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocuments,
    updateDocumentStatus,
} from "../controllers/documentController.js";
import { extractInvoice } from "../controllers/aiController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// router.post("/", createDocument);

router.get("/", getDocuments);

router.get("/:id", getDocumentById);

router.delete("/delete", deleteDocuments);

router.put(
    "/documents/:id",
    updateDocumentStatus
);

router.post(
    "/",
    upload.single("file"),
    createDocument
);

router.post("/extract-invoice", extractInvoice);



export default router;