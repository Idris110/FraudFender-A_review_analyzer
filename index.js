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

async function fetchAmazon(url){
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
    let amzn = {};
    
    amzn.price = $('#corePriceDisplay_desktop_feature_div').find('.a-price-whole').text();
    amzn.url = url; 

    rate = {};
    ratings = $('#histogramTable').text();
    ratings = ratings.split('r');
    rate.one = ratings[5];
    rate.two = ratings[4].slice(0, -5);
    rate.three = ratings[3].slice(0, -5);
    rate.four = ratings[2].slice(0, -5);
    rate.five = ratings[1].slice(0, -5);
    // console.log(rate);
    amzn.rating = rate;

    return amzn;
}

async function fetchData(url) {
    const finalTitle = url.split("/")[5];
    console.log("Prod id :", finalTitle);
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
        
    let data = {};

    data.prodName = $('#product_name').find('span').text().replace(/\t/g, '').replace(/\n/g, '');
    data.totRev = $('fieldset').find('b').map(function () {
        return $(this).text().trim();
    }).toArray()[0];
    data.adjRev = $('fieldset').find('b').map(function () {
        return $(this).text().trim();
    }).toArray()[1];
    data.orgRat = $('fieldset').find('.orig-rating-dim').text();
    data.adjRat = $('fieldset').find('#adjusted-rating-large').text();
    data.fakeReviews = (100 - parseInt(data.adjRev.replace(/\,/g, ''))*100 / parseInt(data.totRev.replace(/\,/g, ''))).toFixed(2) + "%";
    data.img = $('#product_image').find('img').attr('src');
    
    
    data.amazon = await fetchAmazon(url); //fetch amazon

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
    wc.num = $('#details-dl').find(".pct-percent").text();
    data.del = del;

    return data;
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

app.get('/amzn', function (req, res) {
    fetchAmazon(
        "https://www.amazon.in/Samsung-25W-Travel-Adapter/dp/B08VFF6JQ8/ref=pd_sbs_d_sccl_5_3/260-7665289-0966040?pd_rd_w=PjqJ2&content-id=amzn1.sym.a9e12e68-4e49-43d0-a6b4-fd1619ccac52&pf_rd_p=a9e12e68-4e49-43d0-a6b4-fd1619ccac52&pf_rd_r=QFF7RDAKYX16GNADKMT4&pd_rd_wg=PyTaT&pd_rd_r=fe91aaa4-5f23-4abc-9698-f7c33fad539b&pd_rd_i=B08VFF6JQ8&psc=1"
    ).then((data) => {
        res.send(data);
        // fs.writeFileSync('scrappedMobile.html', html);
        // res.send("hello");
    })
});

app.get('/testing', function (req, res) {
    let $ = cheerio.load(fs.readFileSync('savingResponse.html',
        { encoding: 'utf8', flag: 'r' }));
    
    
    let data = {};

    data.prodName = $('#product_name').find('span').text().replace(/\t/g, '').replace(/\n/g, '');
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

app.post('/api', function (req, res) {
    // console.log(req.body.amzUrl);
    fetchData(req.body.amzUrl).then((data) => {
        res.send(data);
        // fs.writeFileSync('scrappedMobile.html', html);
        // res.send("hello");
    })
});

app.listen(port);
// console.log('Server started at http://localhost:' + port);

