Exchange Contract 
======================
The `Auxi` contract is the contract that the governance will control so that critical functions like fee calculations. 

Constants
-------------

* `uint256 private constant _INACTIVE`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Signifies the state of a function being in-active.

* `uint256 private constant _ACTIVE`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Signifies the state of a function being active.


Variables
-------------

* `uint256 internal _locked`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Determines the state of the function.

* `uint256 internal _killed`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Determines the active state of the contract.

* `uint256[] public tradeArray`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the details according to which trade fee is to be calculated.

* `address public capxTokenAddress`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the capx token address.

* `address public exchangeContract`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the address of capx exchange contract.

* `uint8 public decimalCapx`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Number of decimals does capx token can have.

* `mapping(address => bool) public whiteListTokens`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Mapping of the stable coins whitelisted for trade.

* `mapping (address=>uint256) public adminFee`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Mapping of the Admin fee in the contract till now.


Events
-------------

```solidity
event StableStatus(address stableCoin, bool status);
```
Event emitted when an order is created.
* `stableCoin` - Stable coin status which is to be updated.
* `status` - Latest status of the `stableCoin`.

Modifiers 
-----------------

```solidity
  modifier noReentrant() {
      require(_locked != _ACTIVE, "ReentrancyGuard: Re-Entrant call");
      _locked = _ACTIVE;
      _;
      _locked = _INACTIVE;
    }
```
Prevents a contract from calling itself, directly or indirectly. i.e. prevents reentrant calls to a function.

Functions 
-----------------

### Initializer

```solidity
function initialize() public 
  initializer
```
While deploying, `deployProxy` internally calls this initializer for the exchange contract. This function sets `_killed` to `_INACTIVE` and sets the `tradeArray` to 14 length long 0 value array.

### isKilled

```solidity
function isKilled() internal view
```
*Internal function*.  
Used to stop execution of `setTradingFeeArray`, `setStableCoinsStatus`, `setCapxToken` and `setExchangeContract` during the kill phase.

### kill

```solidity
function kill() external onlyOwner 
```
*External function can only be accessed by owner*.  
This function can be used by the owner to start the kill phase.

### revive

```solidity
function revive() external onlyOwner 
```
*External function can only be accessed by owner*.   
This function can be used by the owner to stop the kill phase.

### _authorizeUpgrade

```solidity
  function _authorizeUpgrade(
    address _newImplementation
    ) internal 
    override 
    onlyOwner
```
Function responsible to internally update the smart contract, ideally it should revert when msg.sender is not authorized to upgrade the contract.

### setTradingFeeArray

```solidity
  function setTradingFeeArray(uint256[] memory _tradeFeeArray)
        external
        virtual
        onlyOwner
```
*External function only used by owner to set the trading fee*

Inputs required
* `_tradeFeeArray` - Array with trade fee percentages

Input Validation
* `_tradeFeeArray` should be of length 14

Functionality  
* Sets new trade Fee

### setExchangeContract

```
function setExchangeContract(address _exchangeContract) external virtual onlyOwner 
```
*External function only used by owner to set the exchange contract address*

Inputs required
* `_exchangeContract` - Address of exchange contract

Input Validation
* `_exchangeContract` should not be 0 address

Functionality  
* Sets new exchange Contract address

### setStableCoinsStatus

```solidity
  function setStableCoinsStatus(
        address[] memory _stableCoins,
        bool[] memory _status
    ) public virtual onlyOwner
```
*External function for owner to determine if the contract will accept a specific token as stable coin or not*

Inputs required
* `_stableCoins` - Array of Addresses of the token to be updated
* `_status` - Array with booleans determining the status of stable coins

Input Validation
* `_stableCoins` should not be of zero length
* `_stableCoins` and `_status` array length should be same
* `_stableCoins` length should be less than or equal to 10

Functionality  
* Updates the state of whitelisting of specific `_stableCoins` which can be used in exchange

### setCapxToken

```solidity
function setCapxToken(address _capx) public virtual noReentrant onlyOwner 
```
*External function for owners to set the address of capx token*

Inputs required
* `_capx` - Address of capx token

Input Validation
* `_capx` should not be a zero address

Functionality  
* Assigns the capx token

### tradeFeeCalculation

```solidity
function tradeFeeCalculation(
        address _userAddress,
        uint256 _amount,
        bool _maker
    ) external view virtual returns (uint256) 
```
*External view function can be used by anyone and it used by exchange contract to determine the trade Fee for specific user with specific amount*

Inputs required
* `_userAddress` - User address for whom tradeFee is to be calculated
* `_amount` - Amount of tokens on which trade fee is to be calculated
* `_maker` - Boolean determining if it is maker or taker

Functionality   
* Calculates and returns the trade fee amount

### adminFeeReceiver

```solidity
function adminFeeReceiver(address _stableCoin, uint256 _amount) external virtual noReentrant 
```
*External function used by exchange contract to submit fee to auxi contract*

Inputs required
* `_stableCoin` - Address of the token fee is being submitted in
* `_amount` - Amount of tokens being submitted as fee

Functionality   
* Takes the admin fee from the exchange contract

### withdrawFees

```solidity
function withdrawFees(address _stableCoin, uint256 _amount) external virtual noReentrant onlyOwner 
```

*External function used by owner address to withdraw fees*

Inputs required
* `_stableCoin` - The stable coin used to withdraw fee
* `_amount` - Amount of `stableCoin` being withdrawn

Functionality   
* Takes the admin fee from the exchange contract