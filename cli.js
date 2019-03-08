#!/usr/bin/env node

'use strict';

/**
 * Config
 */
const URL = 'http://image.baidu.com/channel/listjson?pn=0&rn=30&tag1=%E7%BE%8E%E5%A5%B3&tag2=%E5%85%A8%E9%83%A8&ie=utf8'

/**
 * Dependencies
 */
var tempfile = require('tempfile');
var shuffle = require('array-shuffle');
var isIterm = require('is-iterm');
var spawn = require('cross-spawn-async');
var each = require('each-series');
var join = require('path').join;
var open = require('opn');
var got = require('got');
var fs = require('fs');
var clear = require('clear')

var imgcat = join(__dirname, 'node_modules', '.bin', 'imgcat');


/**
 * npm install + gifs
 */

var args = process.argv.slice(2);
let ts = Date.now()
var ps = npm(args);
var gif;

if (isInstall(args)) {
	findImages()
		.then(displayImages)
		.catch(errorHandler);

	ps.on('exit', function (code) {
		if (gif) {
			gif.kill();
		}

		process.exit(code);
	});
}

function isInstall (args) {
	return args[0] === 'i' || args[0] === 'install' || args[0] === 'add';
}

function npm (args) {
	return spawn('yarn', args, {
		cwd: process.cwd(),
		stdio: isInstall(args) ? 'ignore' : 'inherit'
	});
}

function findImages () {
	return got(URL, {
		json: true
	})
}

function showImage (url, done) {
	if (!isIterm) {
		open(url);
		done();
		return;
	}
	var path = tempfile();
	var image = fs.createWriteStream(path);

	image.on('finish', function () {
		gif = require('child_process').spawn(imgcat, [path], {
			cwd: process.cwd()
		});
		clear()
		console.log('-----------------------')
		console.log(`⌚️ ${((Date.now() - ts) /1000).toFixed(2)} s\n`)
		gif.stdout.on('data', function (data) {
			process.stdout.write(data);
		});
		done()
	});

	got.stream(url).pipe(image);
}

function displayImages (res) {
	const images = res.body.data.map(image => image.download_url || image.image_url).filter(Boolean)
	each(shuffle(images), function (url, i, done) {
		showImage(url, function () {
			setTimeout(done, 2000);
		});
	});
}

function errorHandler (err) {
	console.error(err.stack);
	process.exit(1);
}
