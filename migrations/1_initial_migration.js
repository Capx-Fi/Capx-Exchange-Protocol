const auxi = artifacts.require("Auxi");
const exchange = artifacts.require("Exchange");

const { deployProxy } = require("@openzeppelin/truffle-upgrades");

module.exports =  async(deployer) => {
  const accounts = await web3.eth.getAccounts();

    await console.log("Deploying Auxi");

    let auxiInstance = await deployProxy(auxi, [], { kind: 'uups' });
    
    await console.log("Auxi Address " + auxiInstance.address);

    await console.log("Deploying Exchange");

    let exchangeInstance = await deployProxy(exchange, [auxiInstance.address], { kind: 'uups' });
    
    await console.log("Exchange Address " + exchangeInstance.address);
    
    await console.log("Setting exchange address ");
    
    await auxiInstance.setExchangeContract(exchangeInstance.address);

    await console.log("Exchange address set to auxi");
  };