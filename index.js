const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser');
var cors = require("cors");

const port = process.env.PORT || 8080;
const app = express();
const corsOpts = {
    origin: '*',
  
    methods: [
      'GET',
      'POST',
    ],
  
    allowedHeaders: [
      'Content-Type',
    ],
  };
  
  app.use(cors(corsOpts));
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
    
    trusted.rating = $('#good-reviews').find("#sample_reviews").find(".bw-rating").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    // .first().text().replace(/\t/g, '').replace(/\n/g, '');
    trusted.review = $('#good-reviews').find(".show-actual-review").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').slice(0, -20);
    }).toArray();
    // .first().text().replace(/\t/g, '').replace(/\n/g, '').slice(0, -20);
    
    trusted.showMore = $('#good-reviews').find(".show-actual-review").find("a").map(function () {
        return $(this).attr('href');
    }).toArray();

    let mostTrusted = {};
    mostTrusted.title = "Most Trusted Reviews";
    let reviews = [];
    for(let i=0; i<5; i++){
        reviews.push({
            rating: trusted.rating[i],
            review: trusted.review[i],
            showMore: trusted.showMore[i],
        })
    }
    mostTrusted.reviews = reviews;
    data.trusted = mostTrusted;

    let ltrusted = {};
    ltrusted.rating = $('#bad-reviews').find("#sample_reviews").find(".bw-rating").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();
    ltrusted.review = $('#bad-reviews').find(".show-actual-review").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').slice(0, -20);
    }).toArray();
    ltrusted.showMore = $('#bad-reviews').find(".show-actual-review").find("a").map(function () {
        return $(this).attr('href');
    }).toArray();
    
    let leastTrusted = {};
    leastTrusted.title = "Least Trusted Reviews";
    let lreviews = [];
    for(let i=0; i<5; i++){
        lreviews.push({
            rating: ltrusted.rating[i],
            review: ltrusted.review[i],
            showMore: ltrusted.showMore[i],
        })
    }
    leastTrusted.reviews = lreviews;
    data.leastTrusted = leastTrusted;

    
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
    sus.perc = $('#details-su').find(".pct-percent").first().text();
    sus_ratings = $('#details-su').find(".col-md-6").find("label").map(function () {
        return $(this).text().replace(/\t/g, '').replace(/\n/g, '').trim();
    }).toArray();

    sus.ratings = (sus_ratings.length >= 2) ? [sus_ratings[0], sus_ratings[1]] : [];
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
    del.title = "Deleted Reviews";
    del.num = $('#details-dl').find(".pct-percent").text();
    data.deleted = del;

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
    // let $ = cheerio.load(fs.readFileSync('savingResponse.html',
    //     { encoding: 'utf8', flag: 'r' }));


    res.send({"prodName":"Samsung Galaxy M14 5G (Smoky Teal, 6GB, 128GB Storage) | 50MP Triple Cam | 6000 mAh Battery | 5nm...","totRev":"8,771","adjRev":"3,573","orgRat":"4.0","adjRat":"4.0","fakeReviews":"59.26%","img":"https://m.media-amazon.com/images/I/41hsEMLKl9L.jpg","amazon":{"price":"11,490","url":"https://www.amazon.in/Samsung-Segments-Smartphone-Octa-Core-Processor/dp/B0BZCSSNV7/ref=sr_1_6?dib=eyJ2IjoiMSJ9.0zBfQh4HE2AaIW8Aem0SIpLDpWzRZCV71po2WfJGf0uvysqzAdmAmSeMyCd8iMaDM3s23DhEnTjR9GXRoAlZq5w_SAOXfRAAXzSwRsot1x8k2_V3_o1t1MwuhFZR7oJcyv_fmgSJYzhMhe1kBXTyOPK380GXx-rlmDPujg7kf9rA3Hw2hMLi9ky3IF6ZyIVlBdmLtQWGpBcD4OOw7LPeyVUSNbw7Tl_4vGDX5Xc6rpoebuc6S54cojdZq1rwe7wGfywaguzIW1yJcYr-kAobjsGBdw-9Hi7qmp3-Mt_dny8.sS03LPZz8tOT5gKqErnHtgwLYeoTlE_Be2hUU7XlZaM&dib_tag=se&keywords=mobile&qid=1708406911&s=electronics&sr=1-6&th=1","rating":{"one":"10%","two":"3%","three":"9%","four":"27%","five":"50%"}},"trusted":{"title":"Most Trusted Reviews","reviews":[{"rating":"4/5","review":"Pros:1. Display(although tft but can beat any good quality ips)2. ...","showMore":"https://www.amazon.in/gp/customer-reviews/RLJH3PMGBNUP8?tag=reviewmeta0b-20"},{"rating":"1/5","review":"Honesty writing reeview, Stay away from this phone1 Network disable ...","showMore":"https://www.amazon.in/gp/customer-reviews/R2VCZVEFJVTH8A?tag=reviewmeta0b-20"},{"rating":"5/5","review":"The phone is very good, the phone's battery is very ...","showMore":"https://www.amazon.in/gp/customer-reviews/R833LT56VISW2?tag=reviewmeta0b-20"},{"rating":"1/5","review":"Do not buy, very slow too much hang.throw in dustbin ...","showMore":"https://www.amazon.in/gp/customer-reviews/R3FZ2YQ52RJ4QN?tag=reviewmeta0b-20"},{"rating":"5/5","review":"Gifted this samsung m13 for my dad as his birthday ...","showMore":"https://www.amazon.in/gp/customer-reviews/RVD2CVWN3CD8Q?tag=reviewmeta0b-20"}]},"leastTrusted":{"title":"Least Trusted Reviews","reviews":[{"rating":"1/5","review":"What's this? Phone comes without charger. Dont buy it please. ...","showMore":"https://www.amazon.in/gp/customer-reviews/R33WU0IB4OXQHV?tag=reviewmeta0b-20"},{"rating":"1/5","review":"While calling net will not work replacement not give fake ...","showMore":"https://www.amazon.in/gp/customer-reviews/R33WU0IB4OXQHV?tag=reviewmeta0b-20"},{"rating":"4/5","review":"Phone is nice. But it becomes hot very fast","showMore":"https://reviewmeta.com/profile/amazon-in/AE7XWFW7ALG4MQEHZ2SVSKK6PZTA?tag=reviewmeta0b-20"},{"rating":"3/5","review":"Scrolling issue","showMore":"https://www.amazon.in/gp/customer-reviews/R3M9H25JDHUZRH?tag=reviewmeta0b-20"},{"rating":"4/5","review":"Best phone and value for money. Performance of phone is ...","showMore":"https://www.amazon.in/gp/customer-reviews/R3M9H25JDHUZRH?tag=reviewmeta0b-20"}]},"unveriPurchase":{"title":"Unverified Purchases","perc":"1%","num":"127","ratings":["1.0/5","4.0/5"]},"sus":{"title":"Suspicious Reviewers","perc":"~60%","ratings":["3.5/5","4.1/5"]},"trend":{"title":"Rating Trend","perc":"~35%"},"phaseRep":{"title":"Phrase Repetition","perc":">90%","ratings":["3.7/5","4.0/5"],"inReview":[],"inTitles":[{"text":"4.0 out of 5 stars","perc":"~44% of reviews"},{"text":"5.0 out of 5 stars","perc":"~30% of reviews"},{"text":"1.0 out of 5 stars","perc":"~15% of reviews"}]},"wordCount":{"title":"Overrepresented Word Count","perc":"<10%"},"overl":{"title":"Overlapping Review History","perc":"<10%","ratings":[]},"deleted":{"title":"Deleted Reviews","num":"0"}});
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

