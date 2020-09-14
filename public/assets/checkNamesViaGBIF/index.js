let http = require('http');
let fs = require('fs');
let path = require('path');


//const hostname = 'v1.alcora.ru';
const hostname = 'localhost';
const port = 8888;

http.createServer(function (request, response) {
	let filePath = '.' + request.url;
	if (filePath == './')
		filePath = './index.html';

	let extname = String(path.extname(filePath)).toLowerCase();
	let contentType = 'text/html';
	let mimeTypes = {
		'.html': 'text/html',
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpg',
		'.gif': 'image/gif',
		'.wav': 'audio/wav',
		'.mp4': 'video/mp4',
		'.woff': 'application/font-woff',
		'.ttf': 'application/font-ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.otf': 'application/font-otf',
		'.svg': 'application/image/svg+xml'
	};

	contentType = mimeTypes[extname] || 'application/octet-stream';

	fs.readFile(filePath, function (error, content) {
		if (error) {
			if (error.code == 'ENOENT') {
				fs.readFile('./404.html', function (error, content) {
					response.writeHead(200, {'Content-Type': contentType});
					response.end(content, 'utf-8');
				});
			}
			else {
				response.writeHead(500);
				response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
				response.end();
			}
		}
		else {
			response.writeHead(200, {'Content-Type': contentType});
			response.end(content, 'utf-8');
		}
	});

}).listen(port, hostname);

console.log(`Server running at http://${hostname}:${port}/`);