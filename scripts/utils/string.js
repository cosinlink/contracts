const fixedLength = (str, targetLen = 8) => {
    const len = str.length;
    return '0'.repeat(targetLen - len) + str;
};

const fixedLengthLe = (str, targetLen = 8) => {
    const len = str.length;
    return str + '0'.repeat(targetLen - len);
};

const clear0x = (hexStr) => {
    return hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
};

module.exports = {
    fixedLength,
    fixedLengthLe,
    clear0x,
};
