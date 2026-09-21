// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OrderRegistry
 * @dev Lightweight on-chain anchor connecting off-chain MongoDB orders to participants and delivery state.
 */
contract OrderRegistry is Ownable {
    struct OrderRef {
        string offChainOrderId;
        address customer;
        address restaurant;
        address deliveryPartner;
        uint256 deliveredTimestamp;
        bool exists;
    }

    mapping(bytes32 => OrderRef) public orders;
    address public backendRelayer;

    event BackendRelayerUpdated(address indexed previousRelayer, address indexed newRelayer);
    event OrderCreated(bytes32 indexed orderKey, string offChainOrderId, address indexed customer, address indexed restaurant);
    event DeliveryPartnerAssigned(bytes32 indexed orderKey, address indexed deliveryPartner);
    event OrderDelivered(bytes32 indexed orderKey, uint256 deliveredTimestamp);

    modifier onlyBackend() {
        require(msg.sender == backendRelayer || msg.sender == owner(), "Caller is not backend relayer");
        _;
    }

    constructor(address _backendRelayer) Ownable(msg.sender) {
        backendRelayer = _backendRelayer;
        emit BackendRelayerUpdated(address(0), _backendRelayer);
    }

    function setBackendRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Invalid relayer address");
        emit BackendRelayerUpdated(backendRelayer, _newRelayer);
        backendRelayer = _newRelayer;
    }

    function computeOrderKey(string calldata offChainOrderId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(offChainOrderId));
    }

    function createOrderRef(
        string calldata offChainOrderId,
        address customer,
        address restaurant
    ) external onlyBackend returns (bytes32) {
        require(customer != address(0), "Invalid customer address");
        require(restaurant != address(0), "Invalid restaurant address");

        bytes32 orderKey = computeOrderKey(offChainOrderId);
        require(!orders[orderKey].exists, "Order already exists");

        orders[orderKey] = OrderRef({
            offChainOrderId: offChainOrderId,
            customer: customer,
            restaurant: restaurant,
            deliveryPartner: address(0),
            deliveredTimestamp: 0,
            exists: true
        });

        emit OrderCreated(orderKey, offChainOrderId, customer, restaurant);
        return orderKey;
    }

    function assignDeliveryPartner(bytes32 orderKey, address partner) external onlyBackend {
        require(orders[orderKey].exists, "Order does not exist");
        require(partner != address(0), "Invalid delivery partner");

        orders[orderKey].deliveryPartner = partner;
        emit DeliveryPartnerAssigned(orderKey, partner);
    }

    function markDelivered(bytes32 orderKey) external onlyBackend {
        require(orders[orderKey].exists, "Order does not exist");
        require(orders[orderKey].deliveredTimestamp == 0, "Already marked delivered");

        orders[orderKey].deliveredTimestamp = block.timestamp;
        emit OrderDelivered(orderKey, block.timestamp);
    }

    function getOrder(bytes32 orderKey) external view returns (OrderRef memory) {
        require(orders[orderKey].exists, "Order does not exist");
        return orders[orderKey];
    }
}
