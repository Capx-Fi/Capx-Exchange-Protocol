Exchange Contract 
======================
The `Exchange` contract is the contract that the user will interact with. The exchange contract has the following tasks. 
*  Hold ERC20 tokens locked in existing orders.
*  Deposit ERC20 tokens as unlock balance
*  Create order for the order book.
*  Fulfills order in the order book.
*  Cancel existing orders in the order book.
*  Clear out the expired orders and unlock the balance locked for that order.
*  Call Auxi contract to calculate the trade Fee
*  Submits trade fee to Auxi contract


Constants
-------------

* `uint256 private constant _INACTIVE`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Signifies the state of a function being in-active.

* `uint256 private constant _ACTIVE`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Signifies the state of a function being active.

Structs
-------------

* `tradeorder`
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Signifies structure of an order
  ```solidity
  struct tradeorder{
        address initiator;
        address tokenGet;
        address tokenGive;
        uint256 amountGet;
        uint256 amountGive;
        uint256 amountReceived;
        uint256 amountHandedOver;
        uint256 expiryTime;
    }
  ```


Variables
-------------

* `uint256 public tradeID`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Number of orders generated till now.

* `uint256 internal _locked`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Determines the state of the function.

* `uint256 internal _killed`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Determines the active state of the contract.

* `address public auxi`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the address of the Auxi contract.

* `mapping (uint256 => tradeorder) public tradeBook`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the details of the order corresponding to their tradeID.

* `mapping (address=>mapping(address=>uint256)) public lockBalance`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the amount of tokens of a specific token address for a specific user which are locked in an order.

* `mapping (address=>mapping(address=>uint256)) public unlockBalance`:<br />
  &ensp;&nbsp;&nbsp;&nbsp;&nbsp; Stores the amount of tokens of a specific token address for a specific user which can be withdrawn.



Events
-------------

```solidity
event OrderCreate(
        address initiator,
        address tokenGive,
        address tokenGet,
        string tokenGiveTicker,
        string tokenGetTicker,
        uint8 tokenGiveDecimal,
        uint8 tokenGetDecimal,
        uint256 amountGive,
        uint256 amountGet,
        uint256 expiryTime,
        uint256 tradeID,
        bool direction
    );
```
Event emitted when an order is created.
* `initiator` - User which creates the new order.
* `tokenGive` - Address of the token given in this order.
* `tokenGet` - Address of the token received in this order.
* `tokenGiveTicker` - Token ticker of the token given in this order.
* `tokenGetTicker` - Token ticker of the token received in this order.
* `tokenGiveDecimal` - Token decimal of the token given in this order.
* `tokenGetDecimal` - Token decimal of the token received in this order.
* `amountGive` - Amount of the token given in this order.
* `amountGet` - Amount of the token received in this order.
* `expiryTime` - Time after which this order can't be fulfilled.
* `tradeID` - TradeID assigned to this order.
* `direction` - Can only be true or false depending on if user buying or selling.


```solidity
event OrderFulfill(
        uint256 tradeID,
        uint256 amountReceived,
        address fulFillUser
    );
```
Event emitted when an order is fulfilled.
* `tradeID` - tradeID of the order being fulfilled
* `amountReceived` - Amount received to fulfill the order
* `fulFillUser` - Address of the user who fulfilled the order

```solidity
event OrderCancel(uint256 tradeID);
```
Event emitted when an order is cancelled or being cleared after expiry
* `tradeID` - tradeID of the order being cancelled

```solidity
event DepositTokens(address user, address tokenAddress, uint256 amount);
```
Event emitted when an tokens are deposited.
* `user` - User which deposited the tokens
* `tokenAddress` - The token address of the token deposited
* `amount` - Amount of tokens deposited

```solidity
event AdminFee(address tokenAddress, address userAddress, uint256 amount);
```
Event emitted when admin fee is deposited.
* `tokenAddress` - The token in which admin fee is submitted
* `userAddress` - The address of the user who paid admin fees
* `amount` - Amount of tokens deposited as admin fee

```solidity
event WithdrawTokens(address user, address tokenAddress, uint256 amount);
```
Event emitted when tokens are withdrawn.
* `user` - The address of the user withdrawing tokens
* `tokenAddress` - The address of the token user is withdrawing
* `amount` - Amount of tokens withdrawn by the user

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
function initialize(address _auxi) public 
  initializer
```
While deploying, `deployProxy` internally calls this initializer for the exchange contract. This function sets `tradeID` to 0, set `_killed` to `_INACTIVE` and sets the `_auxi` address.

### isKilled

```solidity
function isKilled() internal view
```
*Internal function*.  
Used to stop execution of `depositToken`, `withdrawToken`, `createOrder`, `cancelOrder` and `fulFillOrder` during the kill phase.

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

### depositToken

```solidity
  function depositToken(address _tokenAddress, uint256 _amount)
        external
        virtual
        noReentrant
```
*External function for users to deposit specific tokens in the smart contract*

Inputs required
* `_tokenAddress` - Address of the token to be deposited
* `_amount` - Amount of tokens to be deposited

Input Validation
* `_tokenAddress` should not be the zero address
* `_amount` should not be 0

Functionality  
* Transfers ERC20 tokens from the user to the smart contract
* Updating the user balance for this specific ERC20 token

### withdrawToken

```solidity
  function withdrawToken(address _tokenAddress, uint256 _amount)
        external
        virtual
        noReentrant
```
*External function for users to withdraw specific tokens from the smart contract*

Inputs required
* `_tokenAddress` - Address of the token to be withdrawn
* `_amount` - Amount of tokens to be withdrawn

Input Validation
* `_tokenAddress` should not be the zero address
* `_amount` should not be 0
* Checks if the amount given is less than or equal to user balance for this specific token

Functionality  
* Checks if user has enough balance to withdraw the `_amount` of this specific token
* Transfers ERC20 tokens from the smart contract to the user
* Updating the user balance for this specific ERC20 token

### createOrder

```solidity
function createOrder(
        address _tokenGive,
        uint256 _amountGive,
        address _tokenGet,
        uint256 _amountGet,
        uint256 _expiryTime,
        bool _direction
    ) external virtual noReentrant
```
*External function for users to create order on the onchain order book*

Inputs required
* `_tokenGive` - Address of the tokens to be sold
* `_amountGive` - Amount of tokens to be sold
* `_tokenGet` - Address of the tokens to be received in exchange of `tokenGive`
* `_amountGet` - Amount of the tokens to be received in exchange of `tokenGive`
* `_expiryTime` - Time after which this order cannot be fulfilled
* `_direction` - Direction of the order buy or sell

Input Validation
* `_expiryTime` should be in the future
* `_tokenGive` and `_tokenGet` can't be the same as you cannot trade the same type of token with itself
*  `_amountGive` and `_amountGet` can't be 0

Functionality  
* Assigns a tradeID to this order
* Creates an order on the onchain order book
* Locks initiator's balance equivalent to `_amountGive`
* Stores the order details in a struct variable of type `tradeorder`

### _tradeFee

```solidity
function _tradeFee(
        address _stableCoin,
        uint256 _amount,
        bool _maker
    ) internal virtual 
```
*Internal function called for the calculation and submission of trade fee*

Functionality  
* Calculates trade fee
* Adds trade fee to admin fee mapping
* Transfer remaining trade fee from user if unlock balance is insufficient 

### _cancelOrder

```solidity
function _cancelOrder(uint256 _tradeID) internal virtual
```
*Internal function called by external cancelOrder function*

Inputs required
* `_tradeID` - The tradeID of the order which needs to be cancelled

Functionality   
* Unlocks the remaining locked balance of the order initiator
* Adjusts the balance of the order by transferring back remaining handover amount to order initiator 
* Deletes the order from the tradeBook for gas refund

### cancelOrder

```solidity
function cancelOrder(uint256 _tradeID) external noReentrant
```
*External function which is used by a user to cancel their existing orders*

Inputs required
* `_tradeID` - The tradeID of the order which needs to be cancelled

Input Validation
* The initiator of the order with `_tradeID` can only call this function

Functionality   
* Adjusts the balance of the order by transferring back remaining handover amount to order initiator 
* Deletes the order by calling internal `_cancelOrder` order function

### fulFillOrder

```solidity
function fulFillOrder(uint256 _tradeID, uint256 _amount)
        external
        virtual
        noReentrant
```
*External function users can call to fulfill an existing order on the order book*

Inputs required
* `_tradeID` - The tradeID of the order which needs to be fulfilled
* `_amount` - The amount of tokens the user wants to give to fulfill the order

Input Validation    
* Checks if the `_tradeID` is valid
* Checks if the user calling this function is not the creator of this order
* Checks if the expiry time of the order represented by the `_tradeID` has not passed yet
* Checks if the `_amount` of tokens don't overfill the order

Functionality   
* Transfers the `_amount` of `tokenGet` to the order initiator from the caller's balance
* Calculates the `_amount` of `tokenGive` to be transferred to the caller's balance
* Transfers the `_amount` of `tokenGive` to the caller's balance from the order initiator's locked balance
* If the order is fulfilled entirely then delete the order from the trade book to return gas
