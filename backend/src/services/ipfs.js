const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const config = require("../config/env");

/**
 * Uploads a file buffer or stream to IPFS using Pinata API
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<{ cid: string, url: string }>}
 */
async function uploadToIPFS(fileBuffer, originalName, mimeType) {
  if (!config.ipfs.pinataJwt || config.ipfs.pinataJwt.includes("your_pinata")) {
    console.warn("⚠️ Pinata JWT not configured in .env. Generating simulated IPFS CID for development.");
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const mockCid = `Qm${hash.substring(0, 44)}`;
    return {
      cid: mockCid,
      url: `${config.ipfs.gatewayUrl}/${mockCid}`,
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
      name: `FoodChain_Evidence_${Date.now()}_${originalName}`,
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
    });

    const cid = res.data.IpfsHash;
    return {
      cid,
      url: `${config.ipfs.gatewayUrl}/${cid}`,
      simulated: false,
    };
  } catch (error) {
    console.error("IPFS Upload Error:", error.response?.data || error.message);
    throw new Error(`Failed to upload evidence to IPFS: ${error.message}`);
  }
}

module.exports = {
  uploadToIPFS,
};
