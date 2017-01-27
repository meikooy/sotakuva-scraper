"use strict"


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const _         = require('lodash');
const express   = require('express');
const fs        = require('fs');
const request   = require('request');
const cheerio   = require('cheerio');
const utf8      = require('utf8');
const algoliasearch = require('algoliasearch');
const Image     = require('./api.js').Image;


const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_APIKEY);
const photosIndex = client.initIndex(process.env.ALGOLIA_INDEX_PHOTOS);


var total = 1;

function getImagesFromIndex(era, from) {
    const baseUrl = 'http://sa-kuva.fi/neo?tem=webneo_dynlist_fin_saint&startdate=19000101&enddate=20000101&xsearch_content=&withoutdate=1&view_name=SA_archiveX&publication=&verification=7aa7d22810600c57792a12b661bdefc8&from=';
    const url = baseUrl + from;

    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var images = [];


            $('.lightdesk_image').each(function() {
                var image = {};

                // Parse document id
                image.objectID = $(this).find('img').first().attr('onclick').match('doc_id=(.*?)&')[1];
                image.era = era;

                images.push(image);
            });

            images.map(i => {
                const imageProps = {sa_id: i.objectID, era: i.era};
                Image.count(imageProps, count => {
                    if (count > 0) {
                        return null;
                    }
                    return new Image(imageProps)
                        .save();
                });
            });

            total += images.length;
            console.log(`${total} found`);
            if (images.length > 0) getImagesFromIndex(era, total);
            else {
                console.log(html);
            }
        }
        else {
            console.log(error);
        }
    });
}

function updateDefailsForImage(image) {
    return new Promise((resolve, reject) => {
        const url = `http://sa-kuva.fi/neo?tem=webneo_image_large&lang=FIN&imgid=${image.objectID}&docid=7aa7d227662a431eb51932d3aeaa64e7;&ddocid=7aa7d227662a431eb51932d3aeaa64e7&archive=`;
        request(url, function(error, response, html) {
            if (!error) {
                var $ = cheerio.load(html);

                image.name = $('input[name="name"]').val() || '';
                image.photographer = $('input[name="photographer"]').val() || '';
                image.photoplace = $('input[name="photoplace"]').val() || '';
                image.photoplace = $('input[name="photoplace"]').val() || '';
                image.source = $('input[name="source"]').val() || '';
                image.caption = $('input[name="caption"]').val() || '';
                image.description = $('input[name="description"]').val() || '';

                image.src_original = `http://sa-kuva.fi/neo2?tem=webneo_image_download&lang=FIN&id=${image.objectID}&archive=&name=${image.name}`;

                const previewUrl = `http://sa-kuva.fi/neo?tem=webneo_image_preview_max&lang=FIN&doc_id=${image.objectID}&archive=&zoom=YES`;
                request(previewUrl, function(error, response, html) {

                    if (!error) {
                        var $ = cheerio.load(html);
                        image.src_thumb = `http://sa-kuva.fi${$('img').first().attr('src')}`;

                        resolve(image);
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

getImagesFromIndex(1, 1);
getImagesFromIndex(2, 1);
getImagesFromIndex(3, 1);
