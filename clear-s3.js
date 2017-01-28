if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const Image = require('./api.js').Image;

Image.update({s3_large_url: {$exists: true}}, {s3_large_url: null}, {multi: true}).then(console.log, console.log);
Image.update({s3_thumbnail_url: {$exists: true}}, {s3_thumbnail_url: null}, {multi: true}).then(console.log, console.log);