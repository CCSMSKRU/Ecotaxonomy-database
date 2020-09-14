//var host = 'http://192.168.1.190';
var host = 'http://localhost:8080';
var login = 'UNSECURE_API';
var password = '123';

var url = '/api';

if (!location.origin.match(/localhost/)) {
    host = location.origin;
}



