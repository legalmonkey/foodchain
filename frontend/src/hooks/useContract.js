import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../config';

// Contract minimal ABIs for client-side interactions
const USER_REGISTRY_ABI = [
  'function registerUser(uint8 _role) external',
  'function becomeJuror() external payable',
  'function exitJuror() external',
  'function getRole(address _user) external view returns (uint8)',
  'function isJuror(address _user) external view returns (bool)',
  'function getJurorStake(address _user) external view returns (uint256)',
  'function getJurorPoolLength() external view returns (uint256)',
  'function minJurorStake() external view returns (uint256)',
];

const ORDER_REGISTRY_ABI = [
  'function computeOrderKey(string calldata offChainOrderId) public pure returns (bytes32)',
  'function getOrder(bytes32 orderKey) external view returns (tuple(string offChainOrderId, address customer, address restaurant, address deliveryPartner, uint256 deliveredTimestamp, bool exists))',
];

const COMPLAINT_REGISTRY_ABI = [
  'function fileComplaint(bytes32 orderKey, address respondent, uint8 category, string calldata evidenceCID) external returns (uint256)',
  'function respondentAccepts(uint256 complaintId) external',
  'function respondentContests(uint256 complaintId) external returns (uint256)',
  'function getComplaint(uint256 complaintId) external view returns (tuple(bytes32 orderKey, address filer, address respondent, uint8 category, string evidenceCID, uint8 status, uint256 filedAt, bool verdictUpheld, uint256 resolvedAt))',
  'function complaintCount() external view returns (uint256)',
];

const DISPUTE_RESOLUTION_ABI = [
  'function castVote(uint256 _caseId, uint8 _verdict) external',
  'function finalizeCase(uint256 _caseId) external',
  'function forceFinalize(uint256 _caseId, uint8 _forcedVerdict) external',
  'function isSelectedJuror(uint256 caseId, address juror) external view returns (bool)',
  'function getCaseVote(uint256 _caseId, address _juror) external view returns (uint8)',
  'function getCaseJurors(uint256 _caseId) external view returns (address[])',
  'function cases(uint256 caseId) external view returns (uint256 complaintId, uint256 upholdVotes, uint256 rejectVotes, uint256 votingDeadline, bool finalized, uint8 finalVerdict)',
];

const REPUTATION_MANAGER_ABI = [
  'function getScore(address subject) public view returns (uint256)',
];

export const useContract = (contractName, withSigner = true) => {
  const { provider, signer } = useWeb3();

  return useMemo(() => {
    const address = CONTRACT_ADDRESSES[contractName];
    if (!address || !ethers.isAddress(address)) return null;

    let abi = [];
    if (contractName === 'UserRegistry') abi = USER_REGISTRY_ABI;
    else if (contractName === 'OrderRegistry') abi = ORDER_REGISTRY_ABI;
    else if (contractName === 'ComplaintRegistry') abi = COMPLAINT_REGISTRY_ABI;
    else if (contractName === 'DisputeResolution') abi = DISPUTE_RESOLUTION_ABI;
    else if (contractName === 'ReputationManager') abi = REPUTATION_MANAGER_ABI;

    const runner = withSigner && signer ? signer : provider;
    if (!runner) return null;

    return new ethers.Contract(address, abi, runner);
  }, [contractName, withSigner, signer, provider]);
};
