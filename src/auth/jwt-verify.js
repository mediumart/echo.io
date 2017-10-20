const decoder = require('base64url');
const crypto = require('crypto');

/**
 * Authenticate and decode token data.
 * 
 * @param  token
 * @param  key
 *   
 * @return {false|Object}     
 */
const verify = (token, key) => {
    token = token.split('.');

    if (token.length !== 3 || ! validate(key, ...token)) {
        return false;
    } 

    return decode(token[1]);
}

/**
 * Generate a token signature .
 * 
 * @param  key
 * @param  data
 * 
 * @return {String}      
 */
const sign = (key, data) => {
    return decoder.fromBase64(
        crypto.createHmac('sha256', key).update(data).digest('base64')
    );
}

/**
 * Validate token.
  * 
 * @param  key
 * @param  header  
 * @param  status  
 * @param  signature
 *   
 * @return {Boolean}     
 */
const validate = (key, header, status, sgntr) => {
    let signature = sign(
        key, `${header}.${status}`
    );

    return compare(sgntr, signature);
}

/**
 * Decode data payload.
 * 
 * @param  status  
 *   
 * @return {false|Object}     
 */
const decode = (status) => {
    try { 
        status = decoder.decode(status);

        if (typeof status !== 'string') {
            return status;
        } 
            
        return JSON.parse(status); 
    } catch (e) {}

    return false;
}

/**
 * Compare signature string.
 * 
 * @param  sgntr
 * @param  sgntr2
 * 
 * @return {Boolean}      
 */
const compare = (sgntr, sgntr2) => {
    try {
        return crypto.timingSafeEqual(
            Buffer.from(sgntr), 
            Buffer.from(sgntr2)
        );
    } catch (e) { return false; }
}

/**
 * Export modules.
 */

module.exports = verify;