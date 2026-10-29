import { ethers } from 'ethers';

/**
 * Returns safe gas overrides for Polygon Amoy (chainId 80002) and EVM testnets.
 * Polygon Amoy validator nodes strictly enforce min maxPriorityFeePerGas >= 25 Gwei (25,000,000,000).
 * MetaMask defaults to 1.5 Gwei unless explicitly overridden.
 */
export async function getAmoyGasOverrides(provider) {
  try {
    let feeData = null;
    if (provider && typeof provider.getFeeData === 'function') {
      try {
        feeData = await provider.getFeeData();
      } catch (e) {}
    }

    // Setting 35 Gwei tip cap guarantees passing the Amoy 25 Gwei minimum validator threshold
    const minTip = ethers.parseUnits('35', 'gwei');
    const priorityFee =
      feeData?.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minTip
        ? feeData.maxPriorityFeePerGas
        : minTip;

    let maxFee = feeData?.maxFeePerGas
      ? (feeData.maxFeePerGas * 150n) / 100n
      : ethers.parseUnits('55', 'gwei');

    if (maxFee < priorityFee + ethers.parseUnits('15', 'gwei')) {
      maxFee = priorityFee + ethers.parseUnits('20', 'gwei');
    }

    return {
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: maxFee,
    };
  } catch (err) {
    return {
      maxPriorityFeePerGas: ethers.parseUnits('35', 'gwei'),
      maxFeePerGas: ethers.parseUnits('55', 'gwei'),
    };
  }
}
