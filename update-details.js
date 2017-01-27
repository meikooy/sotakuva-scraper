if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const request = require('request');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const Image = require('./api.js').Image;
const _ = require('lodash');

const WAIT_TIME = process.env.UPDATE_DETAILS_WAIT || 10000;

function updateDetailsForImage(image) {
	return new Promise((resolve, reject) => {
		const url = `http://sa-kuva.fi/neo?tem=webneo_image_large&lang=FIN&imgid=${image.sa_id}&docid=7aa7d227662a431eb51932d3aeaa64e7;&ddocid=7aa7d227662a431eb51932d3aeaa64e7&archive=`;
        request({url, encoding: null}, function(error, response, html) {
            if (!error) {
            	html = iconv.decode(new Buffer(html), 'ISO-8859-1');
            	
                var $ = cheerio.load(html);
                image.author = $('input[name="photographer"]').val() || '';
                image.place = $('input[name="photoplace"]').val() || '';
                image.source = $('input[name="source"]').val() || '';
                image.caption = $('textarea[name="caption"]').val() || '';
                image.description = $('textarea[name="description"]').val() || '';
                image.image_url = `http://sa-kuva.fi/neo2?tem=webneo_image_download&lang=FIN&id=${image.sa_id}&archive=&name=${image.title}`;

                const previewUrl = `http://sa-kuva.fi/neo?tem=webneo_image_preview_max&lang=FIN&doc_id=${image.sa_id}&archive=&zoom=YES`; 
                request(previewUrl, function(error, response, html) {
                    if (!error) {
                        var $ = cheerio.load(html);
                        image.thumbnail_url = `http://sa-kuva.fi${$('img').first().attr('src')}`;
                        image.details_fetched = true;
                        resolve(image.save());
                    }
                    else {
                        reject(error);
                    }
                });
            }
            else {
                reject(error);
            }
        });
	});
}


function updateImagesWithoutDetails(limit) {
	return new Promise((resolve, reject) => {
		var where = {
			details_fetched: {
				$ne: true
			}
		};

		const options = {
			limit
		};

		const query = Image.find(where, null, options, (err, images) => {
			console.log(`Found ${images.length} images.`);
			const operations = [];
			if (!err) {
				_.forEach(images, image => {
					operations.push(updateDetailsForImage(image));
				});
			}
			resolve(Promise.all(operations));
		});
	});
}


function run() {

	const limit = 50;
	updateImagesWithoutDetails(limit).then(
		operations => {
			setTimeout(run, WAIT_TIME);
		},
		errors => {
			console.log(errors);
		}
	);

}

run();