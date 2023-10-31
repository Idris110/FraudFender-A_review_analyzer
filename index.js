const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const express = require('express');
const path = require('path');
const { log } = require('console');

const app = express();
const port = process.env.PORT || 8080;

const url = "https://www.fakespot.com/product/oneplus-11r-5g-galactic-silver-8gb-ram-128gb-storage-get-buds-z2-at-no-extra-cost";

const inp = 'Amazon Basics Bluetooth 5.0 Truly Wireless in Ear Earbuds, Up to 38 Hours Playtime, IPX-5 Rated, Type-C Charging Case, Touch Controls, Voice Assistant, Optional Single Side Use for Phone Calls, Blue'

const prodName = inp.toLocaleLowerCase().replace(/ /gi, '-').replace(/,/gi, '').replace(/\./gi, '-')
console.log(prodName);

async function fetchData(url) {
    console.log("Crawling data...")
    // make http call to url
    let response = await axios.request({
        method: "GET",
        url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
    }).catch((err) => console.log(err));

    if (response.status !== 200) {
        console.log("Error occurred while fetching data");
        return;
    }

    let $ = cheerio.load(response.data)
    // $('lol').replaceWith(`<span>${date}</span>`)
    // console.log($('img[src^="https://i.fakespot.io/assets/"]'));
    // console.log($('.icon-image'));
    $('title').replaceWith('<title>FraudFender | Fake Review Analyzer</title>');
    $('.desktop-header-left').replaceWith('<span></span>');
    $('.icon-image').replaceWith('<img class="icon-image" alt="Fakespot Header Logo" data-step="5"src="https://i.imgur.com/JmHzOS9.png" />');
    $('.show-vote-share-links').replaceWith('<span></span>');
    $('.pros-and-cons-arrow').replaceWith('<span></span>');
    $('#pros-and-cons-vote-section').replaceWith('<span></span>');
    $('.footer-extended').replaceWith('<span></span>');
    $('.fs-footer-extended').replaceWith('<span></span>');
    $('g').replaceWith('<span></span>');
    return $.html();
}

// fetchData(url).then((html) => {
//     // console.log(html);
//     fs.writeFileSync('testing.html', html);
//     // res.send(html);
// })

app.get('/', function (req, res) {
    fetchData(url).then((html) => {
        // console.log(html);
        // fs.writeFileSync('testing.html', html);
        res.send(html);
    })
});

// fetchData(url).then((res) => {
//     const html = res.data;
//     // console.log(html);
//     fs.writeFileSync('scrapped.html', html);
// })

// async function fetchData(url) {
//     console.log("Crawling data...")
//     // make http call to url
//     let response = await axios(url).catch((err) => console.log(err));

//     if (response.status !== 200) {
//         console.log("Error occurred while fetching data");
//         return;
//     }
//     return response;
// }

// sendFile will go here
// app.get('/', function (req, res) {
//     res.sendFile(path.join(__dirname, '/scrapped.html'));
// });



app.listen(port);
console.log('Server started at http://localhost:' + port);


//amazon-basics-bluetooth-5.0-truly-wireless-in-ear-earbuds-up-to-38-hours-playtime-ipx-5-rated-type-c-charging-case-touch-controls-voice-assistant-optional-single-side-use-for-phone-calls-blue
// amazon-basics-bluetooth-5-0-truly-wireless-in-ear-earbuds-up-to-38-hours-playtime-ipx-5-rated-type-c-charging-case-touch-controls-voice-assistant-optional-single-side-use-for-phone-calls-blue