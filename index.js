const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const path = require('path');
const pretty = require("pretty");
var bodyParser = require('body-parser')


const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const amzUrl = 'https://www.amazon.in/Redmi-Sea-Green-64GB-Storage/dp/B0C74PD9VG/ref=sr_1_8?_encoding=UTF8&content-id=amzn1.sym.c7b7e0c6-beee-42cc-9ecf-70b9561d7349&pd_rd_r=428774ed-a90c-4dc5-a3cd-2ec4663d1bc3&pd_rd_w=1B0ib&pd_rd_wg=wpo2T&pf_rd_p=c7b7e0c6-beee-42cc-9ecf-70b9561d7349&pf_rd_r=3S1N680NTYGB702YC5Y1&qid=1698818933&refinements=p_36%3A1318505031%2Cp_n_condition-type%3A8609960031&s=electronics&sr=1-8'
// const inp = 'Amazon Basics Bluetooth 5.0 Truly Wireless in Ear Earbuds, Up to 38 Hours Playtime, IPX-5 Rated, Type-C Charging Case, Touch Controls, Voice Assistant, Optional Single Side Use for Phone Calls, Blue'

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
    const finalTitle = title.toLocaleLowerCase().replace(/ /gi, '-').replace(/\+/gi, '-').replace(/-\|-/gi, '-').replace(/ \| /gi, '-').replace(/\./gi, '-').replace(/[,\/#!$%\^&\*;:{}=\_`~()]/g,"");
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
// fetchTitle(amzUrl);
app.get('/', function (req, res) {
    
    res.sendFile(path.join(__dirname, '/search.html'));
});
app.post('/analysis', function (req, res) {
    // console.log(req.body.amzUrl);
    // res.send("recieved your request!");
    fetchTitle(req.body.amzUrl).then((html) => {
        if(html === null) res.send("Not Found")
        else res.send(html);
        // res.send("hello");
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
// console.log('Server started at http://localhost:' + port);


//realme-narzo-n53-feather-black-4gb-64gb-33w-segment-fastest-charging-slimmest-phone-in-segment-90-hz-smooth-display
//realme-narzo-n53-feather-black-4gb+64gb-33w-segment-fastest-charging-slimmest-phone-in-segment-90-hz-smooth-display