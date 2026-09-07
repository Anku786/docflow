// ============================================================
// parseInvoice.js
// ============================================================

// ============================================================
// Utility
// ============================================================

const normalizeText = (text = "") => {
    return text
        .replace(/\u00a0/g, " ")
        .replace(/\*\*/g, "")
        .replace(/\r?\n/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim();
};


// ============================================================
// Generic field extractor
// Extracts:
//
// Hotel Name Sapphire Sand Resort Hotel City GOA Check-in ...
//
// -> Hotel Name = Sapphire Sand Resort
// -> Hotel City = GOA
// ============================================================

const extractField = (text, label, nextLabels = []) => {
    const normalizedText = normalizeText(text);

    const escapedLabel = label.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const escapedNextLabels = nextLabels.map((item) =>
        item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    let stopPattern = "$";

    if (escapedNextLabels.length > 0) {
        stopPattern = `(?=\\s+(?:${escapedNextLabels.join(
            "|"
        )})(?:\\s|$))`;
    }

    const regex = new RegExp(
        `${escapedLabel}\\s*[:\\-]?\\s*(.*?)\\s*${stopPattern}`,
        "i"
    );

    const match = normalizedText.match(regex);

    if (!match) {
        return null;
    }

    const value = match[1]
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return value || null;
};


// ============================================================
// Invoice Number
// ============================================================

const extractInvoiceNumber = (text) => {
    return extractField(text, "Invoice No.", [
        "Date",
        "Place of Supply",
        "Transactional Type/Category",
        "Transactional Details",
        "Customer Name",
        "Hotel Name",
    ]);
};


// ============================================================
// Invoice Date
// ============================================================

const extractInvoiceDate = (text) => {
    return extractField(text, "Date", [
        "Place of Supply",
        "Transactional Type/Category",
        "Transactional Details",
        "Customer Name",
        "Hotel Name",
    ]);
};


// ============================================================
// Hotel Name
// ============================================================

const extractHotelName = (text) => {
    return extractField(text, "Hotel Name", [
        "Hotel City",
        "PAN",
        "HSN/SAC",
        "GSTIN",
        "CIN",
        "Service Description",
    ]);
};


// ============================================================
// Hotel City
// ============================================================

const extractHotelCity = (text) => {
    return extractField(text, "Hotel City", [
        "PAN",
        "HSN/SAC",
        "GSTIN",
        "CIN",
        "Service Description",
        "Tax Payable under RCM",
        "Advanced Receipt Voucher No.",
        "Check-in",
        "Check-Out",
        "Check Out",
    ]);
};


// ============================================================
// Check-in
// ============================================================

const extractCheckIn = (text) => {
    const normalizedText = normalizeText(text);

    const match = normalizedText.match(
        /Check-in\s+([A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i
    );

    if (!match) {
        return null;
    }

    return match[1].trim();
};


// ============================================================
// Check-out
// ============================================================

const extractCheckOut = (text) => {
    const normalizedText = normalizeText(text);

    const match = normalizedText.match(
        /Check-Out\s+([A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i
    );

    if (!match) {
        return null;
    }

    return match[1].trim();
};


// ============================================================
// Total Amount
// ============================================================

export const extractTotalAmount = (text) => {
    const normalizedText = normalizeText(text);

    // Example:
    // Grand Total ₹7892.67

    const grandTotalMatch = normalizedText.match(
        /Grand\s+Total\s*[:\-]?\s*((?:₹|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?)/i
    );

    if (grandTotalMatch) {
        return grandTotalMatch[1].trim();
    }

    // Fallback
    const fallbackMatch = normalizedText.match(
        /(?:Total\s+Amount|Total|Amount)\s*[:\-]?\s*((?:₹|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?)/i
    );

    if (fallbackMatch) {
        return fallbackMatch[1].trim();
    }

    return null;
};


const extractCustomerName = (text) => {
    const normalized = normalizeText(text);

    const match = normalized.match(
        /Customer Name\s+(.+?)(?=\s+Hotel Name\b)/i
    );

    return match ? match[1].trim() : null;
};

// ============================================================
// Expense Type - Hotel
// ============================================================

const parseHotelInvoice = (text) => {
    const fields = [];

    fields.push({
        label: "Expense Type",
        value: "Hotel Booking",
        confidence: "99%",
    });

    const customerName = extractCustomerName(text);

    if (customerName) {
        fields.push({
            label: "Customer Name",
            value: customerName,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Hotel Name
    // ----------------------------

    const hotelName = extractHotelName(text);

    if (hotelName) {
        fields.push({
            label: "Hotel Name",
            value: hotelName,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Hotel City
    // ----------------------------

    const hotelCity = extractHotelCity(text);

    if (hotelCity) {
        fields.push({
            label: "Hotel City",
            value: hotelCity,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Invoice Number
    // ----------------------------

    const invoiceNumber = extractInvoiceNumber(text);

    if (invoiceNumber) {
        fields.push({
            label: "Invoice Number",
            value: invoiceNumber,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Invoice Date
    // ----------------------------

    const invoiceDate = extractInvoiceDate(text);

    if (invoiceDate) {
        fields.push({
            label: "Invoice Date",
            value: invoiceDate,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Check-in
    // ----------------------------

    const checkIn = extractCheckIn(text);

    if (checkIn) {
        fields.push({
            label: "Check-in",
            value: checkIn,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Check-out
    // ----------------------------

    const checkOut = extractCheckOut(text);

    if (checkOut) {
        fields.push({
            label: "Check-out",
            value: checkOut,
            confidence: "99%",
        });
    }


    // ----------------------------
    // Total Amount
    // ----------------------------

    const totalAmount = extractTotalAmount(text);

    if (totalAmount) {
        fields.push({
            label: "Total Amount",
            value: totalAmount,
            confidence: "99%",
        });
    }


    return fields;
};


// ============================================================
// Expense Type - Cab
// ============================================================

const parseCabInvoice = (text) => {
    const fields = [];

    fields.push({
        label: "Expense Type",
        value: "Cab Fare",
        confidence: "99%",
    });


    // Invoice Number

    const invoiceNumber = extractInvoiceNumber(text);

    if (invoiceNumber) {
        fields.push({
            label: "Invoice Number",
            value: invoiceNumber,
            confidence: "99%",
        });
    }


    // Invoice Date

    const invoiceDate = extractInvoiceDate(text);

    if (invoiceDate) {
        fields.push({
            label: "Invoice Date",
            value: invoiceDate,
            confidence: "99%",
        });
    }


    // Pickup

    const pickup = extractField(text, "Pickup", [
        "Drop-off",
        "Dropoff",
        "Date",
        "Total",
        "Amount",
    ]);

    if (pickup) {
        fields.push({
            label: "Pickup",
            value: pickup,
            confidence: "95%",
        });
    }


    // Drop-off

    const dropOff = extractField(text, "Drop-off", [
        "Dropoff",
        "Date",
        "Total",
        "Amount",
    ]);

    if (dropOff) {
        fields.push({
            label: "Drop-off",
            value: dropOff,
            confidence: "95%",
        });
    }


    // Total

    const totalAmount = extractTotalAmount(text);

    if (totalAmount) {
        fields.push({
            label: "Total Amount",
            value: totalAmount,
            confidence: "99%",
        });
    }


    return fields;
};


// ============================================================
// Expense Type - Flight
// ============================================================

const parseFlightInvoice = (text) => {
    const fields = [];

    fields.push({
        label: "Expense Type",
        value: "Air Fare",
        confidence: "99%",
    });


    // Invoice Number

    const invoiceNumber = extractInvoiceNumber(text);

    if (invoiceNumber) {
        fields.push({
            label: "Invoice Number",
            value: invoiceNumber,
            confidence: "99%",
        });
    }


    // Invoice Date

    const invoiceDate = extractInvoiceDate(text);

    if (invoiceDate) {
        fields.push({
            label: "Invoice Date",
            value: invoiceDate,
            confidence: "99%",
        });
    }


    // PNR

    const normalizedText = normalizeText(text);

    const pnrMatch = normalizedText.match(
        /PNR\s*(?:No|Number|#)?\s*[:\-]?\s*([A-Z0-9]+)/i
    );

    if (pnrMatch) {
        fields.push({
            label: "PNR",
            value: pnrMatch[1],
            confidence: "98%",
        });
    }


    // Total

    const totalAmount = extractTotalAmount(text);

    if (totalAmount) {
        fields.push({
            label: "Total Amount",
            value: totalAmount,
            confidence: "99%",
        });
    }


    return fields;
};


// ============================================================
// Other Expense
// ============================================================

const parseGenericInvoice = (text) => {
    const fields = [];

    fields.push({
        label: "Expense Type",
        value: "Other Expense",
        confidence: "80%",
    });


    const invoiceNumber = extractInvoiceNumber(text);

    if (invoiceNumber) {
        fields.push({
            label: "Invoice Number",
            value: invoiceNumber,
            confidence: "95%",
        });
    }


    const invoiceDate = extractInvoiceDate(text);

    if (invoiceDate) {
        fields.push({
            label: "Invoice Date",
            value: invoiceDate,
            confidence: "95%",
        });
    }


    const totalAmount = extractTotalAmount(text);

    if (totalAmount) {
        fields.push({
            label: "Total Amount",
            value: totalAmount,
            confidence: "95%",
        });
    }


    return fields;
};


// ============================================================
// Category Detection
// ============================================================

const detectInvoiceCategory = (text) => {
    const normalizedText = normalizeText(text).toLowerCase();

    let hotelScore = 0;
    let cabScore = 0;
    let flightScore = 0;


    // ----------------------------
    // Hotel
    // ----------------------------

    const hotelKeywords = [
        "hotel",
        "hotel name",
        "hotel city",
        "check-in",
        "check-out",
        "accommodation",
        "accommodation charges",
        "room",
        "guest",
        "nights",
        "reservation service for accommodation",
    ];

    hotelKeywords.forEach((keyword) => {
        if (normalizedText.includes(keyword)) {
            hotelScore++;
        }
    });


    // ----------------------------
    // Cab
    // ----------------------------

    const cabKeywords = [
        "cab",
        "taxi",
        "uber",
        "ola",
        "ride",
        "driver",
        "pickup",
        "pick-up",
        "dropoff",
        "drop-off",
        "cab fare",
    ];

    cabKeywords.forEach((keyword) => {
        if (normalizedText.includes(keyword)) {
            cabScore++;
        }
    });


    // ----------------------------
    // Flight
    // ----------------------------

    const flightKeywords = [
        "flight",
        "airline",
        "airlines",
        "boarding",
        "boarding pass",
        "pnr",
        "departure",
        "arrival",
        "passenger",
        "terminal",
        "air fare",
        "airfare",
    ];

    flightKeywords.forEach((keyword) => {
        if (normalizedText.includes(keyword)) {
            flightScore++;
        }
    });


    const scores = {
        hotel: hotelScore,
        cab: cabScore,
        flight: flightScore,
    };


    const category = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
    );


    const score = scores[category];


    if (score === 0) {
        return {
            category: "other",
            score: 0,
        };
    }


    return {
        category,
        score,
    };
};


// ============================================================
// MAIN PARSER
// ============================================================

export const parseInvoice = (text) => {
    const { category, score } = detectInvoiceCategory(text);

    switch (category) {
        case "hotel":
            return parseHotelInvoice(text);

        case "cab":
            return parseCabInvoice(text);

        case "flight":
            return parseFlightInvoice(text);

        default:
            return parseGenericInvoice(text);
    }
};