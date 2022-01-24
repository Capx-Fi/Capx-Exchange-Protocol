// SPDX-License-Identifier: GNU GPLv3

import "../node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./UUPSUpgradeable.sol";
import "../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

pragma solidity 0.8.4;

interface ERC20Properties {
    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);
}

pragma solidity 0.8.4;

interface AuxiInstance {
    function whiteListTokens(address tokenAddress) external returns (bool);

    function tradeFeeCalculation(
        address _userAddress,
        uint256 _amount,
        bool _maker
    ) external returns (uint256);

    function adminFeeReceiver(address _stableCoin, uint256 _amount) external;
}

pragma solidity 0.8.4;

/// @title Exchange contract for orderbook
/// @author Capx Team
/// @notice The Exchange contract is contract which the user will interact with for creating and full filling orders.
/// @dev This contract uses openzepplin Upgradable plugin. https://docs.openzeppelin.com/upgrades-plugins/1.x/
contract Exchange is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 internal constant _ACTIVE = 2;
    uint256 internal constant _INACTIVE = 1;

    uint256 public tradeID;
    uint256 internal _locked;
    uint256 internal _killed;

    address public auxi;

    struct tradeorder {
        address initiator;
        address tokenGet;
        address tokenGive;
        uint256 amountGet;
        uint256 amountGive;
        uint256 amountReceived;
        uint256 amountHandedOver;
        uint256 expiryTime;
    }

    mapping(uint256 => tradeorder) public tradeBook;
    mapping(address => mapping(address => uint256)) public lockBalance;
    mapping(address => mapping(address => uint256)) public unlockBalance;

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

    event OrderFulfill(
        uint256 tradeID,
        uint256 amountReceived,
        address fulFillUser
    );

    event OrderCancel(uint256 tradeID);

    event DepositTokens(address user, address tokenAddress, uint256 amount);

    event AdminFee(address tokenAddress, address userAddress, uint256 amount);

    event WithdrawTokens(address user, address tokenAddress, uint256 amount);

    modifier noReentrant() {
        require(_locked != _ACTIVE, "ReentrancyGuard: Re-Entrant call");
        _locked = _ACTIVE;
        _;
        _locked = _INACTIVE;
    }

    function isKilled() internal view {
        require(_killed != _ACTIVE, "FailSafeMode: ACTIVE");
    }

    /// @notice Disables all the functionality of the contract.
    function kill() external onlyOwner {
        _killed = _ACTIVE;
    }

    /// @notice Enables all  the functionality of the contract.
    function revive() external onlyOwner {
        _killed = _INACTIVE;
    }

    function initialize(address _auxi) public initializer {
        require(_auxi != address(0), "Invalid Input");
        __Ownable_init();
        tradeID = 0;
        _killed = _INACTIVE;
        auxi = _auxi;
    }

    function _authorizeUpgrade(address _newImplementation)
        internal
        override
        onlyOwner
    {}

    /// @notice Using this function a user can deposit any ERC20 token which can be used for trade
    /// @dev Transfers ERC20 token from user to itself and maintains the mapping of balances
    /// @param _tokenAddress Address of the tokens to be deposited
    /// @param _amount Amount of tokens to be deposited
    function depositToken(address _tokenAddress, uint256 _amount)
        external
        virtual
        noReentrant
    {
        isKilled();
        require(_amount != 0 && _tokenAddress != address(0), "Invalid Input");
        IERC20Upgradeable(_tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        unlockBalance[_tokenAddress][msg.sender] += _amount;

        emit DepositTokens(msg.sender, _tokenAddress, _amount);
    }

    /// @notice Using this function a user can withdraw their unlocked ERC20 token which can be used for trade
    /// @dev Transfers ERC20 token from the contract to the user and maintains the mapping of balances
    /// @param _tokenAddress Address of the tokens to be withdrawn
    /// @param _amount Amount of tokens to be withdrawn
    function withdrawToken(address _tokenAddress, uint256 _amount)
        external
        virtual
        noReentrant
    {
        isKilled();
        require(
            _amount != 0 &&
                _tokenAddress != address(0) &&
                (unlockBalance[_tokenAddress][msg.sender] >= _amount),
            "Invalid Input"
        );

        unlockBalance[_tokenAddress][msg.sender] -= _amount;

        IERC20Upgradeable(_tokenAddress).safeTransfer(msg.sender, _amount);
        emit WithdrawTokens(msg.sender, _tokenAddress, _amount);
    }

    /// @notice Using this function a user can create a new order and post it in the order book
    /// @dev If the user does not have enough token balance to create order then it transfers the remaining amount from the user to the contract
    /// @param _tokenGive Address of the tokens user wants to sell
    /// @param _amountGive Amount of tokens user wants to lock in this order to get traded
    /// @param _tokenGet Address of the tokens user wants to buy
    /// @param _amountGet Amount of tokens user wants to get if all the _tokenGive tokens get sold
    /// @param _expiryTime Time after which this order cannot be full filled
    /// @param _direction can only be true or false determines if this order is buy or sell order
    function createOrder(
        address _tokenGive,
        uint256 _amountGive,
        address _tokenGet,
        uint256 _amountGet,
        uint256 _expiryTime,
        bool _direction
    ) external virtual noReentrant {
        isKilled();
        require(
            _expiryTime > block.timestamp &&
                _tokenGet != _tokenGive &&
                _amountGive != 0 &&
                _amountGet != 0,
            "Invalid Input"
        );
        require(
            AuxiInstance(auxi).whiteListTokens(_tokenGive) ||
                AuxiInstance(auxi).whiteListTokens(_tokenGet),
            "Only stable with another token"
        );

        if (AuxiInstance(auxi).whiteListTokens(_tokenGive))
            _tradeFee(_tokenGive, _amountGive, true);
        else _tradeFee(_tokenGet, _amountGet, true);

        tradeID += 1;

        if (unlockBalance[_tokenGive][msg.sender] >= _amountGive) {
            unlockBalance[_tokenGive][msg.sender] -= _amountGive;
        } else {
            IERC20Upgradeable(_tokenGive).safeTransferFrom(
                msg.sender,
                address(this),
                _amountGive - unlockBalance[_tokenGive][msg.sender]
            );

            unlockBalance[_tokenGive][msg.sender] = 0;
        }

        lockBalance[_tokenGive][msg.sender] += _amountGive;

        tradeBook[tradeID] = tradeorder(
            msg.sender,
            _tokenGet,
            _tokenGive,
            _amountGet,
            _amountGive,
            0,
            0,
            _expiryTime
        );

        emit OrderCreate(
            msg.sender,
            _tokenGive,
            _tokenGet,
            ERC20Properties(_tokenGive).symbol(),
            ERC20Properties(_tokenGet).symbol(),
            ERC20Properties(_tokenGive).decimals(),
            ERC20Properties(_tokenGet).decimals(),
            _amountGive,
            _amountGet,
            _expiryTime,
            tradeID,
            _direction
        );
    }

    /// @notice Internal function which calls auxi to calculate trade fee and the submits trade fee to auxi
    /// @param _stableCoin Address of the token trade fees is to be submitted in
    /// @param _amount Amount of tokens being submitted as trade fee
    /// @param _maker Boolean to determine if maker or taker fee is to be calculated
    function _tradeFee(
        address _stableCoin,
        uint256 _amount,
        bool _maker
    ) internal virtual {
        uint256 _fee = AuxiInstance(auxi).tradeFeeCalculation(
            msg.sender,
            _amount,
            _maker
        );

        if (unlockBalance[_stableCoin][msg.sender] >= _fee) {
            unlockBalance[_stableCoin][msg.sender] -= _fee;
        } else {
            IERC20Upgradeable(_stableCoin).safeTransferFrom(
                msg.sender,
                address(this),
                _fee - unlockBalance[_stableCoin][msg.sender]
            );

            unlockBalance[_stableCoin][msg.sender] = 0;
        }

        IERC20Upgradeable(_stableCoin).approve(auxi, _fee);

        AuxiInstance(auxi).adminFeeReceiver(_stableCoin, _fee);
        emit AdminFee(_stableCoin, msg.sender, _fee);
    }

    /// @notice Internal helper function which returns the remaining balance to order creator when order is cancelled or expired
    /// @param _tradeID The tradeID of the order which is processed and deleted
    function _cancelOrder(uint256 _tradeID) internal virtual {
        tradeorder memory _currentTrade = tradeBook[_tradeID];

        unlockBalance[_currentTrade.tokenGive][_currentTrade.initiator] +=
            _currentTrade.amountGive -
            _currentTrade.amountHandedOver;
        lockBalance[_currentTrade.tokenGive][_currentTrade.initiator] -=
            _currentTrade.amountGive -
            _currentTrade.amountHandedOver;

        delete tradeBook[_tradeID];

        emit OrderCancel(_tradeID);
    }

    /// @notice Function to cancel an existing order in the order book
    /// @dev This checks if the caller is the initiator of the order and calls the internal _cancelOrder function
    /// @param _tradeID The array of tradeIDs of the orders which are processed and deleted
    function cancelOrder(uint256[] memory _tradeID) external virtual {
        isKilled();
        require(_tradeID.length <= 10, "Max 10 orders can be cancelled");
        for (uint256 index = 0; index < _tradeID.length; index++) {
            require(
                msg.sender == tradeBook[_tradeID[index]].initiator,
                "can only cancel own orders"
            );

            _cancelOrder(_tradeID[index]);
        }
    }

    /// @notice Function used by users to full fill and existing order
    /// @dev If the amount of tokens required to full fill the order is not sufficiant in users balance then it will transfer the reamining tokens from the user to the contract
    /// @dev The function uses _amountGive and _amountGet to calculate the rate of exchange
    /// @param _tradeID The tradeID of the order which will be filled
    /// @param _amount Amount of _tokenGet tokens used by the user to full fill this order
    function fulFillOrder(uint256 _tradeID, uint256 _amount)
        external
        virtual
        noReentrant
    {
        isKilled();
        tradeorder memory _currentTrade = tradeBook[_tradeID];
        require(
            _currentTrade.initiator != address(0) &&
                _amount != 0 &&
                _currentTrade.initiator != msg.sender &&
                _currentTrade.expiryTime > block.timestamp &&
                (_currentTrade.amountReceived + _amount <=
                    _currentTrade.amountGet),
            "Invalid Input"
        );

        if (AuxiInstance(auxi).whiteListTokens(_currentTrade.tokenGet))
            _tradeFee(_currentTrade.tokenGet, _amount, false);

        if (
            _amount == (_currentTrade.amountGet - _currentTrade.amountReceived)
        ) {
            if (AuxiInstance(auxi).whiteListTokens(_currentTrade.tokenGive))
                _tradeFee(
                    _currentTrade.tokenGive,
                    _currentTrade.amountGive - _currentTrade.amountHandedOver,
                    false
                );
            lockBalance[_currentTrade.tokenGive][_currentTrade.initiator] -=
                _currentTrade.amountGive -
                _currentTrade.amountHandedOver;
            unlockBalance[_currentTrade.tokenGive][msg.sender] +=
                _currentTrade.amountGive -
                _currentTrade.amountHandedOver;
        } else {
            uint256 difference = (_currentTrade.amountGive * _amount) /
                _currentTrade.amountGet;
            if (AuxiInstance(auxi).whiteListTokens(_currentTrade.tokenGive))
                _tradeFee(_currentTrade.tokenGive, difference, false);
            lockBalance[_currentTrade.tokenGive][
                _currentTrade.initiator
            ] -= difference;
            unlockBalance[_currentTrade.tokenGive][msg.sender] += difference;
            _currentTrade.amountHandedOver += difference;
        }

        _currentTrade.amountReceived += _amount;

        unlockBalance[_currentTrade.tokenGet][
            _currentTrade.initiator
        ] += _amount;

        if (unlockBalance[_currentTrade.tokenGet][msg.sender] >= _amount) {
            unlockBalance[_currentTrade.tokenGet][msg.sender] -= _amount;
        } else {
            IERC20Upgradeable(_currentTrade.tokenGet).safeTransferFrom(
                msg.sender,
                address(this),
                _amount - unlockBalance[_currentTrade.tokenGet][msg.sender]
            );
            unlockBalance[_currentTrade.tokenGet][msg.sender] = 0;
        }

        if (_currentTrade.amountReceived == _currentTrade.amountGet) {
            delete tradeBook[_tradeID];
        } else {
            tradeBook[_tradeID] = _currentTrade;
        }

        emit OrderFulfill(_tradeID, _amount, msg.sender);
    }
}
