require('dotenv').config();
const app = require('./app');
var port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Example app listening on port 8000!');
});
