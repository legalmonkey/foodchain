const fs = require('fs');
const path = require('path');

const contractNames = [
  'UserRegistry',
  'OrderRegistry',
  'ReputationManager',
  'ComplaintRegistry',
  'DisputeResolution',
];

const deployedDir = path.resolve(__dirname, '../deployed');
const abisDir = path.resolve(deployedDir, 'abis');
const backendContractsDir = path.resolve(__dirname, '../../backend/src/contracts');
const frontendContractsDir = path.resolve(__dirname, '../../frontend/src/contracts');

[deployedDir, abisDir, backendContractsDir, frontendContractsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

for (const name of contractNames) {
  const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    const minimal = {
      contractName: artifact.contractName,
      abi: artifact.abi,
    };

    fs.writeFileSync(path.resolve(abisDir, `${name}.json`), JSON.stringify(minimal, null, 2));
    fs.writeFileSync(path.resolve(backendContractsDir, `${name}.json`), JSON.stringify(minimal, null, 2));
    fs.writeFileSync(path.resolve(frontendContractsDir, `${name}.json`), JSON.stringify(minimal, null, 2));
    console.log(`✓ Exported ABI for ${name}`);
  }
}

// Generate default addresses template if not exists
const addressesPath = path.resolve(deployedDir, 'contractAddresses.json');
if (!fs.existsSync(addressesPath)) {
  const defaultAddresses = {
    network: 'amoy',
    chainId: 80002,
    deployedAt: new Date().toISOString(),
    addresses: {
      UserRegistry: '0x0000000000000000000000000000000000000000',
      OrderRegistry: '0x0000000000000000000000000000000000000000',
      ReputationManager: '0x0000000000000000000000000000000000000000',
      ComplaintRegistry: '0x0000000000000000000000000000000000000000',
      DisputeResolution: '0x0000000000000000000000000000000000000000',
    },
  };
  fs.writeFileSync(addressesPath, JSON.stringify(defaultAddresses, null, 2));
  fs.writeFileSync(path.resolve(backendContractsDir, 'contractAddresses.json'), JSON.stringify(defaultAddresses, null, 2));
  fs.writeFileSync(path.resolve(frontendContractsDir, 'contractAddresses.json'), JSON.stringify(defaultAddresses, null, 2));
  console.log('✓ Exported contractAddresses.json template');
}
