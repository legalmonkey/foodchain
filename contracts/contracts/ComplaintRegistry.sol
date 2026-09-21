// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./OrderRegistry.sol";
import "./ReputationManager.sol";

interface IDisputeResolution {
    function openCase(uint256 complaintId) external returns (uint256);
}

/**
 * @title ComplaintRegistry
 * @dev Records customer complaints with IPFS evidence CID and manages resolution/dispute escalation.
 */
contract ComplaintRegistry is Ownable {
    enum Category { FoodQuality, LateDelivery, WrongOrMissingItem, HygienePackaging, Behaviour }
    enum Status { Filed, AutoResolved, Contested, InDispute, Resolved }

    struct Complaint {
        bytes32 orderKey;
        address filer;
        address respondent;
        Category category;
        string evidenceCID;
        Status status;
        uint256 filedAt;
        bool verdictUpheld;
        uint256 resolvedAt;
    }

    OrderRegistry public orderRegistry;
    ReputationManager public reputationManager;
    address public disputeResolution;

    int256 public autoResolvePenalty; // default negative delta (e.g. -10)
    uint256 public complaintCount;
    mapping(uint256 => Complaint) public complaints;

    event ComplaintFiled(
        uint256 indexed complaintId,
        bytes32 indexed orderKey,
        address indexed filer,
        address respondent,
        Category category,
        string evidenceCID
    );
    event ComplaintAutoResolved(uint256 indexed complaintId, address indexed respondent);
    event ComplaintContested(uint256 indexed complaintId, address indexed respondent, uint256 caseId);
    event ComplaintResolved(uint256 indexed complaintId, bool verdictUpheld);
    event DisputeResolutionUpdated(address indexed previousContract, address indexed newContract);
    event AutoResolvePenaltyUpdated(int256 oldPenalty, int256 newPenalty);

    modifier onlyDisputeResolution() {
        require(msg.sender == disputeResolution || msg.sender == owner(), "Caller not dispute resolution contract");
        _;
    }

    constructor(
        address _orderRegistry,
        address _reputationManager,
        int256 _autoResolvePenalty
    ) Ownable(msg.sender) {
        require(_orderRegistry != address(0), "Invalid order registry address");
        require(_reputationManager != address(0), "Invalid reputation manager address");

        orderRegistry = OrderRegistry(_orderRegistry);
        reputationManager = ReputationManager(_reputationManager);
        autoResolvePenalty = _autoResolvePenalty;
    }

    function setDisputeResolution(address _disputeResolution) external onlyOwner {
        require(_disputeResolution != address(0), "Invalid dispute resolution address");
        emit DisputeResolutionUpdated(disputeResolution, _disputeResolution);
        disputeResolution = _disputeResolution;
    }

    function setAutoResolvePenalty(int256 _newPenalty) external onlyOwner {
        emit AutoResolvePenaltyUpdated(autoResolvePenalty, _newPenalty);
        autoResolvePenalty = _newPenalty;
    }

    function fileComplaint(
        bytes32 orderKey,
        address respondent,
        Category category,
        string calldata evidenceCID
    ) external returns (uint256) {
        OrderRegistry.OrderRef memory order = orderRegistry.getOrder(orderKey);
        require(order.exists, "Order does not exist");
        require(msg.sender == order.customer, "Only customer can file complaint");
        require(
            respondent == order.restaurant || respondent == order.deliveryPartner,
            "Respondent must be restaurant or delivery partner"
        );
        require(bytes(evidenceCID).length > 0, "Evidence CID cannot be empty");

        complaintCount++;
        uint256 complaintId = complaintCount;

        complaints[complaintId] = Complaint({
            orderKey: orderKey,
            filer: msg.sender,
            respondent: respondent,
            category: category,
            evidenceCID: evidenceCID,
            status: Status.Filed,
            filedAt: block.timestamp,
            verdictUpheld: false,
            resolvedAt: 0
        });

        emit ComplaintFiled(complaintId, orderKey, msg.sender, respondent, category, evidenceCID);
        return complaintId;
    }

    function respondentAccepts(uint256 complaintId) external {
        Complaint storage complaint = complaints[complaintId];
        require(complaint.filedAt > 0, "Complaint does not exist");
        require(msg.sender == complaint.respondent, "Only respondent can accept fault");
        require(complaint.status == Status.Filed, "Complaint not in filed status");

        complaint.status = Status.AutoResolved;
        complaint.verdictUpheld = true;
        complaint.resolvedAt = block.timestamp;

        reputationManager.updateScore(complaint.respondent, autoResolvePenalty);

        emit ComplaintAutoResolved(complaintId, complaint.respondent);
    }

    function respondentContests(uint256 complaintId) external returns (uint256 caseId) {
        Complaint storage complaint = complaints[complaintId];
        require(complaint.filedAt > 0, "Complaint does not exist");
        require(msg.sender == complaint.respondent, "Only respondent can contest");
        require(complaint.status == Status.Filed, "Complaint not in filed status");
        require(disputeResolution != address(0), "Dispute resolution contract not configured");

        complaint.status = Status.InDispute;

        caseId = IDisputeResolution(disputeResolution).openCase(complaintId);

        emit ComplaintContested(complaintId, complaint.respondent, caseId);
        return caseId;
    }

    function resolveComplaintFromDispute(uint256 complaintId, bool verdictUpheld) external onlyDisputeResolution {
        Complaint storage complaint = complaints[complaintId];
        require(complaint.filedAt > 0, "Complaint does not exist");
        require(complaint.status == Status.InDispute, "Complaint not in dispute");

        complaint.status = Status.Resolved;
        complaint.verdictUpheld = verdictUpheld;
        complaint.resolvedAt = block.timestamp;

        emit ComplaintResolved(complaintId, verdictUpheld);
    }

    function getComplaint(uint256 complaintId) external view returns (Complaint memory) {
        require(complaints[complaintId].filedAt > 0, "Complaint does not exist");
        return complaints[complaintId];
    }
}
