var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');
var sendMail = require('./libs/sendMail');
var moment = require('moment');
console.logPrototype = console.log;
var app = express();



setTimeout(function () {
    //var backgrounds = require('./modules/background_process');
},10000);
global.pool = require('./libs/mysqlConnect');
global.models = [];
global.classes = {};
global.classesCache = {};
global.requiredClasses = {};
global.downloads = {};

global.times = {
    start_system:moment(),
    log_time:0
};

process.on('exit', function(code) {
    console.log('process exit', code);
    pool.end(function(err){
        console.log('poolEnd');
        console.log(err);
    });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
var HttpError = require('./error').HttpError;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var osObj = require('os');
global.platform = osObj.platform();
require('dns').lookup(osObj.hostname(), function (err, add, fam) {
    console.log('addr: '+add);
});



var sessionStore = require('./libs/sessionStore');
app.use(session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

app.use(require('./middleware/sendHttpError'));
//app.use(require('./middleware/loadUser'));
app.use(require('./middleware/globalFuncs'));

require('./routes')(app);

/**/
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: function(res, path) {
        res.set({
            'Access-Control-Allow-Origin': '*'
        })
    }
}));
/*
app.use(express.static(path.join(__dirname, 'public'), {
    'Access-Control-Allow-Origin': '*'
}));
app.use(express.static(path.join(__dirname, 'public'), {
    'Access-Control-Allow-Origin': '*'
}));*/



/*** БЛОК ДЛЯ ТЕСТОВ ******/

/*var o = {
 command:"add",
 object:"action",
 params:{
 title:"TEST ACTION 1",
 description:"sdfds",
 cost:"1000",
 payment_type_id:10
 }
 };
 sendQuery(o,function(r){console.log(r);});*/

// var libreconv  = require('libreconv');
// var test = libreconv.convert('test/test1.xlsx','pdf');
// console.log(test);
//c:/LibreOffice5/program/soffice.exe --headless --convert-to pdf --outdir "/tmp/libreconv-25BIhT" "D:\NET\CCS.VG\test\test1.xlsx"



/*** КОНЕЦ БЛОК ДЛЯ ТЕСТОВ ******/


//app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    if (req.url.indexOf('default_picture.png') === -1 &&
        (req.url.toLowerCase().indexOf('.jpg') !== -1 || req.url.toLowerCase().indexOf('.jpeg') !== -1 || req.url.toLowerCase().indexOf('.png') !== -1 || req.url.toLowerCase().indexOf('.gif') !== -1)){
        var new_url = '/upload/default_picture.png';
        res.redirect(new_url);
        return;
    }
    var err = new Error('Страница не найдена');
    console.log(req, res);
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

}
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.stack);
    res.render('error', {
        message: err.message,
        error: err
    });
});



console.log('-------------------------------------------------');
console.log('SERVER STARTED');
// global.fullSyncBJ = !!config.get('fullSyncBJFlag');

// setTimeout(function () {
//     var api = require('./libs/api');
//     var User = require('./classes/User');
//     var async = require('async');
//     var moment =require('moment');
//     console.log('Запускаем фоновые задачи...');
//     var sys_user = new User({
//         name:'user'
//     });
//     async.series({
//         loadSysUser: function (cb) {
//             sys_user.loadSysUser(cb);
//         },
//         startBJ: function (cb) {
//             console.log('В startBJ');
//             cb(null, null);
//             setInterval(function () {
//                 var d1 = moment();
//                 console.log('global.fullSyncBJ',global.fullSyncBJ);
//                 if (!global.fullSyncBJ) return;
//                 console.log(moment().format('DD.MM.YYYY HH:mm:ss'),'FULLSYNC BACKGROUNDJOB STARTED ====>');
//                 var o = {
//                     command: 'fullSync',
//                     object: 'Sync_file',
//                     params: {
//                         client_object:'sys'
//                     }
//                 };
//                 api(o, function (err, res) {
//                     console.log('FULLSYNC BACKGROUNDJOB ====>');
//                     console.log('err', err);
//                     console.log('res', res);
//                     res.errors = res.errors || [];
//                     var diff = moment().diff(d1);
//                     if (diff > 5000 || res.errors.length || err){
//                         var subject = 'Синхронизация ' + moment().format('DD.MM.YYYY HH:mm') + ' Время: ' + diff;
//                         var html = 'Синхронизация прошла без глобальных ошибок\n RES:\n' + JSON.stringify(res);
//                         if (res.errors.length){
//                             html += '\n\nБыли не глобальные ошибки:\n' + JSON.stringify(res.errors);
//                         }
//                         if (err){
//                             subject = 'Ошибка. Синхронизация ' + moment().format('DD.MM.YYYY HH:mm') + ' Время: ' + diff;
//                             html = JSON.stringify(err);
//                         }
//                         var o = {
//                             email: 'ivantgco@gmail.com,insarov.ka@gmail.com',
//                             subject: subject,
//                             html: html
//                         };
//                         sendMail(o, function (err) {
//                             console.log(err);
//                             //  callback(err);
//                         });
//                     }
//                 },sys_user);
//             }, config.get('syncInterval') || 1200000);
//         }
//     }, function (err, res) {
//         console.log(err, res);
//     });
//
//
// },6000);
module.exports = app;


/*
 var moment = require('moment');
 var funcs = require('./libs/functions');
 var timeAgo = moment().diff(moment('2014-12-18'));
 var p = (timeAgo<=moment.duration(3, 'months'));
 console.log('timeAgo',timeAgo, p);*/

/*var m1 = moment();
 var m2 = moment.duration(2, 'years');
 console.log(moment(m1-m2).format('YYYY-MM-DD'));*/
/*
 var api = require('./libs/api');

 api('doSubscribe','action',{html:'<b>ТЕСТ РАСССЫЛКИ</b>'},function(err,result){
 console.log(err, result);
 });*/

/*var api = require('./libs/api');
 api('rePositionAll', 'results', {},function(err,result){
 if (err){
 console.log(err);
 }else{
 console.log(result);
 }
 });*/
/*var api = require('./libs/userApi');
 api('allActionLeaderBoard', 'results', {age:'40',gender_sys_name:'MALE'},function(err,result){
 if (err){
 console.log(err);
 }else{
 console.log(result);
 }
 });*/
/*var sendMail = require('./libs/sendMail');

 var o = {
 email: 'ivantgco@gmail.com',
 subject: 'ТЕСТ от рассылки',
 html: 'Вы успешно отписались от рассылки.'
 };
 sendMail(o, function (err) {
 console.log(err);
 //  callback(err);
 });*/

//git remote set-url origin https://github.com/alextgco/cfft
//git remote set-url origin ssh://cfft1@dotcloudapp.com/repository.git
//git commit -am 'note'
//dcapp cfft1/default push
//dcapp cfft1/default deploy

//mysql -u deptezf2upj -p deptezf2upj --host=173.194.241.167
// http://104.236.248.75:<app-port>

//TEST master
