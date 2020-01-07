require('dotenv').config();
const app = require('./app');

app.listen(8000, () => {
    console.log('Example app listening on port 8000!');
});
