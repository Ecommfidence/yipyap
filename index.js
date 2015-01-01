var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");
var port = 3006;
var username = 'anthro';
var password = 'anthro';

http.createServer(function (request, response) {

    var auth = request.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64
    //console.log("Authorization Header is: ", auth);

    if (!auth) {     // No Authorization header was passed in so it's the first time the browser hit us

        // Sending a 401 will require authentication, we need to send the 'WWW-Authenticate' to tell them the sort of authentication to use
        // Basic auth is quite literally the easiest and least secure, it simply gives back  base64( username + ":" + password ) from the browser
        response.statusCode = 401;
        response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

        response.end('<html><body>Credentials Please</body></html>');
    }

    else if (auth) {    // The Authorization was passed in so now we validate it
        var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

        var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
        var plain_auth = buf.toString();        // read it back out as a string

        //console.log("Decoded Authorization ", plain_auth);

        // At this point plain_auth = "username:password"

        var creds = plain_auth.split(':');      // split on a ':'
        var username1 = creds[0];
        var password1 = creds[1];

        if ((username1 == username) && (password1 == password)) {   // Is the username/password correct?

            var uri = url.parse(request.url).pathname
                , filename = path.join(process.cwd(), uri);

            var contentTypesByExtension = {
                '.html': "text/html",
                '.css': "text/css",
                '.js': "text/javascript"
            };

            fs.exists(filename, function (exists) {
                if (!exists) {
                    response.writeHead(404, {"Content-Type": "text/plain"});
                    response.write("404 Not Found\n");
                    response.end();
                    return;
                }

                if (fs.statSync(filename).isDirectory()) filename += '/index.html';

                fs.readFile(filename, "binary", function (err, file) {
                    if (err) {
                        response.writeHead(500, {"Content-Type": "text/plain"});
                        response.write(err + "\n");
                        response.end();
                        return;
                    }

                    var headers = {};
                    var contentType = contentTypesByExtension[path.extname(filename)];
                    if (contentType) headers["Content-Type"] = contentType;
                    response.writeHead(200, headers);
                    response.write(file, "binary");
                    response.end();
                });
            });
        }
        else {
            response.statusCode = 401; // Force them to retry authentication
            response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

            // res.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden

            response.end('<html><body>Authentication failed!</body></html>');
        }
    }

}).listen(parseInt(port));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");