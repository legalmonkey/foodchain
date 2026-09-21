const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FoodChain Smart Contracts Ecosystem", function () {
  let owner, backendRelayer, customer, restaurant, deliveryPartner, juror1, juror2, juror3, juror4, juror5;
  let userRegistry, orderRegistry, reputationManager, complaintRegistry, disputeResolution;

  const MIN_JUROR_STAKE = ethers.parseEther("0.05");
  const JURY_SIZE = 5;
  const VOTING_WINDOW = 300; // 5 minutes
  const JUROR_REWARD = ethers.parseEther("0.01");
  const JUROR_SLASH = ethers.parseEther("0.02");
  const AUTO_RESOLVE_PENALTY = -10;
  const UPHOLD_PENALTY = -10;
  const REJECT_BONUS = 2;
  const INITIAL_REPUTATION = 70;

  beforeEach(async function () {
    [
      owner,
      backendRelayer,
      customer,
      restaurant,
      deliveryPartner,
      juror1,
      juror2,
      juror3,
      juror4,
      juror5,
    ] = await ethers.getSigners();

    // 1. Deploy UserRegistry
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy(MIN_JUROR_STAKE);

    // 2. Deploy OrderRegistry
    const OrderRegistry = await ethers.getContractFactory("OrderRegistry");
    orderRegistry = await OrderRegistry.deploy(backendRelayer.address);

    // 3. Deploy ReputationManager
    const ReputationManager = await ethers.getContractFactory("ReputationManager");
    reputationManager = await ReputationManager.deploy(INITIAL_REPUTATION);

    // 4. Deploy ComplaintRegistry
    const ComplaintRegistry = await ethers.getContractFactory("ComplaintRegistry");
    complaintRegistry = await ComplaintRegistry.deploy(
      await orderRegistry.getAddress(),
      await reputationManager.getAddress(),
      AUTO_RESOLVE_PENALTY
    );

    // 5. Deploy DisputeResolution
    const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
    disputeResolution = await DisputeResolution.deploy(
      await userRegistry.getAddress(),
      await complaintRegistry.getAddress(),
      await reputationManager.getAddress(),
      JURY_SIZE,
      VOTING_WINDOW,
      JUROR_REWARD,
      JUROR_SLASH,
      UPHOLD_PENALTY,
      REJECT_BONUS
    );

    // 6. Connect permissions & authorized callers
    await userRegistry.setAuthorizedCaller(await disputeResolution.getAddress(), true);
    await reputationManager.setAuthorizedCaller(await complaintRegistry.getAddress(), true);
    await reputationManager.setAuthorizedCaller(await disputeResolution.getAddress(), true);
    await complaintRegistry.setDisputeResolution(await disputeResolution.getAddress());
  });

  describe("1. UserRegistry & Juror Staking", function () {
    it("should allow users to register with distinct roles", async function () {
      await userRegistry.connect(customer).registerUser(1); // Customer
      await userRegistry.connect(restaurant).registerUser(2); // Restaurant
      await userRegistry.connect(deliveryPartner).registerUser(3); // DeliveryPartner

      expect(await userRegistry.getRole(customer.address)).to.equal(1);
      expect(await userRegistry.getRole(restaurant.address)).to.equal(2);
      expect(await userRegistry.getRole(deliveryPartner.address)).to.equal(3);
    });

    it("should prevent duplicate registration", async function () {
      await userRegistry.connect(customer).registerUser(1);
      await expect(
        userRegistry.connect(customer).registerUser(1)
      ).to.be.revertedWith("User already registered");
    });

    it("should enforce minimum stake to become a juror and track the pool", async function () {
      await expect(
        userRegistry.connect(juror1).becomeJuror({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Stake below minimum");

      await userRegistry.connect(juror1).becomeJuror({ value: MIN_JUROR_STAKE });
      expect(await userRegistry.isJuror(juror1.address)).to.be.true;
      expect(await userRegistry.getJurorStake(juror1.address)).to.equal(MIN_JUROR_STAKE);

      const pool = await userRegistry.getJurorPool();
      expect(pool.length).to.equal(1);
      expect(pool[0]).to.equal(juror1.address);
    });

    it("should allow a juror to exit and refund their stake", async function () {
      await userRegistry.connect(juror1).becomeJuror({ value: MIN_JUROR_STAKE });
      const balanceBefore = await ethers.provider.getBalance(juror1.address);

      const tx = await userRegistry.connect(juror1).exitJuror();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(juror1.address);
      expect(await userRegistry.isJuror(juror1.address)).to.be.false;
      expect(balanceAfter).to.be.closeTo(balanceBefore + MIN_JUROR_STAKE - gasUsed, ethers.parseEther("0.001"));
    });
  });

  describe("2. OrderRegistry Flow", function () {
    const mongoOrderId = "65e01234abcd5678ef901234";

    it("should allow backend relayer to create, assign, and mark delivered", async function () {
      const orderKey = await orderRegistry.computeOrderKey(mongoOrderId);

      await orderRegistry.connect(backendRelayer).createOrderRef(
        mongoOrderId,
        customer.address,
        restaurant.address
      );

      let order = await orderRegistry.getOrder(orderKey);
      expect(order.exists).to.be.true;
      expect(order.customer).to.equal(customer.address);
      expect(order.restaurant).to.equal(restaurant.address);
      expect(order.deliveryPartner).to.equal(ethers.ZeroAddress);

      // Assign delivery partner
      await orderRegistry.connect(backendRelayer).assignDeliveryPartner(orderKey, deliveryPartner.address);
      order = await orderRegistry.getOrder(orderKey);
      expect(order.deliveryPartner).to.equal(deliveryPartner.address);

      // Mark delivered
      await orderRegistry.connect(backendRelayer).markDelivered(orderKey);
      order = await orderRegistry.getOrder(orderKey);
      expect(order.deliveredTimestamp).to.be.greaterThan(0);
    });

    it("should reject order creation from non-relayer", async function () {
      await expect(
        orderRegistry.connect(customer).createOrderRef(mongoOrderId, customer.address, restaurant.address)
      ).to.be.revertedWith("Caller is not backend relayer");
    });
  });

  describe("3. ReputationManager", function () {
    it("should return default score of 70 for uninitialized accounts", async function () {
      expect(await reputationManager.getScore(restaurant.address)).to.equal(70);
    });

    it("should allow authorized contracts to update score within [0, 100]", async function () {
      // Direct call by owner (authorized by default)
      await reputationManager.updateScore(restaurant.address, 10);
      expect(await reputationManager.getScore(restaurant.address)).to.equal(80);

      await reputationManager.updateScore(restaurant.address, -90);
      expect(await reputationManager.getScore(restaurant.address)).to.equal(0); // Clamped at 0

      await reputationManager.updateScore(restaurant.address, 150);
      expect(await reputationManager.getScore(restaurant.address)).to.equal(100); // Clamped at 100
    });
  });

  describe("4. Complaint Flow — Auto-Resolution", function () {
    const mongoOrderId = "65e01234abcd5678ef909999";
    let orderKey;
    const evidenceCID = "QmTestEvidenceCID1234567890abcdefghijklmnopqrstuv";

    beforeEach(async function () {
      orderKey = await orderRegistry.computeOrderKey(mongoOrderId);
      await orderRegistry.connect(backendRelayer).createOrderRef(
        mongoOrderId,
        customer.address,
        restaurant.address
      );
      await orderRegistry.connect(backendRelayer).assignDeliveryPartner(orderKey, deliveryPartner.address);
      await orderRegistry.connect(backendRelayer).markDelivered(orderKey);
    });

    it("should allow customer to file complaint and respondent to accept fault", async function () {
      await complaintRegistry.connect(customer).fileComplaint(
        orderKey,
        restaurant.address,
        0, // Category.FoodQuality
        evidenceCID
      );

      const complaint = await complaintRegistry.getComplaint(1);
      expect(complaint.filer).to.equal(customer.address);
      expect(complaint.respondent).to.equal(restaurant.address);
      expect(complaint.evidenceCID).to.equal(evidenceCID);
      expect(complaint.status).to.equal(0); // Status.Filed

      // Restaurant accepts fault
      await complaintRegistry.connect(restaurant).respondentAccepts(1);

      const updatedComplaint = await complaintRegistry.getComplaint(1);
      expect(updatedComplaint.status).to.equal(1); // Status.AutoResolved
      expect(updatedComplaint.verdictUpheld).to.be.true;

      // Reputation should drop by autoResolvePenalty (-10): 70 -> 60
      expect(await reputationManager.getScore(restaurant.address)).to.equal(60);
    });
  });

  describe("5. Complaint Flow — Contested -> Decentralized Jury -> Verdict & Slashing", function () {
    const mongoOrderId = "65e01234abcd5678ef908888";
    let orderKey;
    const evidenceCID = "QmJuryEvidenceCID1234567890abcdefghijklmnopqrstu";

    beforeEach(async function () {
      orderKey = await orderRegistry.computeOrderKey(mongoOrderId);
      await orderRegistry.connect(backendRelayer).createOrderRef(
        mongoOrderId,
        customer.address,
        restaurant.address
      );
      await orderRegistry.connect(backendRelayer).assignDeliveryPartner(orderKey, deliveryPartner.address);
      await orderRegistry.connect(backendRelayer).markDelivered(orderKey);

      // Register 5 jurors with stake
      const jurors = [juror1, juror2, juror3, juror4, juror5];
      for (const j of jurors) {
        await userRegistry.connect(j).becomeJuror({ value: MIN_JUROR_STAKE });
      }
    });

    it("should open a case upon contest, accept votes, finalize with majority uphold, reward winners and slash losers", async function () {
      // 1. File complaint
      await complaintRegistry.connect(customer).fileComplaint(
        orderKey,
        restaurant.address,
        2, // Category.WrongOrMissingItem
        evidenceCID
      );

      // 2. Restaurant contests complaint -> escalates to DisputeResolution
      const contestTx = await complaintRegistry.connect(restaurant).respondentContests(1);
      const receipt = await contestTx.wait();

      const complaintAfterContest = await complaintRegistry.getComplaint(1);
      expect(complaintAfterContest.status).to.equal(3); // Status.InDispute

      // 3. Check selected jurors for Case 1
      const assignedJurors = await disputeResolution.getCaseJurors(1);
      expect(assignedJurors.length).to.equal(5);

      // 4. Cast votes: 3 vote Uphold (1), 2 vote Reject (2)
      // Find signers matching assigned jurors
      const signerMap = {
        [juror1.address]: juror1,
        [juror2.address]: juror2,
        [juror3.address]: juror3,
        [juror4.address]: juror4,
        [juror5.address]: juror5,
      };

      // First 3 assigned jurors vote Uphold
      await disputeResolution.connect(signerMap[assignedJurors[0]]).castVote(1, 1);
      await disputeResolution.connect(signerMap[assignedJurors[1]]).castVote(1, 1);
      await disputeResolution.connect(signerMap[assignedJurors[2]]).castVote(1, 1);

      // Next 2 assigned jurors vote Reject (the 5th vote will trigger auto-finalization)
      await disputeResolution.connect(signerMap[assignedJurors[3]]).castVote(1, 2);
      await disputeResolution.connect(signerMap[assignedJurors[4]]).castVote(1, 2);

      // 5. Verify finalization
      const caseData = await disputeResolution.cases(1);
      expect(caseData.finalized).to.be.true;
      expect(caseData.finalVerdict).to.equal(1); // Verdict.UpholdComplaint

      // Complaint status should be resolved
      const resolvedComplaint = await complaintRegistry.getComplaint(1);
      expect(resolvedComplaint.status).to.equal(4); // Status.Resolved
      expect(resolvedComplaint.verdictUpheld).to.be.true;

      // Restaurant reputation should have decreased: 70 - 10 = 60
      expect(await reputationManager.getScore(restaurant.address)).to.equal(60);

      // Check winning jurors received reward
      const winningJurorStake = await userRegistry.getJurorStake(assignedJurors[0]);
      expect(winningJurorStake).to.equal(MIN_JUROR_STAKE + JUROR_REWARD);

      // Check losing jurors were slashed
      const losingJurorStake = await userRegistry.getJurorStake(assignedJurors[3]);
      expect(losingJurorStake).to.equal(MIN_JUROR_STAKE - JUROR_SLASH);
    });

    it("should allow admin to force finalize a case for demo purposes", async function () {
      await complaintRegistry.connect(customer).fileComplaint(
        orderKey,
        restaurant.address,
        1, // LateDelivery
        evidenceCID
      );

      await complaintRegistry.connect(restaurant).respondentContests(1);

      // Admin uses emergency forceFinalize with RejectComplaint (2)
      await disputeResolution.connect(owner).forceFinalize(1, 2);

      const caseData = await disputeResolution.cases(1);
      expect(caseData.finalized).to.be.true;
      expect(caseData.finalVerdict).to.equal(2); // RejectComplaint

      const resolvedComplaint = await complaintRegistry.getComplaint(1);
      expect(resolvedComplaint.status).to.equal(4); // Resolved
      expect(resolvedComplaint.verdictUpheld).to.be.false;

      // Restaurant reputation increases by reject bonus (+2): 70 + 2 = 72
      expect(await reputationManager.getScore(restaurant.address)).to.equal(72);
    });
  });
});
