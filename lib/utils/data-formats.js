const { FORMATS_BY_DRIVER } = require('../constants');

module.exports.getDataFormatsByDriver = driver => {
    return FORMATS_BY_DRIVER[driver];
};