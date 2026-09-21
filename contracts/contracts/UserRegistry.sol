// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UserRegistry
 * @dev Manages user roles (Customer, Restaurant, DeliveryPartner) and juror staking pool.
 */
contract UserRegistry is Ownable, ReentrancyGuard {
    enum Role { None, Customer, Restaurant, DeliveryPartner }

    struct UserProfile {
        Role role;
        bool isJuror;
        uint256 jurorStake;
        bool isVerified;
    }

    mapping(address => UserProfile) public profiles;
    address[] public jurorPool;
    mapping(address => uint256) internal jurorPoolIndex; // 1-based index in jurorPool

    uint256 public minJurorStake;
    mapping(address => bool) public authorizedCallers; // e.g. DisputeResolution contract

    event UserRegistered(address indexed user, Role role);
    event JurorJoined(address indexed juror, uint256 stake);
    event JurorExited(address indexed juror, uint256 refundAmount);
    event JurorSlashed(address indexed juror, uint256 slashAmount, uint256 remainingStake);
    event JurorRewarded(address indexed juror, uint256 rewardAmount, uint256 totalStake);
    event MinJurorStakeUpdated(uint256 oldStake, uint256 newStake);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(uint256 _minJurorStake) Ownable(msg.sender) {
        minJurorStake = _minJurorStake;
    }

    function setMinJurorStake(uint256 _newStake) external onlyOwner {
        emit MinJurorStakeUpdated(minJurorStake, _newStake);
        minJurorStake = _newStake;
    }

    function setAuthorizedCaller(address _caller, bool _authorized) external onlyOwner {
        require(_caller != address(0), "Invalid caller address");
        authorizedCallers[_caller] = _authorized;
        emit AuthorizedCallerUpdated(_caller, _authorized);
    }

    function registerUser(Role _role) external {
        require(_role != Role.None, "Invalid role");
        require(profiles[msg.sender].role == Role.None, "User already registered");

        profiles[msg.sender].role = _role;
        profiles[msg.sender].isVerified = true;

        emit UserRegistered(msg.sender, _role);
    }

    function becomeJuror() external payable nonReentrant {
        require(msg.value >= minJurorStake, "Stake below minimum");

        UserProfile storage profile = profiles[msg.sender];
        profile.jurorStake += msg.value;

        if (!profile.isJuror) {
            profile.isJuror = true;
            jurorPool.push(msg.sender);
            jurorPoolIndex[msg.sender] = jurorPool.length;
        }

        emit JurorJoined(msg.sender, profile.jurorStake);
    }

    function exitJuror() external nonReentrant {
        UserProfile storage profile = profiles[msg.sender];
        require(profile.isJuror, "Not an active juror");
        require(profile.jurorStake > 0, "No stake to withdraw");

        uint256 refundAmount = profile.jurorStake;
        profile.jurorStake = 0;
        profile.isJuror = false;

        _removeJurorFromPool(msg.sender);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Withdrawal failed");

        emit JurorExited(msg.sender, refundAmount);
    }

    function slashJuror(address _juror, uint256 _amount) external onlyAuthorized nonReentrant returns (uint256) {
        UserProfile storage profile = profiles[_juror];
        require(profile.isJuror, "User is not a juror");

        uint256 actualSlash = _amount > profile.jurorStake ? profile.jurorStake : _amount;
        profile.jurorStake -= actualSlash;

        if (profile.jurorStake < minJurorStake) {
            profile.isJuror = false;
            _removeJurorFromPool(_juror);
        }

        emit JurorSlashed(_juror, actualSlash, profile.jurorStake);
        return actualSlash;
    }

    function rewardJuror(address _juror, uint256 _amount) external onlyAuthorized nonReentrant {
        UserProfile storage profile = profiles[_juror];
        require(profile.isJuror, "User is not a juror");

        profile.jurorStake += _amount;
        emit JurorRewarded(_juror, _amount, profile.jurorStake);
    }

    function _removeJurorFromPool(address _juror) internal {
        uint256 index = jurorPoolIndex[_juror];
        if (index == 0) return;

        uint256 lastIndex = jurorPool.length;
        if (index != lastIndex) {
            address lastJuror = jurorPool[lastIndex - 1];
            jurorPool[index - 1] = lastJuror;
            jurorPoolIndex[lastJuror] = index;
        }

        jurorPool.pop();
        delete jurorPoolIndex[_juror];
    }

    function getRole(address _user) external view returns (Role) {
        return profiles[_user].role;
    }

    function isJuror(address _user) external view returns (bool) {
        return profiles[_user].isJuror;
    }

    function getJurorStake(address _user) external view returns (uint256) {
        return profiles[_user].jurorStake;
    }

    function getJurorPool() external view returns (address[] memory) {
        return jurorPool;
    }

    function getJurorPoolLength() external view returns (uint256) {
        return jurorPool.length;
    }

    receive() external payable {}
}
