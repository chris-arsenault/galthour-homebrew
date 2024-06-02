const secret = "YourSecretHere"; //
const repo = "~/foundrydata/Data/assets/galthour-homebrew"; // replace with name of private repo

const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;

http.createServer(function (req, res) {
    console.log("Data Received");
    req.on('data', function(chunk) {
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');
        console.log(sig);
        console.log(req.headers['x-hub-signature']);

        if (req.headers['x-hub-signature'] === sig) {
            console.log("Updating Repo");
            exec('cd ' + repo + ' && git pull');
        }
    });

    res.writeHead(200);
    res.end("Request Complete");
}).listen(8085);