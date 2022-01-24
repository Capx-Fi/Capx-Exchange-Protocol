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

/// @title Auxi contract for orderbook
/// @author Capx Team
/// @notice The Auxi contract is the contract which governs the trade fees and other governance aspects of the exchange contract.
/// @dev This contract uses openzepplin Upgradable plugin. https://docs.openzeppelin.com/upgrades-plugins/1.x/
contract Auxi is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 internal constant _ACTIVE = 2;
    uint256 internal constant _INACTIVE = 1;
    uint256 internal _killed;
    uint256 internal _locked;
    uint256[] public tradeArray;

    address public capxTokenAddress;
    address public exchangeContract;
    uint8 public decimalCapx;

    mapping(address => bool) public whiteListTokens;
    mapping(address => uint256) public adminFee;

    event StableStatus(address stableCoin, bool status);

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

    function initialize() public initializer {
        __Ownable_init();
        _killed = _INACTIVE;
        tradeArray = new uint256[](14);
    }

    /// @notice Using this function owner can set new trading fees
    /// @dev Sets trading fees array with new values
    /// @param _tradeFeeArray Array which contains trading fees values
    function setTradingFeeArray(uint256[] memory _tradeFeeArray)
        external
        virtual
        onlyOwner
    {
        require(_tradeFeeArray.length == 14, "Invalid Input");
        require(
            _tradeFeeArray[0] < _tradeFeeArray[3] &&
                _tradeFeeArray[3] < _tradeFeeArray[6] &&
                _tradeFeeArray[6] < _tradeFeeArray[9],
            "Maintaining order"
        );
        isKilled();
        tradeArray = _tradeFeeArray;
    }

    /// @notice Using this function to set exchange contract address
    /// @param _exchangeContract exchange contract address
    function setExchangeContract(address _exchangeContract)
        external
        virtual
        onlyOwner
    {
        require(_exchangeContract != address(0), "Invalid Input");
        isKilled();
        exchangeContract = _exchangeContract;
    }

    /// @notice Using this function owner can set which token will be used as stable coins
    /// @dev Whitelists stable coins token addresses
    /// @param _stableCoins Array of stable coins whose whitelisting state needs to be set
    /// @param _status Array of boolean variables defining if tokens are whitelisted or unlisted
    function setStableCoinsStatus(
        address[] memory _stableCoins,
        bool[] memory _status
    ) public virtual onlyOwner {
        require(
            _stableCoins.length != 0 &&
                _stableCoins.length == _status.length &&
                _stableCoins.length <= 10,
            "Inconsistent Input"
        );
        isKilled();
        for (uint256 index = 0; index < _stableCoins.length; index++) {
            require(_stableCoins[index] != address(0), "Invalid input");
            whiteListTokens[_stableCoins[index]] = _status[index];
            emit StableStatus(_stableCoins[index], _status[index]);
        }
    }

    /// @notice Using this function owner can set the Capx Token
    /// @param _capx Address of Capx Token
    function setCapxToken(address _capx) public virtual noReentrant onlyOwner {
        require(_capx != address(0), "Invalid input");
        isKilled();
        capxTokenAddress = _capx;
        decimalCapx = ERC20Properties(_capx).decimals();
    }

    function _authorizeUpgrade(address _newImplementation)
        internal
        override
        onlyOwner
    {}

    /// @notice Using this function trade fees is calculated
    /// @dev Exchange contract also uses this function to determine the trade fee of a user
    /// @param _userAddress User whose trade fees it to be calculated
    /// @param _amount Amount on which the trade fee is to be calculated
    /// @param _maker Make or taker fee is to be calcualted
    function tradeFeeCalculation(
        address _userAddress,
        uint256 _amount,
        bool _maker
    ) external view virtual returns (uint256) {
        uint256 _balanceCapx;
        if (capxTokenAddress != address(0))
            _balanceCapx = IERC20Upgradeable(capxTokenAddress).balanceOf(
                _userAddress
            );

        uint256 _fee;
        if (_balanceCapx < (tradeArray[0] * (10**decimalCapx))) {
            if (_maker) _fee = (_amount * tradeArray[1]) / 100000;
            else _fee = (_amount * tradeArray[2]) / 100000;
        } else if (_balanceCapx < tradeArray[3] * (10**decimalCapx)) {
            if (_maker) _fee = (_amount * tradeArray[4]) / 100000;
            else _fee = (_amount * tradeArray[5]) / 100000;
        } else if (_balanceCapx < tradeArray[6] * (10**decimalCapx)) {
            if (_maker) _fee = (_amount * tradeArray[7]) / 100000;
            else _fee = (_amount * tradeArray[8]) / 100000;
        } else if (_balanceCapx < tradeArray[9] * (10**decimalCapx)) {
            if (_maker) _fee = (_amount * tradeArray[10]) / 100000;
            else _fee = (_amount * tradeArray[11]) / 100000;
        } else {
            if (_maker) _fee = (_amount * tradeArray[12]) / 100000;
            else _fee = (_amount * tradeArray[13]) / 100000;
        }

        return (_fee);
    }

    /// @notice Function used by exchange contract to submit fee to Auxi contract
    /// @param _stableCoin Fee in which token is being submitted
    /// @param _amount Amount of trade fee being submitted
    function adminFeeReceiver(address _stableCoin, uint256 _amount)
        external
        virtual
        noReentrant
    {
        require(
            msg.sender == exchangeContract,
            "only exchange Contract can call"
        );
        adminFee[_stableCoin] += _amount;
        IERC20Upgradeable(_stableCoin).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
    }

    /// @notice Function used to withdraw trade Fee
    /// @param _stableCoin Address of the stable coin to be withdrawn
    /// @param _amount Amount of trade fee to be withdrawn
    function withdrawFees(address _stableCoin, uint256 _amount)
        external
        virtual
        noReentrant
        onlyOwner
    {
        require(_stableCoin != address(0) && _amount != 0, "Invalid Input");
        adminFee[_stableCoin] -= _amount;
        IERC20Upgradeable(_stableCoin).transfer(owner(), _amount);
    }
}
