var http = require('http')
    fs = require('fs'),
    path = require('path'),
    url = require('url');

var initialSetupMarkerFilePath = 'D:\\home\\site\\wwwroot\\.setup';
var fullSetupMarkerFilePath = 'D:\\home\\site\\wwwroot\\READY';
var templateProvisioningInProgress = 'D:\\home\\site\\wwwroot\\setup.html';

http.createServer(function (req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var storageAccountName = query.sn;
    var storageAccountKey = query.sk;

    function setupInitial(firstAttempt)
    {
        function end() {
            res.end(fs.readFileSync(path.join(__dirname, 'blankArmTemplate.json')));
        }

        if (!firstAttempt) {
            end();
            return;
        }

        var spawn = require("child_process").spawn;
        child = spawn("powershell.exe", [path.join(__dirname, 'setup.ps1'), '-storageAccountName', storageAccountName, '-storageAccountKey', storageAccountKey]);
        child.stdout.on("data",function(data) {
            console.log("Powershell Data: " + data);
        });
        child.stderr.on("data", function(data) {
            console.log("Powershell Errors: " + data);
        });
        child.on("exit",function() {
            res.writeHead(200, { 'Content-Type': 'text/html' });

            fs.writeFile(initialSetupMarkerFilePath, '', function(err) {
                if (err) {
                    res.end('ouch!'); // this would result in a deployment failure and should never happen.
                } else {
                    end();
                }
            });
        });
    }

    fs.readFile(initialSetupMarkerFilePath, function(err) {
        if (storageAccountName && storageAccountKey) {
            setupInitial(err);
        } else {
            fs.readFile(fullSetupMarkerFilePath, function(err) {
                if (err) {
                    fs.readFile('setup.html',function (err, data) {
                        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
                        res.write(data);
                        res.end();
                    });
                } else {
                    res.writeHead(302, {
                        'Location': '/'
                    });
                    res.end();
                }
            });
        }
    });
}).listen(process.env.PORT);
