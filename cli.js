#!/usr/bin/env node

'use strict';

/**
 * Dependencies
 */

const tempfile = require('tempfile');
const shuffle = require('array-shuffle');
const spawn = require('child_process').spawn;
const each = require('each-series');
const join = require('path').join;
const got = require('got');
const fs = require('fs');

const imgcat = join(__dirname, 'node_modules', '.bin', 'imgcat');


/**
 * npm install + gifs
 */

let args = process.argv.slice(2);

if (args[0] === 'i' || args[0] === 'install') {
	args.shift();
}

args.unshift('install');

// imgcat process
let gif;

// npm install process
let install = spawn('npm', args, {
	cwd: process.cwd(),
	stdio: 'ignore'
});

install.on('exit', function (code) {
	gif.kill();
	process.exit(code);
});

findImages()
	.then(displayImages)
	.catch(errorHandler);

function findImages () {
	return got('http://api.giphy.com/v1/gifs/trending', {
		json: true,
		query: {
			api_key: 'dc6zaTOxFJmzC'
		}
	});
}

function displayImages (res) {
	let images = res.body.data.map(function (image) {
		return image.images.fixed_width.url;
	});

	each(shuffle(images), function (url, i, done) {
		let path = tempfile();
		let image = fs.createWriteStream(path);

		image.on('finish', function () {
			gif = spawn(imgcat, [path], {
				cwd: process.cwd(),
				stdio: 'inherit'
			});

			setTimeout(done, 5000);
		});

		got.stream(url).pipe(image);
	});
}

function errorHandler (err) {
	console.error(err.stack);
	process.exit(1);
}
