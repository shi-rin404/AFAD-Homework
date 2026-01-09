const express = require("express");

const db = require("../db");
const {
  addressSimilarity,
  hasMatchingNumberToken,
  maskAddress,
} = require("../utils/address");

const router = express.Router();

const SIMILARITY_THRESHOLD = Number(
  process.env.ADDRESS_SIMILARITY_THRESHOLD || 0.85
);
const SIMILARITY_LIMIT = Number(
  process.env.ADDRESS_SIMILARITY_LIMIT || 500
);

router.post("/", async (req, res) => {
  const { first_name, last_name, address, last_contact } = req.body;

  if (!first_name || !last_name || !address || !last_contact) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    const candidates = await db.query(
      "SELECT id, address FROM reports ORDER BY id DESC LIMIT $1",
      [SIMILARITY_LIMIT]
    );

    let bestMatch = null;
    for (const row of candidates.rows) {
      const score = addressSimilarity(address, row.address);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: row.id, score, address: row.address };
      }
    }

    if (
      bestMatch &&
      bestMatch.score >= SIMILARITY_THRESHOLD &&
      hasMatchingNumberToken(address, bestMatch.address)
    ) {
      const masked = maskAddress(bestMatch.address);
      const details = masked ? ` (${masked})` : "";
      return res
        .status(409)
        .send(`Benzer adres bulundu${details}, rapor kaydedilmedi.`);
    }

    const query =
      "INSERT INTO reports (first_name, last_name, address, last_contact) VALUES ($1, $2, $3, $4) RETURNING id";
    const values = [first_name, last_name, address, last_contact];
    const result = await db.query(query, values);

    console.log("New report:", { id: result.rows[0].id, first_name, last_name });
    return res.status(201).send("Rapor alındı.");
  } catch (error) {
    console.error("Failed to insert report:", error);
    return res.status(500).send("Server error.");
  }
});

module.exports = router;
