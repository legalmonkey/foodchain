const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const config = require("../config/env");
const ComplaintCache = require("../models/ComplaintCache");
const JurorVoteCache = require("../models/JurorVoteCache");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");

let provider;
let relayerWallet;
let contracts = {};

function getDeployedArtifact(contractName) {
  try {
    const addressesPath = path.resolve(__dirname, "../../../contracts/deployed/contractAddresses.json");
    const abiPath = path.resolve(__dirname, `../../../contracts/deployed/abis/${contractName}.json`);

    let address = config.blockchain.contracts[contractName.charAt(0).toLowerCase() + contractName.slice(1)];
    if (fs.existsSync(addressesPath)) {
      const addressesData = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
      if (addressesData.addresses && addressesData.addresses[contractName]) {
        address = addressesData.addresses[contractName];
      }
    }

    if (fs.existsSync(abiPath)) {
      const abiData = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
      return { address, abi: abiData.abi };
    }
  } catch (err) {
    console.warn(`Could not load deployment artifact for ${contractName}:`, err.message);
  }
  return { address: null, abi: [] };
}

function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

    if (config.blockchain.relayerPrivateKey && !config.blockchain.relayerPrivateKey.includes("your_backend")) {
      relayerWallet = new ethers.Wallet(config.blockchain.relayerPrivateKey, provider);
      console.log(`✓ Blockchain Relayer Wallet initialized: ${relayerWallet.address}`);
    } else {
      console.warn("⚠️ Backend relayer private key not set or placeholder in .env. Read-only mode for blockchain.");
    }

    const contractNames = [
      "UserRegistry",
      "OrderRegistry",
      "ReputationManager",
      "ComplaintRegistry",
      "DisputeResolution",
    ];

    for (const name of contractNames) {
      const artifact = getDeployedArtifact(name);
      if (artifact.address && artifact.abi.length > 0) {
        contracts[name] = new ethers.Contract(
          artifact.address,
          artifact.abi,
          relayerWallet || provider
        );
        console.log(`✓ Contract ${name} bound at ${artifact.address}`);
      }
    }
  } catch (err) {
    console.error("Blockchain initialization error:", err.message);
  }
}

async function createOnChainOrder(mongoOrderId, customerAddress, restaurantAddress) {
  if (!contracts.OrderRegistry || !relayerWallet) {
    console.warn("OrderRegistry contract or relayer wallet not configured. Generating off-chain simulated key.");
    return ethers.keccak256(ethers.toUtf8Bytes(mongoOrderId));
  }

  try {
    const tx = await contracts.OrderRegistry.createOrderRef(
      mongoOrderId,
      customerAddress,
      restaurantAddress
    );
    const receipt = await tx.wait();
    const orderKey = ethers.keccak256(ethers.toUtf8Bytes(mongoOrderId));
    return { orderKey, txHash: receipt.hash };
  } catch (error) {
    console.error("Error creating on-chain order ref:", error.message);
    throw error;
  }
}

async function assignOnChainDelivery(orderKey, deliveryAddress) {
  if (!contracts.OrderRegistry || !relayerWallet) return null;
  try {
    const tx = await contracts.OrderRegistry.assignDeliveryPartner(orderKey, deliveryAddress);
    return await tx.wait();
  } catch (error) {
    console.error("Error assigning on-chain delivery:", error.message);
  }
}

async function markOnChainDelivered(orderKey) {
  if (!contracts.OrderRegistry || !relayerWallet) return null;
  try {
    const tx = await contracts.OrderRegistry.markDelivered(orderKey);
    return await tx.wait();
  } catch (error) {
    console.error("Error marking on-chain delivered:", error.message);
  }
}

async function getOnChainReputation(walletAddress) {
  if (!contracts.ReputationManager) return 70;
  try {
    const score = await contracts.ReputationManager.getScore(walletAddress);
    return Number(score);
  } catch (error) {
    console.error("Error fetching reputation score:", error.message);
    return 70;
  }
}

function initEventListeners(io) {
  if (!contracts.ComplaintRegistry || !provider) {
    console.warn("Skipping contract event listeners (contracts not yet deployed/configured).");
    return;
  }

  try {
    // 1. ComplaintFiled
    contracts.ComplaintRegistry.on(
      "ComplaintFiled",
      async (complaintId, orderKey, filer, respondent, category, evidenceCID, event) => {
        try {
          const complaintIdNum = Number(complaintId);
          console.log(`[Event] ComplaintFiled: ID ${complaintIdNum}, Respondent: ${respondent}`);

          const order = await Order.findOne({ onChainOrderKey: orderKey });
          const categoryNames = ["FoodQuality", "LateDelivery", "WrongOrMissingItem", "HygienePackaging", "Behaviour"];

          await ComplaintCache.findOneAndUpdate(
            { onChainComplaintId: complaintIdNum },
            {
              onChainComplaintId: complaintIdNum,
              orderId: order ? order._id : null,
              onChainOrderKey: orderKey,
              filerAddress: filer.toLowerCase(),
              respondentAddress: respondent.toLowerCase(),
              category: categoryNames[Number(category)] || "FoodQuality",
              categoryIndex: Number(category),
              evidenceCID,
              status: "Filed",
              statusIndex: 0,
              filedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          if (io) {
            io.emit("complaintUpdated", {
              complaintId: complaintIdNum,
              status: "Filed",
              respondent: respondent.toLowerCase(),
              filer: filer.toLowerCase(),
            });
          }
        } catch (err) {
          console.error("Error processing ComplaintFiled event:", err.message);
        }
      }
    );

    // 2. ComplaintAutoResolved
    contracts.ComplaintRegistry.on("ComplaintAutoResolved", async (complaintId, respondent) => {
      try {
        const idNum = Number(complaintId);
        console.log(`[Event] ComplaintAutoResolved: ID ${idNum}`);

        await ComplaintCache.findOneAndUpdate(
          { onChainComplaintId: idNum },
          {
            status: "AutoResolved",
            statusIndex: 1,
            verdictUpheld: true,
            resolvedAt: new Date(),
          }
        );

        if (io) {
          io.emit("complaintUpdated", { complaintId: idNum, status: "AutoResolved", verdictUpheld: true });
        }
      } catch (err) {
        console.error("Error processing ComplaintAutoResolved event:", err.message);
      }
    });

    // 3. ComplaintContested
    contracts.ComplaintRegistry.on("ComplaintContested", async (complaintId, respondent, caseId) => {
      try {
        const idNum = Number(complaintId);
        const caseIdNum = Number(caseId);
        console.log(`[Event] ComplaintContested: ID ${idNum}, Case ID: ${caseIdNum}`);

        await ComplaintCache.findOneAndUpdate(
          { onChainComplaintId: idNum },
          {
            status: "InDispute",
            statusIndex: 3,
            caseId: caseIdNum,
          }
        );

        if (io) {
          io.emit("complaintUpdated", { complaintId: idNum, status: "InDispute", caseId: caseIdNum });
        }
      } catch (err) {
        console.error("Error processing ComplaintContested event:", err.message);
      }
    });

    // 4. CaseOpened (DisputeResolution)
    if (contracts.DisputeResolution) {
      contracts.DisputeResolution.on("CaseOpened", async (caseId, complaintId, jurors, votingDeadline) => {
        const cId = Number(caseId);
        console.log(`[Event] CaseOpened: Case ${cId} with ${jurors.length} jurors`);

        if (io) {
          io.emit("newAssignedCase", {
            caseId: cId,
            complaintId: Number(complaintId),
            jurors: jurors.map((j) => j.toLowerCase()),
            votingDeadline: Number(votingDeadline),
          });
        }
      });

      contracts.DisputeResolution.on("VoteCast", async (caseId, juror, verdict) => {
        const cId = Number(caseId);
        const verdictNames = ["None", "UpholdComplaint", "RejectComplaint"];
        await JurorVoteCache.findOneAndUpdate(
          { caseId: cId, jurorAddress: juror.toLowerCase() },
          {
            caseId: cId,
            jurorAddress: juror.toLowerCase(),
            verdict: verdictNames[Number(verdict)] || "None",
            verdictIndex: Number(verdict),
            votedAt: new Date(),
          },
          { upsert: true }
        );

        if (io) {
          io.emit("voteCast", { caseId: cId, juror: juror.toLowerCase() });
        }
      });

      contracts.DisputeResolution.on("CaseFinalized", async (caseId, complaintId, finalVerdict) => {
        const cId = Number(caseId);
        const compId = Number(complaintId);
        const verdictUpheld = Number(finalVerdict) === 1;

        console.log(`[Event] CaseFinalized: Case ${cId}, Upheld: ${verdictUpheld}`);

        await ComplaintCache.findOneAndUpdate(
          { onChainComplaintId: compId },
          {
            status: "Resolved",
            statusIndex: 4,
            verdictUpheld,
            resolvedAt: new Date(),
          }
        );

        if (io) {
          io.emit("complaintUpdated", { complaintId: compId, status: "Resolved", verdictUpheld });
        }
      });
    }

    // 5. ReputationUpdated
    if (contracts.ReputationManager) {
      contracts.ReputationManager.on("ReputationUpdated", async (subject, oldScore, newScore, delta) => {
        console.log(`[Event] ReputationUpdated: ${subject} from ${oldScore} to ${newScore} (${delta})`);
        await Restaurant.findOneAndUpdate(
          { walletAddress: subject.toLowerCase() },
          { reputationScore: Number(newScore) }
        );

        if (io) {
          io.emit("reputationUpdated", {
            walletAddress: subject.toLowerCase(),
            newScore: Number(newScore),
            delta: Number(delta),
          });
        }
      });
    }
  } catch (err) {
    console.error("Error setting up event listeners:", err.message);
  }
}

module.exports = {
  initBlockchain,
  createOnChainOrder,
  assignOnChainDelivery,
  markOnChainDelivered,
  getOnChainReputation,
  initEventListeners,
  getContracts: () => contracts,
  getProvider: () => provider,
};
