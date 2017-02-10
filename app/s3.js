var knox       = require('knox');

if (process.env.AWS_S3_KEY) {
    var s3 = knox.createClient({
        key: process.env.AWS_S3_KEY,
        secret: process.env.AWS_S3_SECRET,
        bucket: process.env.AWS_BUCKET
    });
}

var upload = (slug, json) => {
	
	var string = JSON.stringify(json);
    
    return new Promise((res, rej) => {
        
    	var publish   = s3.put(file, {
    	    'Content-Length': Buffer.byteLength(string),
    		'Content-Type': 'application/json',
    		'x-amz-acl': 'public-read'
    	});

    	publish.on('response', function(response){
    		if (200 == response.statusCode) {
    			res();
    		} else {
    			rej();
    		}
    	});

    	publish.end(string);
    
    });
    
}

var remove = (slug) => {

    var path = location + '/locator-maps/' + slug + '.json';
    
    return new Promise((res, rej) => {
        s3.del(path)
        	.on('response', function(){
        		res();
        	}).end();    
    });

}

var enabled = () => (!!process.env.AWS_S3_KEY);


module.exports = { upload: upload, remove: remove, enabled: enabled };