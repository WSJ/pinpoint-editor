module.exports = function( callback ){
    var fs = require('fs');
    var config = fs.readFileSync('config.json', 'utf8');
    if (!testJSON(config)) {
        throw('Error: config.json is missing or invalid.');
    }

    var indexFile = fs.readFileSync('public/index.html', 'utf8');
    if (indexFile.indexOf('key=YOUR_API_KEY_HERE') > -1) {
        throw('Error: You need to add a Google Maps API key to index.html');
    }
    
    if (!process.env.DATABASE_URL) {
        throw('Error: Database URL environment variable ("DATABASE_URL") is not set.')
    }
        
    callback();
    
    function testJSON(str){
        try {
            JSON.parse(str);
        } catch (err) {
            return false;
        }
        return true;
    }
}
