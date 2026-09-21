// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./UserRegistry.sol";
import "./ComplaintRegistry.sol";
import "./ReputationManager.sol";

/**
 * @title DisputeResolution
 * @dev Manages decentralized jury selection, voting, reward/slashing, and reputation finalization.
 */
contract DisputeResolution is Ownable, ReentrancyGuard {
    enum Verdict { None, UpholdComplaint, RejectComplaint }

    struct CaseData {
        uint256 complaintId;
        address[] jurors;
        uint256 upholdVotes;
        uint256 rejectVotes;
        uint256 votingDeadline;
        bool finalized;
        Verdict finalVerdict;
    }

    UserRegistry public userRegistry;
    ComplaintRegistry public complaintRegistry;
    ReputationManager public reputationManager;

    uint256 public jurySize;
    uint256 public votingWindow;
    uint256 public jurorRewardAmount;
    uint256 public jurorSlashAmount;
    int256 public reputationUpholdDelta;
    int256 public reputationRejectDelta;

    uint256 public caseCount;
    mapping(uint256 => CaseData) public cases;
    mapping(uint256 => mapping(address => Verdict)) public caseVotes;
    mapping(uint256 => mapping(address => bool)) public isSelectedJuror;

    event CaseOpened(uint256 indexed caseId, uint256 indexed complaintId, address[] jurors, uint256 votingDeadline);
    event VoteCast(uint256 indexed caseId, address indexed juror, Verdict verdict);
    event CaseFinalized(
        uint256 indexed caseId,
        uint256 indexed complaintId,
        Verdict finalVerdict,
        uint256 upholdVotes,
        uint256 rejectVotes
    );
    event JuryParametersUpdated(uint256 jurySize, uint256 votingWindow, uint256 rewardAmount, uint256 slashAmount);
    event ReputationDeltasUpdated(int256 upholdDelta, int256 rejectDelta);

    modifier onlyComplaintRegistryOrOwner() {
        require(
            msg.sender == address(complaintRegistry) || msg.sender == owner(),
            "Caller not ComplaintRegistry or owner"
        );
        _;
    }

    constructor(
        address _userRegistry,
        address _complaintRegistry,
        address _reputationManager,
        uint256 _jurySize,
        uint256 _votingWindow,
        uint256 _jurorRewardAmount,
        uint256 _jurorSlashAmount,
        int256 _reputationUpholdDelta,
        int256 _reputationRejectDelta
    ) Ownable(msg.sender) {
        require(_userRegistry != address(0), "Invalid UserRegistry address");
        require(_reputationManager != address(0), "Invalid ReputationManager address");

        userRegistry = UserRegistry(payable(_userRegistry));
        complaintRegistry = ComplaintRegistry(_complaintRegistry);
        reputationManager = ReputationManager(_reputationManager);

        jurySize = _jurySize;
        votingWindow = _votingWindow;
        jurorRewardAmount = _jurorRewardAmount;
        jurorSlashAmount = _jurorSlashAmount;
        reputationUpholdDelta = _reputationUpholdDelta;
        reputationRejectDelta = _reputationRejectDelta;
    }

    function setComplaintRegistry(address _complaintRegistry) external onlyOwner {
        require(_complaintRegistry != address(0), "Invalid ComplaintRegistry address");
        complaintRegistry = ComplaintRegistry(_complaintRegistry);
    }

    function setJuryParameters(
        uint256 _jurySize,
        uint256 _votingWindow,
        uint256 _rewardAmount,
        uint256 _slashAmount
    ) external onlyOwner {
        require(_jurySize > 0, "Jury size must be > 0");
        require(_votingWindow > 0, "Voting window must be > 0");

        jurySize = _jurySize;
        votingWindow = _votingWindow;
        jurorRewardAmount = _rewardAmount;
        jurorSlashAmount = _slashAmount;

        emit JuryParametersUpdated(_jurySize, _votingWindow, _rewardAmount, _slashAmount);
    }

    function setReputationDeltas(int256 _upholdDelta, int256 _rejectDelta) external onlyOwner {
        reputationUpholdDelta = _upholdDelta;
        reputationRejectDelta = _rejectDelta;
        emit ReputationDeltasUpdated(_upholdDelta, _rejectDelta);
    }

    function openCase(uint256 _complaintId) external onlyComplaintRegistryOrOwner returns (uint256) {
        address[] memory pool = userRegistry.getJurorPool();
        require(pool.length > 0, "Juror pool is empty");

        uint256 selectedCount = pool.length < jurySize ? pool.length : jurySize;
        address[] memory selectedJurors = new address[](selectedCount);

        // Copy pool to temporary array for sampling without replacement
        address[] memory poolCopy = new address[](pool.length);
        for (uint256 i = 0; i < pool.length; i++) {
            poolCopy[i] = pool[i];
        }

        uint256 poolRemaining = pool.length;
        for (uint256 i = 0; i < selectedCount; i++) {
            // Pseudo-random selection based on block randomness (for student demo; in production Chainlink VRF is recommended)
            uint256 randomIndex = uint256(
                keccak256(abi.encodePacked(block.prevrandao, block.timestamp, _complaintId, i, poolRemaining))
            ) % poolRemaining;

            selectedJurors[i] = poolCopy[randomIndex];
            poolCopy[randomIndex] = poolCopy[poolRemaining - 1];
            poolRemaining--;
        }

        caseCount++;
        uint256 caseId = caseCount;

        cases[caseId].complaintId = _complaintId;
        cases[caseId].jurors = selectedJurors;
        cases[caseId].votingDeadline = block.timestamp + votingWindow;
        cases[caseId].finalized = false;
        cases[caseId].finalVerdict = Verdict.None;

        for (uint256 i = 0; i < selectedCount; i++) {
            isSelectedJuror[caseId][selectedJurors[i]] = true;
        }

        emit CaseOpened(caseId, _complaintId, selectedJurors, cases[caseId].votingDeadline);
        return caseId;
    }

    function castVote(uint256 _caseId, Verdict _verdict) external nonReentrant {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        CaseData storage currentCase = cases[_caseId];

        require(!currentCase.finalized, "Case already finalized");
        require(block.timestamp <= currentCase.votingDeadline, "Voting window expired");
        require(isSelectedJuror[_caseId][msg.sender], "Caller is not an assigned juror for this case");
        require(caseVotes[_caseId][msg.sender] == Verdict.None, "Juror has already voted");
        require(_verdict == Verdict.UpholdComplaint || _verdict == Verdict.RejectComplaint, "Invalid verdict");

        caseVotes[_caseId][msg.sender] = _verdict;

        if (_verdict == Verdict.UpholdComplaint) {
            currentCase.upholdVotes++;
        } else {
            currentCase.rejectVotes++;
        }

        emit VoteCast(_caseId, msg.sender, _verdict);

        // If all assigned jurors have voted, auto-finalize immediately
        if (currentCase.upholdVotes + currentCase.rejectVotes == currentCase.jurors.length) {
            _executeFinalization(_caseId);
        }
    }

    function finalizeCase(uint256 _caseId) external nonReentrant {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        CaseData storage currentCase = cases[_caseId];

        require(!currentCase.finalized, "Case already finalized");
        require(
            block.timestamp > currentCase.votingDeadline ||
                (currentCase.upholdVotes + currentCase.rejectVotes == currentCase.jurors.length),
            "Voting deadline not reached and votes pending"
        );

        _executeFinalization(_caseId);
    }

    function forceFinalize(uint256 _caseId, Verdict _forcedVerdict) external onlyOwner nonReentrant {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        CaseData storage currentCase = cases[_caseId];
        require(!currentCase.finalized, "Case already finalized");
        require(_forcedVerdict == Verdict.UpholdComplaint || _forcedVerdict == Verdict.RejectComplaint, "Invalid verdict");

        _executeFinalizationWithVerdict(_caseId, _forcedVerdict);
    }

    function _executeFinalization(uint256 _caseId) internal {
        CaseData storage currentCase = cases[_caseId];

        Verdict winningVerdict = currentCase.upholdVotes >= currentCase.rejectVotes
            ? Verdict.UpholdComplaint
            : Verdict.RejectComplaint;

        _executeFinalizationWithVerdict(_caseId, winningVerdict);
    }

    function _executeFinalizationWithVerdict(uint256 _caseId, Verdict _winningVerdict) internal {
        CaseData storage currentCase = cases[_caseId];
        currentCase.finalized = true;
        currentCase.finalVerdict = _winningVerdict;

        // Reward winning jurors and slash minority jurors
        for (uint256 i = 0; i < currentCase.jurors.length; i++) {
            address juror = currentCase.jurors[i];
            Verdict vote = caseVotes[_caseId][juror];

            if (vote == _winningVerdict) {
                if (jurorRewardAmount > 0) {
                    userRegistry.rewardJuror(juror, jurorRewardAmount);
                }
            } else if (vote != Verdict.None) {
                if (jurorSlashAmount > 0) {
                    userRegistry.slashJuror(juror, jurorSlashAmount);
                }
            }
        }

        // Fetch complaint details to get respondent
        ComplaintRegistry.Complaint memory complaint = complaintRegistry.getComplaint(currentCase.complaintId);

        bool verdictUpheld = (_winningVerdict == Verdict.UpholdComplaint);
        int256 reputationDelta = verdictUpheld ? reputationUpholdDelta : reputationRejectDelta;

        reputationManager.updateScore(complaint.respondent, reputationDelta);
        complaintRegistry.resolveComplaintFromDispute(currentCase.complaintId, verdictUpheld);

        emit CaseFinalized(
            _caseId,
            currentCase.complaintId,
            _winningVerdict,
            currentCase.upholdVotes,
            currentCase.rejectVotes
        );
    }

    function getCaseJurors(uint256 _caseId) external view returns (address[] memory) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        return cases[_caseId].jurors;
    }

    function getCaseVote(uint256 _caseId, address _juror) external view returns (Verdict) {
        return caseVotes[_caseId][_juror];
    }
}
