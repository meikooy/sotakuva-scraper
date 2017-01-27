if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const algoliasearch = require('algoliasearch');
const Image = require('./api.js').Image;
const _ = require('lodash');

const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_APIKEY);
const imagesIndex = client.initIndex(process.env.ALGOLIA_INDEX_IMAGES);


const WAIT_TIME = process.env.ALGOLIA_INDEX_WAIT || 10000;

function indexImagesToAlgolia(limit) {
	return new Promise((resolve, reject) => {
		const where = {
			indexed_to_algolia: {
				$ne: true
			},
			details_fetched: {
				$eq: true
			}
		};

		const options = {
			limit
		};

		const query = Image.find(where, null, options, (err, images) => {
			console.log(`Found ${images.length} images.`);

			imagesIndex.addObjects(images, (err, content) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                	const operations = [];
                	_.forEach(images, image => {
                		image.indexed_to_algolia = true;
                		operations.push(image.save());
                	});

                	Promise.all(operations).then(ok => {
                		resolve(ok);
                	}, err => {
                		reject(err);
                	});
                }
            });
		});
	});
}


function run() {

	const limit = 100;
	indexImagesToAlgolia(limit).then(
		operations => {
			setTimeout(run, WAIT_TIME);
		},
		errors => {
			console.log(errors);
		}
	);

}


run();