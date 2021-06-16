// SPDX-License-Identifier: UNLICENSED

// This contract locks PancakeSwap liquidity tokens. Locked liquidity cannot be removed from PancakeSwap
// until the specified unlock date has been reached.

// • website:                           https://cryptexlock.me
// • medium:                            https://medium.com/cryptex-locker
// • Telegram Announcements Channel:    https://t.me/CryptExAnnouncements
// • Telegram Main Channel:             https://t.me/cryptexlocker
// • Twitter Page:                      @ExLocker https://twitter.com/ExLocker
// • Reddit:                            https://www.reddit.com/r/CryptExLocker/

pragma solidity 0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IMigrator.sol";

contract CryptExLpTokenLockerV2 is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    IMigrator public migrator;
    struct TokenLock {
        address lpToken;
        address owner;
        uint256 tokenAmount;
        uint256 unlockTime;
    }

    uint256 public lockNonce = 0;

    mapping(uint256 => TokenLock) public tokenLocks;

    mapping(address => EnumerableSet.UintSet) private userLocks;

    event OnTokenLock(
        uint256 indexed lockId,
        address indexed tokenAddress,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime
    );
    event OnTokenUnlock(uint256 indexed lockId);
    event OnLockWithdrawal(uint256 indexed lockId, uint256 amount);
    event OnLockAmountIncreased(uint256 indexed lockId, uint256 amount);
    event OnLockDurationIncreased(uint256 indexed lockId, uint256 newUnlockTime);
    event OnLockOwnershipTransferred(uint256 indexed lockId, address indexed newOwner);
    event OnLockMigration(uint256 indexed lockId, address indexed migrator);

    modifier onlyLockOwner(uint lockId) {
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.owner == address(msg.sender), "NO ACTIVE LOCK OR NOT OWNER");
        _;
    }

    /**
    * @notice locks pancake liquidity token until specified time
    * @param lpToken token address to lock
    * @param amount amount of tokens to lock
    * @param unlockTime unix time in seconds after that tokens can be withdrawn
    * @param withdrawer account that can withdraw tokens to it's balance
    */
    function lockTokens(address lpToken, uint256 amount, uint256 unlockTime,
        address payable withdrawer) external payable nonReentrant returns (uint256 lockId) {
        require(amount > 0, "ZERO AMOUNT");
        require(lpToken != address(0), "ZERO TOKEN");
        require(unlockTime > block.timestamp, "UNLOCK TIME IN THE PAST");
        require(unlockTime < 10000000000, "INVALID UNLOCK TIME, MUST BE UNIX TIME IN SECONDS");

        TokenLock memory lock = TokenLock({
        lpToken: lpToken,
        owner: withdrawer,
        tokenAmount: amount,
        unlockTime: unlockTime
        });

        lockId = lockNonce++;
        tokenLocks[lockId] = lock;

        userLocks[withdrawer].add(lockId);

        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);

        emit OnTokenLock(lockId, lpToken, withdrawer, amount, unlockTime);
        return lockId;
    }


    /**
    * @notice increase unlock time of already locked tokens
    * @param newUnlockTime new unlock time (unix time in seconds)
    */
    function extendLockTime(uint256 lockId, uint256 newUnlockTime) external nonReentrant onlyLockOwner(lockId) {
        require(newUnlockTime > block.timestamp, "UNLOCK TIME IN THE PAST");
        require(newUnlockTime < 10000000000, "INVALID UNLOCK TIME, MUST BE UNIX TIME IN SECONDS");
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.unlockTime < newUnlockTime, "NOT INCREASING UNLOCK TIME");
        lock.unlockTime = newUnlockTime;
        emit OnLockDurationIncreased(lockId, newUnlockTime);
    }

    /**
    * @notice add tokens to an existing lock
    * @param amountToIncrement tokens amount to add
    * @param feePaymentMode fee payment mode
    */
    function increaseLockAmount(uint256 lockId, uint256 amountToIncrement, uint8 feePaymentMode)
    external payable nonReentrant onlyLockOwner(lockId) {
        require(amountToIncrement > 0, "ZERO AMOUNT");
        TokenLock storage lock = tokenLocks[lockId];

        lock.tokenAmount = lock.tokenAmount.add(amountToIncrement);
        IERC20(lock.lpToken).safeTransferFrom(msg.sender, address(this), amountToIncrement);
        emit OnLockAmountIncreased(lockId, amountToIncrement);
    }

    /**
    * @notice withdraw all tokens from lock. Current time must be greater than unlock time
    * @param lockId lock id to withdraw
    */
    function withdraw(uint256 lockId) external {
        TokenLock storage lock = tokenLocks[lockId];
        withdrawPartially(lockId, lock.tokenAmount);
    }

    /**
    * @notice withdraw specified amount of tokens from lock. Current time must be greater than unlock time
    * @param lockId lock id to withdraw tokens from
    * @param amount amount of tokens to withdraw
    */
    function withdrawPartially(uint256 lockId, uint256 amount) public nonReentrant onlyLockOwner(lockId) {
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.tokenAmount >= amount, "AMOUNT EXCEEDS LOCKED");
        require(block.timestamp >= lock.unlockTime, "NOT YET UNLOCKED");
        IERC20(lock.lpToken).safeTransfer(lock.owner, amount);

        lock.tokenAmount = lock.tokenAmount.sub(amount);
        if(lock.tokenAmount == 0) {
            //clean up storage to save gas
            userLocks[lock.owner].remove(lockId);
            delete tokenLocks[lockId];
            emit OnTokenUnlock(lockId);
        }
        emit OnLockWithdrawal(lockId, amount);
    }

    /**
    * @notice transfer lock ownership to another account
    * @param lockId lock id to transfer
    * @param newOwner account to transfer lock
    */
    function transferLock(uint256 lockId, address newOwner) external onlyLockOwner(lockId) {
        require(newOwner != address(0), "ZERO NEW OWNER");
        TokenLock storage lock = tokenLocks[lockId];
        userLocks[lock.owner].remove(lockId);
        userLocks[newOwner].add(lockId);
        lock.owner = newOwner;
        emit OnLockOwnershipTransferred(lockId, newOwner);
    }


    /**
    * @notice get user's locks number
    * @param user user's address
    */
    function userLocksLength(address user) external view returns (uint256) {
        return userLocks[user].length();
    }

    /**
    * @notice get user lock id at specified index
    * @param user user's address
    * @param index index of lock id
    */
    function userLockAt(address user, uint256 index) external view returns (uint256) {
        return userLocks[user].at(index);
    }

    function transferBnb(address recipient, uint256 amount) private {
        (bool res,  ) = recipient.call{value: amount}("");
        require(res, "BNB TRANSFER FAILED");
    }


    /**
    * @notice Sets the migrator contract that will perform the migration in case a new update of Pancake was
    * rolled out. Callable only by the owner of this contract.
    * @param newMigrator address of the migrator contract
    */
    function setMigrator(address newMigrator) external onlyOwner {
        migrator = IMigrator(newMigrator);
    }

    /**
    * @notice migrates liquidity in case new update of Pancake was rolled out.
    * @param lockId id of the lock
    * @param migratorContract address of migrator contract that will perform the migration (prevents frontrun attack
    * if a locker owner changes the migrator contract before the migration function was mined)
    */
    function migrate(uint256 lockId, address migratorContract) external nonReentrant {
        require(address(migrator) != address(0), "NO MIGRATOR");
        require(migratorContract == address(migrator), "WRONG MIGRATOR"); //frontrun prevention

        TokenLock storage lock = tokenLocks[lockId];
        require(lock.owner == msg.sender, "ONLY LOCK OWNER");
        IERC20(lock.lpToken).safeApprove(address(migrator), lock.tokenAmount);
        migrator.migrate(lock.lpToken, lock.tokenAmount, lock.unlockTime, lock.owner);
        emit OnLockMigration(lockId, address(migrator));

        userLocks[lock.owner].remove(lockId);
        delete tokenLocks[lockId];
    }

}
