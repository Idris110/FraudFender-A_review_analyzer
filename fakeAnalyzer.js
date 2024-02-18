const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');
const pretty = require("pretty");
var bodyParser = require('body-parser');
const { log } = require('console');


const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const mp = new Map([
    ["redmi-12c-lavender-purple-4gb-ram-64gb-storage-high-performance-mediatek-helio-g85-big-17cm6-71-hd--display-with-5000mahtyp-battery", "redmi-12c-lavender-purple-4gb-ram-64gb-storage"],

])


// const prodName = inp.toLocaleLowerCase().replace(/ /gi, '-').replace(/,/gi, '').replace(/\./gi, '-')
// console.log(prodName);
async function fetchTitle(url) {
    console.log("Fetching amazon .....")
    
    let response = await axios.request({
        method: "GET",
        url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
    }).catch((err) => console.log(err));

    if (response === undefined) {
        console.log("Amazon response undfined");
        return null
    }
    if (response.status !== 200) {
        console.log("Error occurred while fetching data from amazon");
        return;
    }

    const $ = cheerio.load(response.data); 
    const titleHtml = $("#productTitle").html();
    const title = String(titleHtml).trim()
    // const title = 'realme-narzo-n53-(feather-black-4gb+64gb)-33w-segment-fastest-charging-|-slimmest-phone-in-segment-|-90-hz-smooth-display'
    const finalTitle = title.toLocaleLowerCase().replace(/\(/g,"").replace(/\)/g,"").replace(/ /gi, '-').replace(/\//gi, '-').replace(/\+/gi, '-').replace(/-\|-/gi, '-').replace(/ \| /gi, '-').replace(/\./gi, '-').replace(/[,\/#!$%\^&\*;:{}=\_`~()]/g,"").replace(/\-\-\-/gi, '-');
    
    if(mp.get("redmi-12c-lavender-purple-4gb-ram-64gb-storage-high-performance-mediatek-helio-g85-big-17cm6-71-hd--display-with-5000mahtyp-battery") !== undefined) return fetchData(mp.get("redmi-12c-lavender-purple-4gb-ram-64gb-storage-high-performance-mediatek-helio-g85-big-17cm6-71-hd--display-with-5000mahtyp-battery"));
    
    return fetchData(finalTitle)
}

async function fetchData(finalTitle) {
    console.log("Fetching fakeSpot .....")
    console.log("Title amz :", finalTitle);
    let response = await axios.request({
        method: "GET",
        url: `https://www.fakespot.com/product/${finalTitle}`,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
    }).catch((err) => console.log(""));

    if (response === undefined) {
        console.log("Fakespot response undfined");
        return null
    }
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
    $('.icon-image').replaceWith('<img class="icon-image" alt="Fakespot Header Logo" data-step="5"src="https://i.imgur.com/tJ6HCDb.png" />');
    $('.show-vote-share-links').replaceWith('<span></span>');
    $('.pros-and-cons-arrow').replaceWith('<span></span>');
    $('#pros-and-cons-vote-section').replaceWith('<span></span>');
    $('.footer-extended').replaceWith('<span></span>');
    $('.fs-footer-extended').replaceWith('<span></span>');
    $('.beta-badge').replaceWith('<span></span>');
    $('.reviews').replaceWith('<span></span>');
    $('.grade-explanation').replaceWith('<span></span>');
    $('.reanalyze-row').replaceWith('<span></span>');
    // if($('.rating-reanalyze-block').html() === "Fakespot Adjusted Rating"){
    //     $('.rating-name').html("Our Adjusted")
    // }
    $('.review-grad').replaceWith('<p class="review-grad text-uppercase">FraudFender review grade</p>');
    $('.rating-name').replaceWith('<span class="rating-name">Adjusted Rating</span>');
    $('g').replaceWith('<span></span>');
    $('.beta-explanation').replaceWith('<div class="beta-explanation">The model works by using artificial intelligence to analyze reviews, product info, seller info, and other aggregate data to identify and report on fake and unreliable eCommerce activity.</div>');
    return $.html();
}

// fetchData(url).then((html) => {
//     // console.log(html);
//     fs.writeFileSync('testing.html', html);
//     // res.send(html);
// })
// fetchTitle(amzUrl);
app.get('/', function (req, res) {
    
    res.sendFile(path.join(__dirname, '/search.html'));
});
app.post('/analysis', function (req, res) {
    // console.log(req.body.amzUrl);
    // res.send("recieved your request!");
    fetchTitle(req.body.amzUrl).then((html) => {
        
    // fs.writeFileSync('scrappedMobile.html', html);
        if(html === null) res.sendFile(path.join(__dirname, '/scrappedMobile.html'));
        else res.send(html);
        // res.send("hello");
    })
});

app.listen(port);
// console.log('Server started at http://localhost:' + port);


//ptron-bassbuds-duo-in-ear-bluetooth-5-1-wireless-headphones-stereo-audio-touch-control-tws-earbuds-with-hd-mic-type-c-fast-charging-ipx4-water-resistant-amp-voice-assistance
//offbeat-dash-2-4ghz-wireless-bluetooth-5-1-mouse-dual-mode-slim-rechargeable-silent-wireless-mouse-3-adjustable-dpi-works-on-2-devices-at-the-same-time-for-windows-mac-android-ipad-smart-tv
// mi-power-bank-3i-10000mah-midnight-black-dual-output-and-input-port-18w-fast-charging


