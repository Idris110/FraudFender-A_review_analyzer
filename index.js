const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');
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
    // const finalTitle = title.toLocaleLowerCase().replace(/\(/g,"").replace(/\)/g,"").replace(/ /gi, '-').replace(/\//gi, '-').replace(/\+/gi, '-').replace(/-\|-/gi, '-').replace(/ \| /gi, '-').replace(/\./gi, '-').replace(/[,\/#!$%\^&\*;:{}=\_`~()]/g,"").replace(/\-\-\-/gi, '-');

    return fetchData(url.split("/")[5]);
}

async function fetchData(finalTitle) {
    console.log("Fetching fakeSpot .....")
    console.log("Title amz :", finalTitle);
    let response = await axios.request({
        method: "GET",
        url: `https://reviewmeta.com/amazon-in/${finalTitle}`,
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

    let $ = cheerio.load(response.data);
    // $('lol').replaceWith(`<span>${date}</span>`)
    // console.log($('img[src^="https://i.fakespot.io/assets/"]'));
    // console.log($('.icon-image'));

    // $('title').replaceWith('<title>FraudFender | Fake Review Analyzer</title>');
    // $('.desktop-header-left').replaceWith('<span></span>');
    // $('.icon-image').replaceWith('<img class="icon-image" alt="Fakespot Header Logo" data-step="5"src="https://i.imgur.com/tJ6HCDb.png" />');
    // $('.show-vote-share-links').replaceWith('<span></span>');
    // $('.pros-and-cons-arrow').replaceWith('<span></span>');
    // $('#pros-and-cons-vote-section').replaceWith('<span></span>');
    // $('.footer-extended').replaceWith('<span></span>');
    // $('.fs-footer-extended').replaceWith('<span></span>');
    // $('.beta-badge').replaceWith('<span></span>');
    // $('.reviews').replaceWith('<span></span>');
    // $('.grade-explanation').replaceWith('<span></span>');
    // $('.reanalyze-row').replaceWith('<span></span>');
    // // if($('.rating-reanalyze-block').html() === "Fakespot Adjusted Rating"){
    // //     $('.rating-name').html("Our Adjusted")
    // // }
    // $('.review-grad').replaceWith('<p class="review-grad text-uppercase">FraudFender review grade</p>');
    // $('.rating-name').replaceWith('<span class="rating-name">Adjusted Rating</span>');
    // $('g').replaceWith('<span></span>');
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

app.get('/testing', function (req, res) {
    let $ = cheerio.load(fs.readFileSync('savingResponse.html',
        { encoding: 'utf8', flag: 'r' }));
    
    
    let data = {};

    data.prodName = $('#product_name').find('span').text();
    data.totRev = $('fieldset').find('b').map(function () {
        return $(this).text().trim();
    }).toArray()[0];
    data.adjRev = $('fieldset').find('b').map(function () {
        return $(this).text().trim();
    }).toArray()[1];
    data.orgRat = $('fieldset').find('.orig-rating-dim').text();
    data.adjRat = $('fieldset').find('#adjusted-rating-large').text();
    data.img = $('#product_image').find('img').attr('src');


    let trusted = {};
    trusted.title = "Most Trusted Reviews";
    trusted.rating = $('#good-reviews').find("#sample_reviews").find(".bw-rating").first().text().replace(/\t/g, '').replace(/\n/g, '');
    trusted.review = $('#good-reviews').find(".show-actual-review").first().text().replace(/\t/g, '').replace(/\n/g, '').slice(0, -20);
    trusted.showMore = $('#good-reviews').find("a").first().attr('href');
    data.trusted = trusted;

    let ltrusted = {};
    ltrusted.title = "Least Trusted Reviews";
    ltrusted.rating = $('#bad-reviews').find("#sample_reviews").find(".bw-rating").first().text().replace(/\t/g, '').replace(/\n/g, '');
    ltrusted.review = $('#bad-reviews').find(".show-actual-review").first().text().replace(/\t/g, '').replace(/\n/g, '').slice(0, -20);
    ltrusted.showMore = $('#bad-reviews').find("a").first().attr('href');
    data.leastTrusted = ltrusted;

    
    let unvPur = {}
    unvPur.title = "Unverified Purchases";
    unvPur.perc = $('#details-vp').find(".pct-percent").text();
    unvPur.num = $('#details-vp').find(".col-md-6").find('b').first().text();
    // unvPur.num = parseInt(data.totRev.replace(/\,/g, ''))*parseInt()
    unvPur.ratings = $('#details-vp').find(".col-md-6").find("label").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    data.unveriPurchase = unvPur;

    let sus = {}
    sus.title = "Suspicious Reviewers";
    sus.perc = $('#details-su').find(".pct-percent").text();
    sus.ratings = $('#details-su').find(".col-md-6").find("label").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    data.sus = sus;

    let trend = {}
    trend.title = "Rating Trend";
    trend.perc = $('#details-rt').find(".pct-percent").text();
    data.trend = trend;

    let rep = {}
    rep.title = "Phrase Repetition";
    rep.perc = $('#details-pr').find(".pct-percent").text();
    rep.ratings = $('#details-pr').find(".col-md-6").find("label").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    inReviewArr = $('.text_analysis_show').find("b").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    rep.inReview = [];
    for (let i = 0; i < inReviewArr.length; i = i + 2) {
        rep.inReview.push({ text: inReviewArr[i], perc: inReviewArr[i + 1] })
    }

    inTitleArr = $('.title_analysis_show').find("b").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    rep.inTitles = [];
    for (let i = 0; i < inTitleArr.length; i = i + 2) {
        rep.inTitles.push({ text: inTitleArr[i], perc: inTitleArr[i + 1] })
    }

    data.phaseRep = rep;

    let wc = {}
    wc.title = "Overrepresented Word Count";
    wc.perc = $('#details-wc').find(".pct-percent").text();
    data.wordCount = wc;

    let lapping = {}
    lapping.title = "Overlapping Review History";
    lapping.perc = $('#details-rh').find(".pct-percent").text();
    lapping.ratings = $('#details-rh').find(".col-md-6").find("label").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    data.overl = lapping;

    let del = {}
    wc.title = "Deleted Reviews";
    wc.perc = $('#details-dl').find(".pct-percent").text();
    data.del = wc;

    res.send(data);
});

app.post('/analysis', function (req, res) {
    // console.log(req.body.amzUrl);
    // res.send("recieved your request!");
    fetchTitle(req.body.amzUrl).then((html) => {

        if (html === null) res.sendFile(path.join(__dirname, '/scrappedMobile.html'));
        else res.send(html);
        // fs.writeFileSync('scrappedMobile.html', html);
        // res.send("hello");
    })
});

app.listen(port);
// console.log('Server started at http://localhost:' + port);

