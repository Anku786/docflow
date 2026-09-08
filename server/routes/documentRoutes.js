import express from "express";

import {
    createDocument,
    getDocuments,
    deleteDocuments,
    updateDocumentStatus,
} from "../controllers/documentController.js";
import { extractInvoice } from "../controllers/aiController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getDocuments);

router.delete("/delete", deleteDocuments);

router.put(
    "update/:id",
    updateDocumentStatus
);

router.post(
    "/create",
    upload.single("file"),
    createDocument
);

router.post("/extract-invoice", extractInvoice);



export default router;