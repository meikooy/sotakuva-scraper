const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;



const Image = mongoose.model('Image', {
    'indexed_to_algolia': Boolean,
    'details_fetched':   Boolean,
    'sa_id':            String,
    'caption':          String,
    'description':      String,
    'author':           String,
    'place':            String,
    'source':           String,
    'thumbnail_url':    String,
    'image_url':        String,
    'era':              Number,
    'era_title':        String,
    'date':             Date,
    'year':             Number,
    'month':            Number,
    'day':              Number,
});

module.exports.Image = Image;
