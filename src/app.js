const bodyParser = require('body-parser');
const express = require('express');
const request = require('request-promise');
const { verify_signature, log } = require('./middleware');

const app = express();

app.use(log, bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
    console.log('hello world');
    /*let date_ob = new Date();
     res.send(date_ob);
    console.log(date_ob);*/
    
});

// request expects two different query string parameters,
//  platform: e.g. shopify
//  shop: e.g. example.myshopify.com
app.get('/oauth/redirect', (req, res) => {
    const domain = process.env.CASHIER_DOMAIN;
    const client_id = process.env.CASHIER_CLIENT_ID;

    const platform = req.query.platform;
    const shop = req.query.shop;

    if (typeof platform === 'undefined' || typeof shop === 'undefined') {
        res.status(400).send('Error: "shop" is required');
    }

    const scope = [
        'add_payments',
        'modify_cart',
        'create_orders',
        'read_shop_settings',
        'provide_shipping_rates',
    ].join(' ');

    res.redirect(
        'https://${domain}/api/v1/${platform}/${shop}/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=code'
    );
});

// request expects three different query string parameters,
//  platform: e.g. shopify
//  shop: e.g. example.myshopify.com
//  code: a temporary authorization code which you can exchange for a Cashier access token
app.get('/oauth/authorize', (req, res) => {
    const platform = req.query.platform;
    const shop = req.query.shop;
    const code = req.query.code;

    if (
        typeof code === 'undefined' ||
        typeof platform === 'undefined' ||
        typeof shop === 'undefined'
    ) {
        res.status(400).send('Error: "shop" is required');
    }

    const domain = process.env.CASHIER_DOMAIN;
    const requestData = {
        client_id: process.env.CASHIER_CLIENT_ID,
        client_secret: process.env.CASHIER_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
    };

    request({
        url: 'https://${domain}/api/v1/${platform}/${shop}/oauth/access_token',
        method: 'POST',
        json: requestData,
    })
        .then(resp => {
            //TODO: save access_token in order to perform Cashier API calls
            console.log[resp.access_Token];
            // at this point the app is free to redirect the user wherever it wants
            // this example redirects back into the Cashier admin
            res.redirect(
                'https://${domain}/admin/${platform}/${shop}/marketplace'
            );
        })
        .catch(err => {
            //TODO: report error
            console.log['Error'];
            res.status(500).end();
        });
});

app.post('/oauth/uninstalled', verify_signature, (req, res) => {
    const platform = req.query.platform;
    const shop = req.query.shop;

    //TODO: mark shop as uninstalled in database

    res.send();
});


module.exports = app;
