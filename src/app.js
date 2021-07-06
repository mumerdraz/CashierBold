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
/*
app.get('/widget', (req, res) => {
    res.sendFile('views/widget.html', { root: __dirname });
});
*/
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
        `https://${domain}/api/v1/${platform}/${shop}/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=code`
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
        url: `https://${domain}/api/v1/${platform}/${shop}/oauth/access_token`,
        method: 'POST',
        json: requestData,
    })
        .then(resp => {
            //TODO: save access_token in order to perform Cashier API calls
            console.log[resp.access_token];
            // at this point the app is free to redirect the user wherever it wants
            // this example redirects back into the Cashier admin
            res.redirect(
                `https://${domain}/admin/${platform}/${shop}/marketplace`
            );
        })
        .catch(err => {
            //TODO: report error
            res.status(500).end();
        });
});

app.post('/oauth/uninstalled', verify_signature, (req, res) => {
    const platform = req.query.platform;
    const shop = req.query.shop;

    //TODO: mark shop as uninstalled in database

    res.send();
});
/*
app.post('/cashier/event', verify_signature, (req, res) => {
    //res.send(req.body.event);
    const actions = handleEvent(req);

    res.send({
        success: true,
        actions: actions,
    });
});
*/
/*
app.get('/settings', verify_signature, (req, res) => {
    const settings = handleSettingsPage(req);
    const token = req.query.token;

    if (typeof token === 'undefined') {
        res.status(400).send('Error: "token" is required');
    }

    res.send({
        token: req.query.token,
        settings: settings,
    });
});
*/
/*
app.post('/settings', verify_signature, (req, res) => {
    const settings = handleReceiveUserSettings(req);
    const token = req.query.token;

    if (typeof token === 'undefined') {
        res.status(400).send('Error: "token" is required');
    }

    res.send({
        token: req.token,
        settings: settings,
    });
});

app.post('/shipping', verify_signature, (req, res) => {
    res.send({
        name: 'My Custom Shipping Override',
        rates: [
            {
                line_text: 'EXTERNAL ECONOMY SHIPPING 5-7 BUSINESS DAYS',
                value: 11.5,
            },
            {
                line_text: 'EXTERNAL SHIPPING SOURCE OVERNIGHT EXPRESS',
                value: 15.5,
            },
        ],
    });
});
*/
/*
app.post('/payment/preauth', verify_signature, (req, res) => {
    if (req.body.payment.value >= 100000) {
        res.send({
            success: false,
            error: 'payment exceeds maximum value',
        });
    } else {
        res.send({
            success: true,
            reference_id: 'payment-12345',
        });
    }
});

app.post('/payment/capture', verify_signature, (req, res) => {
    res.send({
        success: true,
        reference_id: 'payment-12345',
    });
});

app.post('/payment/refund', verify_signature, (req, res) => {
    res.send({
        success: true,
        reference_id: 'payment-12345',
    });
});
*/
function handleEvent(req) {
    switch (req.body.event) {
        case 'initialize_checkout':
            return handleInitializeCheckout(req);
        case 'app_hook':
            return handleAppHook(req);
        default:
            return [];
    }
}

function handleInitializeCheckout(req) {
    return [
        {
            type: 'APP_UPDATE_WIDGET',
            data: {
                name: 'my_payments_widget',
                type: 'iframe',
                position: 'payments',
                source: process.env.APP_URL + '/widget',
                frame_origin: process.env.APP_URL,
            },
        },
        {
            type: 'APP_UPDATE_WIDGET',
            data: {
                name: 'my_discount_widget',
                type: 'app_hook',
                position: 'discount',
                text: 'Discount 5%',
                icon: 'https://via.placeholder.com/50x50.png',
                click_hook: 'apply_discount',
            },
        },
        {
            type: 'APP_UPDATE_WIDGET',
            data: {
                name: 'my_payment_method',
                type: 'app_hook',
                position: 'payment_gateway',
                text: 'Pay via the honor system',
                click_hook: 'add_payment',
            },
        },
        {
            type: 'OVERRIDE_SHIPPING',
            data: {
                url: process.env.APP_URL + '/shipping',
            },
        },
    ];
}

function handleSettingsPage(req) {
    //Missing: Load user values from DB, assign to `value` keys

    return {
        shortString1: {
            text: 'This is a short string field',
            type: 'stringShort',
            tooltip: 'Short string tooltip',
            placeholder: 'Short string placeholder',
            value: '',
            validation_schema: {},
        },
        regularString1: {
            text: 'This is a regular string field ',
            type: 'string',
            tooltip: 'Regular string tooltip',
            placeholder: 'Regular string placeholder',
            value: '',
            validation_schema: {},
        },
        number1: {
            text: 'This is a number field',
            type: 'number',
            tooltip: 'number tooltip',
            placeholder: 'Number placeholder',
            value: '',
            validation_schema: {},
        },
        checkbox1: {
            text: 'This is a checkbox',
            type: 'checkbox',
            tooltip: 'checkbox tooltip',
            value: '',
            validation_schema: {},
        },

        link1: {
            text: 'This is a link',
            type: 'link',
            value: 'https://www.google.ca',
            validation_schema: {},
        },
        horizontalRule1: {
            type: 'horizontalRule',
            validation_schema: {},
        },
        header1: {
            text: 'This is a header',
            type: 'header',
            tooltip: 'This is a header tooltip',
            validation_schema: {},
        },
        toggle1: {
            text: 'This is a toggle',
            type: 'toggle',
            tooltip: 'toggle tooltip',
            value: 1,
            validation_schema: {},
        },
        validationExampleNumber1: {
            text: 'This is required when the toggle is checked',
            type: 'number',
            tooltip: 'Turn off toggle to not require this field',
            placeholder: 'Number placeholder',
            value: '',
            validation_schema: {
                required_if: {
                    target: 'toggle1',
                    errorText: 'Required when toggle is on',
                },
                min: {
                    value: 5,
                    errorText: 'Must be greater than 5',
                },
                max: {
                    value: 1000,
                    errorText: 'Must be less than 1000',
                },
            },
        },
    };
}

function handleReceiveUserSettings(req) {
    console.log(req.body);

    //Save user settings to DB
}

function handleAppHook(req) {
    switch (req.body.properties.hook) {
        case 'apply_discount':
            return [
                {
                    type: 'DISCOUNT_CART',
                    data: {
                        discountPercentage: 5,
                        transformationMessage: 'Money saved',
                    },
                },
                {
                    type: 'APP_UPDATE_WIDGET',
                    data: {
                        name: 'my_discount_widget',
                        type: 'app_hook',
                        position: 'discount',
                        text: "You're welcome",
                        click_hook: 'already_used',
                        icon: 'https://via.placeholder.com/50x50.png',
                    },
                },
            ];
        case 'already_used':
            return [
                {
                    type: 'APP_UPDATE_WIDGET',
                    data: {
                        name: 'my_discount_widget',
                        type: 'app_hook',
                        position: 'discount',
                        text: "You've already used the discount",
                        click_hook: 'already_used',
                        icon: 'https://via.placeholder.com/50x50.png',
                    },
                },
            ];
        case 'add_payment':
            return [
                {
                    type: 'ADD_PAYMENT',
                    data: {
                        currency: req.body.order.currency,
                        value: req.body.order.order_total,
                        line_text: 'Payment via honor system',
                        gateway_name: 'Honor System',
                    },
                },
            ];
        default:
            return [];
    }
}

module.exports = app;
