"use strict"


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const _         = require('lodash');
const express   = require('express');
const request   = require('request');
const cheerio   = require('cheerio');
const Image     = require('./api.js').Image;


var total = 1;
var skip = 0;

function getImagesFromIndex(era, from) {
    if (era > 3) {
        console.log('STOP');
        return;
    }

    const baseUrl = `http://sa-kuva.fi/neo?tem=webneo_dynlist_fin_saint&startdate=19000101&enddate=20000101&xsearch_content=&withoutdate=1&view_name=SA_archiveX&publication=${era}&verification=7aa7d22810600c57792a12b661bdefc8&from=`;
    const url = baseUrl + from;

    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var images = [];


            $('.lightdesk_image').each(function() {
                var image = {};

                // Parse document id
                image.sa_id = $(this).find('img').first().attr('onclick').match('doc_id=(.*?)&')[1];
                image.era = era;

                images.push(image);
            });

            Promise.all(images.map(i => {
                const imageProps = {sa_id: i.sa_id, era: i.era};

                if (total < skip) {
                    console.log('skipping...');
                    return Promise.resolve();
                }

                return new Promise((resolve, reject) => {
                    Image.count({sa_id: i.sa_id}, (err, count) => {
                        if (count > 0) {
                            return resolve();
                        }
                        return new Image(imageProps)
                            .save()
                            .then(_ => resolve())
                            .catch(_ => console.log);
                    });
                });
            }))
            .then(_ => {
                total += images.length;
                console.log(`${total} found`);
                if (images.length > 0) {
                    setTimeout(() => getImagesFromIndex(era, total), 50);
                }
                else {
                    console.log(html);
                    console.log('next era ' + (era + 1));
                    getImagesFromIndex(era + 1, 1);
                }
            })
            .catch(console.log);
        }
        else {
            console.log(error);
        }
    });
}

Image.count().then(
    c => {
        skip = c;
        console.log('Skipping ' + c);
        getImagesFromIndex(1, 1);
    }
);


