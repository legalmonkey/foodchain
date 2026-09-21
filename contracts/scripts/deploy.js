const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log(`Deploying FoodChain contracts with account: ${deployer.address}`);
  console.log(`Network: ${network.name} (Chain ID: ${(await ethers.provider.getNetwork()).chainId})`);
  console.log("----------------------------------------------------");

  // Load configurable parameters from environment (strict no-hardcoding)
  const MIN_JUROR_STAKE = ethers.parseEther(process.env.MIN_JUROR_STAKE || "0.01");
  const JURY_SIZE = parseInt(process.env.JURY_SIZE || "5", 10);
  const VOTING_WINDOW = parseInt(process.env.VOTING_WINDOW_SECONDS || "120", 10); // 2 min demo default
  const JUROR_REWARD = ethers.parseEther(process.env.JUROR_REWARD_POL || "0.005");
  const JUROR_SLASH = ethers.parseEther(process.env.JUROR_SLASH_POL || "0.005");
  const AUTO_RESOLVE_PENALTY = parseInt(process.env.AUTO_RESOLVE_PENALTY || "-10", 10);
  const UPHOLD_PENALTY = parseInt(process.env.UPHOLD_PENALTY || "-10", 10);
  const REJECT_BONUS = parseInt(process.env.REJECT_BONUS || "2", 10);
  const INITIAL_REPUTATION = parseInt(process.env.INITIAL_REPUTATION || "70", 10);
  const BACKEND_RELAYER_ADDRESS = process.env.BACKEND_RELAYER_ADDRESS || deployer.address;

  console.log("Configuration Parameters:");
  console.log(`- Minimum Juror Stake: ${ethers.formatEther(MIN_JUROR_STAKE)} POL`);
  console.log(`- Jury Size: ${JURY_SIZE}`);
  console.log(`- Voting Window: ${VOTING_WINDOW} seconds`);
  console.log(`- Backend Relayer: ${BACKEND_RELAYER_ADDRESS}`);
  console.log(`- Initial Reputation: ${INITIAL_REPUTATION}`);

  // 1. Deploy UserRegistry
  console.log("\nDeploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy(MIN_JUROR_STAKE);
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log(`UserRegistry deployed at: ${userRegistryAddress}`);

  // 2. Deploy OrderRegistry
  console.log("\nDeploying OrderRegistry...");
  const OrderRegistry = await ethers.getContractFactory("OrderRegistry");
  const orderRegistry = await OrderRegistry.deploy(BACKEND_RELAYER_ADDRESS);
  await orderRegistry.waitForDeployment();
  const orderRegistryAddress = await orderRegistry.getAddress();
  console.log(`OrderRegistry deployed at: ${orderRegistryAddress}`);

  // 3. Deploy ReputationManager
  console.log("\nDeploying ReputationManager...");
  const ReputationManager = await ethers.getContractFactory("ReputationManager");
  const reputationManager = await ReputationManager.deploy(INITIAL_REPUTATION);
  await reputationManager.waitForDeployment();
  const reputationManagerAddress = await reputationManager.getAddress();
  console.log(`ReputationManager deployed at: ${reputationManagerAddress}`);

  // 4. Deploy ComplaintRegistry
  console.log("\nDeploying ComplaintRegistry...");
  const ComplaintRegistry = await ethers.getContractFactory("ComplaintRegistry");
  const complaintRegistry = await ComplaintRegistry.deploy(
    orderRegistryAddress,
    reputationManagerAddress,
    AUTO_RESOLVE_PENALTY
  );
  await complaintRegistry.waitForDeployment();
  const complaintRegistryAddress = await complaintRegistry.getAddress();
  console.log(`ComplaintRegistry deployed at: ${complaintRegistryAddress}`);

  // 5. Deploy DisputeResolution
  console.log("\nDeploying DisputeResolution...");
  const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
  const disputeResolution = await DisputeResolution.deploy(
    userRegistryAddress,
    complaintRegistryAddress,
    reputationManagerAddress,
    JURY_SIZE,
    VOTING_WINDOW,
    JUROR_REWARD,
    JUROR_SLASH,
    UPHOLD_PENALTY,
    REJECT_BONUS
  );
  await disputeResolution.waitForDeployment();
  const disputeResolutionAddress = await disputeResolution.getAddress();
  console.log(`DisputeResolution deployed at: ${disputeResolutionAddress}`);

  // 6. Connect authorizations
  console.log("\nConnecting contract permissions...");
  let tx = await userRegistry.setAuthorizedCaller(disputeResolutionAddress, true);
  await tx.wait();
  console.log("✓ UserRegistry authorized DisputeResolution");

  tx = await reputationManager.setAuthorizedCaller(complaintRegistryAddress, true);
  await tx.wait();
  console.log("✓ ReputationManager authorized ComplaintRegistry");

  tx = await reputationManager.setAuthorizedCaller(disputeResolutionAddress, true);
  await tx.wait();
  console.log("✓ ReputationManager authorized DisputeResolution");

  tx = await complaintRegistry.setDisputeResolution(disputeResolutionAddress);
  await tx.wait();
  console.log("✓ ComplaintRegistry linked DisputeResolution");

  // 7. Save deployed addresses and ABIs for Backend and Frontend
  const deployedDir = path.join(__dirname, "..", "deployed");
  const abisDir = path.join(deployedDir, "abis");

  if (!fs.existsSync(deployedDir)) fs.mkdirSync(deployedDir, { recursive: true });
  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir, { recursive: true });

  const deploymentData = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    addresses: {
      UserRegistry: userRegistryAddress,
      OrderRegistry: orderRegistryAddress,
      ReputationManager: reputationManagerAddress,
      ComplaintRegistry: complaintRegistryAddress,
      DisputeResolution: disputeResolutionAddress,
    },
  };

  fs.writeFileSync(
    path.join(deployedDir, "contractAddresses.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  const backendContractsDir = path.resolve(__dirname, "../../backend/src/contracts");
  const frontendContractsDir = path.resolve(__dirname, "../../frontend/src/contracts");
  if (fs.existsSync(backendContractsDir)) {
    fs.writeFileSync(path.join(backendContractsDir, "contractAddresses.json"), JSON.stringify(deploymentData, null, 2));
  }
  if (fs.existsSync(frontendContractsDir)) {
    fs.writeFileSync(path.join(frontendContractsDir, "contractAddresses.json"), JSON.stringify(deploymentData, null, 2));
  }

  // Extract and save ABIs
  const contractNames = [
    "UserRegistry",
    "OrderRegistry",
    "ReputationManager",
    "ComplaintRegistry",
    "DisputeResolution",
  ];

  for (const name of contractNames) {
    const artifact = await hre.artifacts.readArtifact(name);
    fs.writeFileSync(
      path.join(abisDir, `${name}.json`),
      JSON.stringify(artifact, null, 2)
    );
    if (fs.existsSync(backendContractsDir)) {
      fs.writeFileSync(path.join(backendContractsDir, `${name}.json`), JSON.stringify(artifact, null, 2));
    }
    if (fs.existsSync(frontendContractsDir)) {
      fs.writeFileSync(path.join(frontendContractsDir, `${name}.json`), JSON.stringify(artifact, null, 2));
    }
  }

  console.log("\n✓ All contract addresses and ABIs saved to contracts/deployed/");
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
