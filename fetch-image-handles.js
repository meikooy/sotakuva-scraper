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

function getImagesFromIndex(era, from) {
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

            images.forEach(i => {
                const imageProps = {sa_id: i.sa_id, era: i.era};
                Image.count({sa_id: i.sa_id}, (err, count) => {
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

getImagesFromIndex(1, 1);
getImagesFromIndex(2, 1);
getImagesFromIndex(3, 1);
