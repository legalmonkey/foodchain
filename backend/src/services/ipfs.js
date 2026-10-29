const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const config = require("../config/env");

// Fast memory cache for evidence buffer so images always load instantly
const evidenceBufferCache = new Map();

function getEvidenceBuffer(cid) {
  return evidenceBufferCache.get(cid) || null;
}

/**
 * Uploads a file buffer to IPFS using Pinata API with resilient local caching fallback
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<{ cid: string, url: string, simulated: boolean }>}
 */
async function uploadToIPFS(fileBuffer, originalName, mimeType) {
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const fallbackCid = `Qm${hash.substring(0, 44)}`;

  // Store buffer in cache immediately
  evidenceBufferCache.set(fallbackCid, {
    buffer: fileBuffer,
    mimeType: mimeType || "image/jpeg",
    originalName: originalName || "evidence.jpg",
  });

  if (!config.ipfs.pinataJwt || config.ipfs.pinataJwt.includes("your_pinata")) {
    console.log(`✓ Pinata JWT not provided. Evidence cached locally under CID ${fallbackCid}`);
    return {
      cid: fallbackCid,
      url: `${config.ipfs.gatewayUrl}/${fallbackCid}`,
      simulated: true,
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: originalName || "evidence_file",
      contentType: mimeType || "application/octet-stream",
    });

    const metadata = JSON.stringify({
      name: `FoodChain_Evidence_${Date.now()}_${originalName || "evidence"}`,
      keyvalues: {
        platform: "FoodChain",
        timestamp: Date.now(),
      },
    });
    formData.append("pinataMetadata", metadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: "Infinity",
      headers: {
        Authorization: `Bearer ${config.ipfs.pinataJwt}`,
        ...formData.getHeaders(),
      },
      timeout: 12000,
    });

    const cid = res.data.IpfsHash;
    evidenceBufferCache.set(cid, {
      buffer: fileBuffer,
      mimeType: mimeType || "image/jpeg",
      originalName: originalName || "evidence.jpg",
    });

    console.log(`✓ Evidence successfully pinned to Pinata IPFS: ${cid}`);
    return {
      cid,
      url: `${config.ipfs.gatewayUrl}/${cid}`,
      simulated: false,
    };
  } catch (error) {
    console.warn("Pinata upload notice (retaining local CID cache):", error.response?.data?.error || error.message);
    return {
      cid: fallbackCid,
      url: `${config.ipfs.gatewayUrl}/${fallbackCid}`,
      simulated: true,
    };
  }
}

module.exports = {
  uploadToIPFS,
  getEvidenceBuffer,
};
