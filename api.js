const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

const Image = mongoose.model('Image', {
    'sa_id':            String,
    'title':            String,
    'caption':          String,
    'description':      String,
    'author':           String,
    'place':            String,
    'source':           String,
    'thumbnail_url':    String,
    'image_url':        String,
    'era':              String,
    'date':             Date
});

module.exports.Image = Image;