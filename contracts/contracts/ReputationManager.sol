// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationManager
 * @dev Manages on-chain reputation scores (0-100) for restaurants and delivery partners.
 */
contract ReputationManager is Ownable {
    uint256 public defaultInitialScore;
    uint256 public constant MAX_SCORE = 100;

    mapping(address => uint256) public scores;
    mapping(address => bool) public hasCustomScore;
    mapping(address => bool) public authorizedCallers;

    event ReputationUpdated(address indexed subject, uint256 oldScore, uint256 newScore, int256 delta);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    event DefaultInitialScoreUpdated(uint256 oldDefault, uint256 newDefault);

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Caller not authorized to update reputation");
        _;
    }

    constructor(uint256 _defaultInitialScore) Ownable(msg.sender) {
        require(_defaultInitialScore <= MAX_SCORE, "Initial score exceeds max");
        defaultInitialScore = _defaultInitialScore;
    }

    function setDefaultInitialScore(uint256 _newDefault) external onlyOwner {
        require(_newDefault <= MAX_SCORE, "Default score exceeds max");
        emit DefaultInitialScoreUpdated(defaultInitialScore, _newDefault);
        defaultInitialScore = _newDefault;
    }

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        require(caller != address(0), "Invalid caller address");
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }

    function getScore(address subject) public view returns (uint256) {
        if (!hasCustomScore[subject]) {
            return defaultInitialScore;
        }
        return scores[subject];
    }

    function updateScore(address subject, int256 delta) external onlyAuthorized returns (uint256) {
        require(subject != address(0), "Invalid subject address");

        uint256 currentScore = getScore(subject);
        int256 targetScore = int256(currentScore) + delta;
        uint256 newScore;

        if (targetScore < 0) {
            newScore = 0;
        } else if (targetScore > int256(MAX_SCORE)) {
            newScore = MAX_SCORE;
        } else {
            newScore = uint256(targetScore);
        }

        scores[subject] = newScore;
        hasCustomScore[subject] = true;

        emit ReputationUpdated(subject, currentScore, newScore, delta);
        return newScore;
    }
}
