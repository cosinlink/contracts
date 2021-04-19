pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

/*

*/
contract IDOWhiteList is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public startTime;
    uint256 public endTime;
    uint256 public redeemTime;
    //record if the buyer has bought
    mapping(address => bool) public purchasedBuyer;
    //if purchasedAmount(targetToken's amountFactor) is 0, mean the guy didn't buy it, or it has redeemed
    mapping(address => uint256) public purchasedAmountFactor;

    //which address to withdraw, only keep message!!!!!
    //for bsc
    mapping(address => address) public purchasedBuyerBscAddress;
    //an auxiliary array for loop
    address[] public purchasedList;
    address[] public purchasedListBscAddress;

    IERC20 public targetToken;
    //sourceToken => price
    mapping(IERC20 => uint256) public sourceAmounts;//need source token amount per subscription, zero for not allowed

    //没次购买算作几份,默认是1,后面可以修改...
    uint256 public targetAmountFactor;//redeem target token amount per subscription, normally it is 1
    //targetAmountFactor的总量不能超过targetCurrentSupply
    uint256 public targetCurrentSupply;//for targetAmountFactor
    //每份purchasedAmount对应多少targetToken
    uint256 public targetTokenMultiplicationFactor;

    //immutable
    uint256 public targetTotalSupply;//for targetAmountFactor

    IERC20 public checkToken;
    uint256 public checkTokenMinimum;

    bool public whiteListActivated;
    mapping(address => bool) public whiteList;

    uint256 public purchaseFee = 0.02 ether;
    address public feeManager;

    event Purchase(address indexed buyer, address sourceToken, uint256 sourceAmount, uint256 targetAmountFactor,address bscAddress);
    event Redeem(address indexed buyer, uint256 targetAmount);
    event Disqualification(address indexed buyer, uint256 targetAmountFactor);

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _redeemTime,
        IERC20[] memory _sourceTokens,
        IERC20 _targetToken,
        uint256[] memory _sourceAmounts,
        uint256 _targetAmountFactor,
        uint256 _targetCurrentSupply,
        uint256 _targetTokenMultiplicationFactor,
        IERC20 _checkToken,
        uint256 _checkTokenMinimum,
        bool _whiteListActivated,
        address _feeManager
    ) public {
        require(_startTime < _endTime, "_startTime < _endTime");
        require(_endTime < _redeemTime, "_endTime< _redeemTime");
        require(_sourceTokens.length == _sourceAmounts.length, "_sourceTokens.length == _sourceAmounts.length");
        startTime = _startTime;
        endTime = _endTime;
        redeemTime = _redeemTime;
        for (uint256 i = 0; i < _sourceTokens.length; i++) {
            sourceAmounts[_sourceTokens[i]] = _sourceAmounts[i];
        }
        targetToken = _targetToken;
        targetAmountFactor = _targetAmountFactor;
        targetCurrentSupply = _targetCurrentSupply;
        targetTotalSupply = _targetCurrentSupply;
        targetTokenMultiplicationFactor = _targetTokenMultiplicationFactor;
        checkToken = _checkToken;
        checkTokenMinimum = _checkTokenMinimum;
        whiteListActivated = _whiteListActivated;
        feeManager = _feeManager;
    }

    modifier inPurchase(){
        require(startTime <= block.timestamp, "IDO has not started");
        require(block.timestamp < endTime, "IDO has end");
        _;
    }

    modifier inRedeem(){
        require(redeemTime <= block.timestamp, "Redeem has not started");
        _;
    }

    modifier isTargetTokenReady(){
        require(address(targetToken) != address(0), "Target token addres not set");
        require(targetTokenMultiplicationFactor > 0, "targetTokenMultiplicationFactor should not be zero");
        _;
    }

//    modifier qualified(){
//        if (address(checkToken) != address(0)) {
//            require(checkToken.balanceOf(msg.sender) >= checkTokenMinimum);
//        }
//        _;
//    }

//    modifier white(){
//        if (whiteListActivated) {
//            require(whiteList[_msgSender()] == true, "You are not permitted to ido, or have participated");
//        }
//        _;
//    }

    modifier chargeFee(){
        require(msg.value >= purchaseFee);
        payable(feeManager).transfer(msg.value);
        _;
    }

    function purchasedListLength() view external returns (uint256){
        return purchasedList.length;
    }

    function purchasedListBscAddressLength() view external returns (uint256){
        return purchasedListBscAddress.length;
    }

    //only for front end
    function isPermittedAndQualified() view external returns (bool, string memory){
        if (address(checkToken) != address(0)) {
            if (checkToken.balanceOf(_msgSender()) < checkTokenMinimum) {
                return (false, "checkTokenMinimum fails");
            }
        }
        if (whiteListActivated) {
            if (whiteList[_msgSender()] == false) {
                return (false, "whiteList fails");
            }
        }

        return (true, "ok");
    }

    function redeemable(address buyer) view external returns (bool){
        if (block.timestamp < redeemTime) {
            return false;
        }
        if (purchasedAmountFactor[buyer] == uint256(0)) {
            return false;
        }
        return true;
    }


    function purchase(IERC20 sourceToken, address bscAddress) inPurchase nonReentrant /*qualified*/ /*white*/ chargeFee payable external {
        require(bscAddress != address(0), "bscAddress can not be 0x00");
        address buyer = _msgSender();
        require(purchasedBuyer[buyer] == false, "You have bought");
        require(targetCurrentSupply >= targetAmountFactor, "Not enough target quota");
        uint256 sourceAmount = sourceAmounts[sourceToken];
        require(sourceAmount > 0, "Source token is not permitted");

        purchasedBuyer[buyer] = true;
        purchasedBuyerBscAddress[_msgSender()] = bscAddress;
        // twice is not allowed
        purchasedAmountFactor[buyer] = targetAmountFactor;
        require(purchasedList.length == purchasedListBscAddress.length, "purchasedList.length == purchasedListBscAddress.length");
        purchasedList.push(buyer);
        purchasedListBscAddress.push(bscAddress);

        targetCurrentSupply = targetCurrentSupply.sub(targetAmountFactor);

        SafeERC20.safeTransferFrom(sourceToken, buyer, address(this), sourceAmount);

        emit Purchase(buyer, address(sourceToken), sourceAmount, targetAmountFactor,bscAddress);
    }


    /*
    before redeem, target token must be transferred into this contract
    */
    function redeem() inRedeem isTargetTokenReady nonReentrant external {
        address buyer = _msgSender();
        uint256 amountFactor = purchasedAmountFactor[buyer];
        require(amountFactor != uint256(0), "You didn't purchase or you have redeemed, or you have disqualified");

        purchasedAmountFactor[buyer] = 0;
        uint256 amount = amountFactor.mul(targetTokenMultiplicationFactor);
        uint256 balance = targetToken.balanceOf(address(this));
        require(balance >= amount, "Target token balance not enough");
        SafeERC20.safeTransfer(targetToken, buyer, amount);
        emit Redeem(buyer, amount);
    }

    //force to flush data at any time
    function disqualify(address buyer, uint256 amountFactor) onlyOwner external {
        purchasedAmountFactor[buyer] = amountFactor;
        emit Disqualification(buyer, amountFactor);
    }

    //admin can transfer any token in emergency
    function transferSourceToken(IERC20 tokenAddress, address to, uint256 amount) onlyOwner external {
        SafeERC20.safeTransfer(tokenAddress, to, amount);
    }

    //admin can transfer any eth in emergency
    function transferETH(address to, uint256 amount) onlyOwner external {
        payable(to).transfer(amount);
    }

    function initSet(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _redeemTime
    ) onlyOwner external {
        require(block.timestamp < startTime, "updateConfig must happens before it starts");


        require(_startTime < _endTime, "_startTime < _endTime");
        require(_endTime < _redeemTime, "_endTime < _redeemTime");

        require(block.timestamp < _startTime, "new startTime must not before now");

        startTime = _startTime;
        endTime = _endTime;
        redeemTime = _redeemTime;
    }

    function updateConfig(
        uint256 _endTime,
        uint256 _redeemTime
    ) onlyOwner external {
        require(block.timestamp < endTime, "updateConfig must happens before it ends");

        if (_endTime == 0) {
            _endTime = block.timestamp;
        }


        require(startTime < _endTime, "_startTime < _endTime");
        require(_endTime < _redeemTime, "_endTime < _redeemTime");

        require(block.timestamp <= _endTime, "new endTime must not before now");

        endTime = _endTime;
        redeemTime = _redeemTime;
    }

    function changeRedeemTime(uint256 _redeemTime) onlyOwner external {
        if (_redeemTime == uint256(0)) {
            _redeemTime = block.timestamp;
        }
        require(endTime < _redeemTime, "endTime < _redeemTime");
        redeemTime = _redeemTime;
    }

    //usually, it should not be invoked
    function changeTargetAmountFactor(uint256 _targetAmountFactor) onlyOwner external {
        targetAmountFactor = _targetAmountFactor;
    }

    function changeTargetTokenAndMultiplicationFacto(IERC20 _targetToken, uint256 _targetTokenMultiplicationFactor) onlyOwner external {
        targetToken = _targetToken;
        targetTokenMultiplicationFactor = _targetTokenMultiplicationFactor;
    }

    function changeSourceTokenAmount(IERC20 _sourceToken, uint256 _sourceAmount) onlyOwner external {
        sourceAmounts[_sourceToken] = _sourceAmount;
    }

    function changeCheckToken(IERC20 _checkToken, uint256 _checkTokenMinimum) onlyOwner external {
        checkToken = _checkToken;
        checkTokenMinimum = _checkTokenMinimum;
    }

    function changeWhiteListActivated(bool _whiteListActivated) onlyOwner external {
        whiteListActivated = _whiteListActivated;
    }

    function addWhiteList(address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            whiteList[users[i]] = true;
        }
    }

    function changeFee(address _feeManager, uint256 _purchaseFee) onlyOwner external {
        feeManager = _feeManager;
        purchaseFee = _purchaseFee;
    }
}
