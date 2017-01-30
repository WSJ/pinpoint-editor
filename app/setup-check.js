module.exports = function( callback ){
    var fs = require('fs');
    var configStr = fs.readFileSync('config.json', 'utf8');
    if (!testJSON(configStr)) {
        throw('Error: config.json is missing or invalid.');
    }

    var config = JSON.parse(configStr);

    if (
        (config.googleMapsAPIKey === 'REPLACE WITH API KEY') ||
        (config.googleMapsAPIKey === undefined)
    ) {
        throw('Error: You need to add a Google Maps API key to config.json');
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
