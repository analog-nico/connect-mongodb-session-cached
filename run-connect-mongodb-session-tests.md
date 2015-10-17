# How to run the tests of connect-mongodb-session for connect-mongodb-session-cached

connect-mongodb-session-cached aims to be a drop-in replacement for connect-mongodb-session. Therefore all tests for connect-mongodb-session should also be green when executed against connect-mongodb-session-cached.

This is how to run the tests:

1. Create a temporary folder.
2. Clone [connect-mongodb-session](https://github.com/mongodb-js/connect-mongodb-session) into the temporary folder and run `npm install` and `sh ./setup-tests.sh`.
3. Clone [connect-mongodb-session-cached](https://github.com/analog-nico/connect-mongodb-session-cached) into the temporary folder and run `npm install`.
4. Rename temp/connect-mongodb-session/index.js to temp/request/index-orig.js.
5. Create temp/connect-mongodb-session/index.js with the following content:

``` js
module.exports = require('../connect-mongodb-session-cached');
```

6. Go to temp/connect-mongodb-session-cached/lib/index.js
7. Comment out the `var mongoDBStoreFactory = require('connect-mongodb-session');` line.
8. Add `var mongoDBStoreFactory = require('../../connect-mongodb-session/index-orig.js');` right below.
9. Go to temp/connect-mongodb-session-cached/ and run `npm test`.
