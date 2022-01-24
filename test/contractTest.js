const exchange = artifacts.require("Exchange");
const auxi = artifacts.require("Auxi");
const ERC20test = artifacts.require("ERC20test");
const Controller = artifacts.require("Controller");
const model = artifacts.require("ERC20CloneContract");
const factoryContract = artifacts.require("ERC20Factory");

const {
    deployProxy,
    upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const web3 = require("web3");
const truffleAssert = require('truffle-assertions');


contract('Exchange Test', (accounts) => {
    var controllerInstance;
    var testERC20;
    var sc1;
    var sc2;
    var sc3;
    let derivedAssetAddress1;
    let derivedAssetAddress2;
    let derivedAssetAddress3;
    var capxToken;

    // Deploying ERC20 token in test environment
    it('Deploying depending contracts', async () => {


        testERC20 = await ERC20test.new("TET", "TET", "18", "100000000000000000000000000");
        assert(testERC20.address !== '', "Contract was deployed");
        const exchangeInstance = await exchange.deployed();
        const auxiInstance = await auxi.deployed();
        assert(exchangeInstance.address !== '', "Contract was deployed");

        controllerInstance = await Controller.new();
        await console.log("Controller address : ", controllerInstance.address)

        let erc20model = await model.new();
        let erc20factory = await factoryContract.new(erc20model.address, controllerInstance.address);
        await controllerInstance.setFactory(erc20factory.address);
        assert(controllerInstance.address !== '', "Contract was deployed");


        sc1 = await ERC20test.new("USDC", "USDC", "6", "100000000000000000000000000");
        sc2 = await ERC20test.new("DAI", "DAI", "18", "100000000000000000000000000");
        sc3 = await ERC20test.new("USDT", "USDT", "18", "100000000000000000000000000");

        addressArray = [];
        statusArray = []
        addressArray.push(sc1.address);
        statusArray.push(true);
        addressArray.push(sc2.address);
        statusArray.push(true);
        addressArray.push(sc3.address);
        statusArray.push(true);
        await auxiInstance.kill();
        try {
            
            await auxiInstance.setStableCoinsStatus(addressArray, statusArray, {
                from: accounts[1]
            });
        } catch (error) {
            assert(error.message.includes("Ownable: caller is not the owner"));
        }
        try {
            
            await auxiInstance.setStableCoinsStatus(addressArray, statusArray);
        } catch (error) {
            assert(error.message.includes("FailSafeMode: ACTIVE"));
        }
        await auxiInstance.revive();
        await auxiInstance.setStableCoinsStatus(addressArray, statusArray);
        
        
        await auxiInstance.kill();



    });

    it('Vesting tokens for the first time', async () => {

        var a1 = []
        var a2 = []
        var a3 = []
        var a4 = []
        const erc20 = testERC20;
        await erc20.approve(controllerInstance.address, "40000000000000000000", {
            from: accounts[0]
        });
        let kp = 1666698326 //  25 October 2022
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        kp += 86400
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        kp += 86400
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)

        await controllerInstance.createBulkDerivative("name", "QmVcrjMQVhdCEnmCs78x4MaiLSBgnvygaXLT5nH9YFsvi7", erc20.address, "40000000000000000000", a1, a2, a3, a4, {
            from: accounts[0]
        });

    });

    it('Vesting tokens for the second time', async () => {

        var a1 = []
        var a2 = []
        var a3 = []
        var a4 = []
        const erc20 = testERC20;
        await erc20.approve(controllerInstance.address, "40000000000000000000", {
            from: accounts[0]
        });
        let kp = 1666698326 //  25 October 2022
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        kp += 86400
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)
        kp += 86400
        await a1.push(accounts[0]);
        await a2.push(kp.toString());
        await a3.push("10000000000000000000")
        await a4.push(true)

        await controllerInstance.createBulkDerivative("name", "QmVcrjMQVhdCEnmCs78x4MaiLSBgnvygaXLT5nH9YFsvi7", erc20.address, "40000000000000000000", a1, a2, a3, a4, {
            from: accounts[0]
        });

        derivedAssetAddress1 = await controllerInstance.derivativeIDtoAddress("1").then(function(response) {
            return (response.toString(10))
        })
        derivedAssetAddress2 = await controllerInstance.derivativeIDtoAddress("2").then(function(response) {
            return (response.toString(10))
        })
        derivedAssetAddress3 = await controllerInstance.derivativeIDtoAddress("3").then(function(response) {
            return (response.toString(10))
        })



    });

    it('Deposit Stable Tokens', async () => {

        const exchangeInstance = await exchange.deployed();
        let erc20 = sc1;
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });

        await exchangeInstance.kill();


        try {

            await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
                from: accounts[0]
            });
        } catch (error) {
            assert(error.message.includes("FailSafeMode: ACTIVE"));
        }
        await exchangeInstance.revive();

        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });

        erc20 = sc2;
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });
        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });

        erc20 = sc3;
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });
        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });


    });

    it('Deposit Derivative Tokens', async () => {

        const exchangeInstance = await exchange.deployed();
        let erc20 = await ERC20test.at(derivedAssetAddress1);
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });
        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });

        erc20 = await ERC20test.at(derivedAssetAddress2);
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });
        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });

        erc20 = await ERC20test.at(derivedAssetAddress3);
        await erc20.approve(exchangeInstance.address, "10000000000000000000", {
            from: accounts[0]
        });

        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "0")
        });
        await exchangeInstance.depositToken(erc20.address, "10000000000000000000", {
            from: accounts[0]
        });
        await erc20.balanceOf(exchangeInstance.address).then(function(response) {
            assert(response.toString(10) === "10000000000000000000")
        });

    });



    it('Create order - both derivatives', async () => {
        const exchangeInstance = await exchange.deployed();

        try {

            await exchangeInstance.createOrder(derivedAssetAddress1, "25", derivedAssetAddress2, "50", "1665949656", true)
        } catch (error) {
            await assert(error.message.includes("Only stable with another token"))
        }

    });

    // it('Create order - both stable', async () => {
    //     const exchangeInstance = await exchange.deployed();

    //     try {
    //         await exchangeInstance.createOrder(sc1.address, "25", sc2.address, "50", "1665949656", "1")
    //     } catch (error) {
    //         await assert(error.message.includes("Only stable with another token"))
    //     }
    // });


    it('Create order 1', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);

        await exchangeInstance.createOrder(erc20_1.address, "2000000000000000000", erc20_2.address, "1000000000000000000", "1665949656", true)

        // await exchangeInstance.adminBalance(erc20_1.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })

    });

    it('Create order 2', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = await ERC20test.at(derivedAssetAddress2);
        const erc20_2 = sc2

        await exchangeInstance.createOrder(erc20_1.address, "2000000000000000000", erc20_2.address, "1000000000000000000", "1665949656", true)
        // await exchangeInstance.adminBalance(erc20_2.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })
    });

    it('Create order with unknown token', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = testERC20;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);
        try {

            await exchangeInstance.createOrder(erc20_1.address, "25", erc20_2.address, "50", "1665949656", true)
        } catch (error) {
            await assert(error.message.includes("Only stable with another token"))
        }

    });

    // it('Create order with unknown token', async () => {
    //     const exchangeInstance = await exchange.deployed();
    //     const erc20_1 = sc1;
    //     const erc20_2 = testERC20;
    //     try {
    //         await exchangeInstance.createOrder(erc20_1.address, "25", erc20_2.address, "50", "1665949656", "1")
    //     } catch (error) {
    //         await assert(error.message.includes("Only stable with another token"))
    //     }
    // });

    it('Cannot fill own orders', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);
        try {

            await exchangeInstance.fulFillOrder("1", "51", {
                from: accounts[0]
            });
        } catch (error) {
            await assert(error.message.includes("Invalid Input"));
        }

    });

    it('Cannot overfill', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);
        try {
            await exchangeInstance.fulFillOrder("1", "1000000000000000001", {
                from: accounts[1]
            });
        } catch (error) {
            await assert(error.message.includes("Invalid Input"));
        }
    });

    it('Full fill order 1 partial', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);
        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "0")
        })

        // await console.log(erc20_2.address);
        await erc20_2.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "30000000000000000000")
        })


        await erc20_2.transfer(accounts[1], "1000000000000000000");
        await erc20_2.approve(exchangeInstance.address, "1000000000000000000", {
            from: accounts[1]
        });

        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "1000000000000000000");
        })
        // await console.log(erc20_2.address);
        await erc20_2.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "29000000000000000000");
        })

        await exchangeInstance.unlockBalance(erc20_2.address, accounts[1]).then((response) => {
            assert(response.toString(10) == "0");
        })
        await erc20_1.transfer(accounts[1], "2000000000000000000");
        await erc20_1.approve(exchangeInstance.address, "2000000000000000000", {
            from: accounts[1]
        });

        await erc20_1.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "2000000000000000000");
        })
        try {
            await exchangeInstance.fulFillOrder("1", "500000000000000000", {
                from: accounts[1]
            });
        } catch (error) {
            assert(response.toString(10) == "0");
        }
        // await exchangeInstance.adminBalance(erc20_1.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })


    });



    it('Full fill order 1 full', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);
        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "500000000000000000")
        })
        await exchangeInstance.depositToken(erc20_2.address, "500000000000000000", {
            from: accounts[1]
        });
        await erc20_2.approve(exchangeInstance.address, "0", {
            from: accounts[1]
        });
        try {
            await exchangeInstance.fulFillOrder("1", "500000000000000000", {
                from: accounts[1]
            });
        } catch (error) {
            await console.log(error.message);
        }
        // await exchangeInstance.adminBalance(sc1.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })
    });



    it('Full fill order 2 partial', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_2 = sc2;
        const erc20_1 = await ERC20test.at(derivedAssetAddress1);
        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "0")
        })
        // await console.log(erc20_2.address);
        await erc20_2.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "99999990000000000000000000")
        })
        await erc20_2.transfer(accounts[1], "1000000000000000000");
        await erc20_2.approve(exchangeInstance.address, "1000000000000000000", {
            from: accounts[1]
        });
        try {
            await exchangeInstance.fulFillOrder("2", "500000000000000000", {
                from: accounts[1]
            });
        } catch (error) {
            await console.log(error.message);
        }
        await exchangeInstance.unlockBalance(erc20_2.address, accounts[1]).then((response) => {
            assert(response.toString(10) == "0")
        })
    });

    it('Cancel order 2 partial', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_2 = sc2;
        const erc20_1 = await ERC20test.at(derivedAssetAddress1);
        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "500000000000000000")
        })
        // await console.log(erc20_2.address);
        await erc20_2.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "99999989000000000000000000")
        })

        try {
            await exchangeInstance.cancelOrder(["2"], {
                from: accounts[0]
            });
        } catch (error) {
            await console.log(error.message);
        }
    });

    it("Withdrawing admin tokens", async () => {
        const exchangeInstance = await exchange.deployed();
        // await exchangeInstance.adminBalance(sc1.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })
        await sc1.balanceOf(exchangeInstance.address).then((response) => {
            assert(response.toString(10) == "10000000000000000000")
        })
        const auxiInstance = await auxi.deployed();
        const auxBal = await sc1.balanceOf(auxi.address).then((response)=>{
            return(response.toString(10))
        })
        try {
            
            await auxiInstance.withdrawFees(sc1.address,auxBal);
        } catch (error) {
            await assert(error.message.includes("Invalid Input"))
        }
        // await exchangeInstance.adminBalance(sc1.address).then((response) => {
        //     assert(response.toString(10) == "0")
        // })
        await sc1.balanceOf(exchangeInstance.address).then((response) => {
            assert(response.toString(10) == "10000000000000000000")
        })


    });


    it('Withdraw Tokens', async () => {

        const exchangeInstance = await exchange.deployed();

        let erc20 = sc1;

        await exchangeInstance.unlockBalance(erc20.address, accounts[0]).then((response) => {
            assert(response.toString(10) == "8000000000000000000");
        })
        await erc20.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "99999988000000000000000000");
        })
        await exchangeInstance.withdrawToken(erc20.address, "1000000000000000000");

        await exchangeInstance.unlockBalance(erc20.address, accounts[0]).then((response) => {
            assert(response.toString(10) == "7000000000000000000");
        })

        await erc20.balanceOf(accounts[0]).then((response) => {
            assert(response.toString(10) == "99999989000000000000000000");
        })

    });


    it('Deploying CAPX Token', async () => {


        capxToken = await ERC20test.new("CAPX", "CAPX", "18", "100000000000000000000000000");
        assert(capxToken.address !== '', "Contract was deployed");

        const auxiInstance = await auxi.deployed();
        assert(auxiInstance.address !== '', "Contract was deployed");

        await auxiInstance.revive();
        await auxiInstance.setCapxToken(capxToken.address);
        await auxiInstance.kill();



    });


    it('Create order and fulfill with trade fee', async () => {
        const exchangeInstance = await exchange.deployed();
        const erc20_1 = sc1;
        const erc20_2 = await ERC20test.at(derivedAssetAddress1);

        await erc20_1.approve(exchangeInstance.address, "1000000000000000000");

        await exchangeInstance.createOrder(erc20_1.address, "8000000000000000000", erc20_2.address, "1000000000000000000", "1665949656", true)

        await erc20_2.transfer(accounts[1], "1000000000000000000");
        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "1000000000000000000");
        })
        await erc20_2.approve(exchangeInstance.address, "1000000000000000000", {
            from: accounts[1]
        })

        await exchangeInstance.depositToken(erc20_2.address, "1000000000000000000", {
            from: accounts[1]
        })

        await erc20_2.balanceOf(accounts[1]).then((response) => {
            assert(response.toString(10) == "0");
        })

        feeArray = ["500", "300", "400", "1000", "200", "300", "5000", "125", "200", "10000", "75", "125", "30", "75"];
        const auxiInstance = await auxi.deployed();
        await auxiInstance.revive();
        await auxiInstance.setTradingFeeArray(feeArray);
        await auxiInstance.kill();

        await exchangeInstance.unlockBalance(erc20_1.address, accounts[1]).then((response) => {
            assert(response.toString(10) == "2000000000000000000");
        })


        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", true).then((response) => {
            assert(response.toString(10) == "3000000000000000");
        })
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", false).then((response) => {
            assert(response.toString(10) == "4000000000000000");
        })

        await exchangeInstance.fulFillOrder("3", "100000000000000000", {
            from: accounts[1]
        });
        await capxToken.transfer(accounts[1], "500000000000000000000");

        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", true).then((response) => {
            assert(response.toString(10) == "2000000000000000");
        })
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", false).then((response) => {
            assert(response.toString(10) == "3000000000000000");
        })

        await exchangeInstance.fulFillOrder("3", "100000000000000000", {
            from: accounts[1]
        });
        await capxToken.transfer(accounts[1], "500000000000000000000");
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", true).then((response) => {
            assert(response.toString(10) == "1250000000000000");
        })
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", false).then((response) => {
            assert(response.toString(10) == "2000000000000000");
        })

        await exchangeInstance.fulFillOrder("3", "100000000000000000", {
            from: accounts[1]
        });
        await capxToken.transfer(accounts[1], "4000000000000000000000");
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", true).then((response) => {
            assert(response.toString(10) == "750000000000000");
        })
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", false).then((response) => {
            assert(response.toString(10) == "1250000000000000");
        })

        await exchangeInstance.fulFillOrder("3", "100000000000000000", {
            from: accounts[1]
        });
        await capxToken.transfer(accounts[1], "6000000000000000000000");
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", true).then((response) => {
            assert(response.toString(10) == "300000000000000");
        })
        await auxiInstance.tradeFeeCalculation(accounts[1], "1000000000000000000", false).then((response) => {
            assert(response.toString(10) == "750000000000000");
        })
        await exchangeInstance.fulFillOrder("3", "100000000000000000", {
            from: accounts[1]
        });

    });




});