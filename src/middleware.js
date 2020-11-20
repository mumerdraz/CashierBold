const httpsig = require('http-signature');

const verify_signature = (req, res, next) => {
    try {
        // verify Cashier's HTTP signature
        // this is required in order to verify that the request originated from Cashier
        const parsed = httpsig.parse(req);
        httpsig.verifyHMAC(parsed, process.env.CASHIER_CLIENT_SECRET);
        next();
    } catch (error) {
        res.status(401).end();
    }
};

const log = (req, res, next) => {
    console.log(req.method, req.url);
    next();
};

module.exports = {
    log,
    verify_signature,
};
