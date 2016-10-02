const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const fs = require("fs");
//const main = require('electron-process').main;

// Report crashes to our server.
// electron.crashReporter.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var divide = 1;
var width  = 1920;
var height = 1280;
var dx = width / divide;
var dy = height / divide;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	//app.quit();
});

//app.commandLine.appendSwitch('--javascript-harmony');
//app.disableHardwareAcceleration();

function init_ipc() {
	var ipc = electron.ipcMain;
	var xblock = 0;
	var yblock = 0;
	var doing = false;

	function init_umrt(event, scenarioName) {
		if (doing) {
			setTimeout(function () {
				init_umrt(event, scenarioName);
			}, 100);
			return;
		}
		doing = true;
		var area = [dx * xblock, dy * yblock, dx, dy, width, height];
		console.log("start_render", xblock, yblock, area);
		//event.sender.send('start_render', area, false);
		if (xblock === (divide-1)) {
			xblock = 0;
			yblock = yblock + 1;
		} else {
			++xblock;
		}
		doing = false;
	}

	ipc.on('init_umrt', init_umrt);

	var areas = [];
	var files = [];
	ipc.on("umrt_finished", function (event, area, filename) {
		files.push(filename);
		areas.push(area);
		if (files.length === (divide * divide)) {
			var PNG = require('pngjs').PNG;

			var newfile = new PNG({"width": width, "height":height});
			var i;
			for (i = 0; i < files.length; i = i + 1) {
				var myarea = areas[i];
				console.log("read", files[i])
				var png = PNG.sync.read(fs.readFileSync(files[i]), {filterType : 4});
				for (var y = myarea[1]; y < (myarea[1] + myarea[3]); ++y) {
					for (var x = myarea[0]; x < (myarea[0] + myarea[2]); ++x) {
						var idx = (width * y + x) * 4;
						newfile.data[idx] = png.data[idx];
						newfile.data[idx + 1] = png.data[idx + 1];
						newfile.data[idx + 2] = png.data[idx + 2];
						newfile.data[idx + 3] = png.data[idx + 3];
					}
				}
			}
			fs.writeFileSync('out_final.png', PNG.sync.write(newfile));
			app.quit();
		}
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
	// Create the browser window.

//	const backgroundURL = 'file://' + __dirname + '/background.htm';
//	const backgroundProcessHandler = main.createBackgroundProcess(backgroundURL);
//	backgroundProcessHandler.addWindow(mainWindow);

	init_ipc();
	// and load the index.html of the app.
	var i = 0;
	for (; i < divide * divide; i = i + 1) {
		mainWindow = new BrowserWindow({width: 800, height: 600, title:"cabbage"});
		mainWindow.loadURL('file://' + __dirname + '/index.html');
		mainWindow.on('closed', function() {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			mainWindow = null;
			app.quit();
		});
	}

	//mainWindow.setMenu(null);
	// Open the DevTools.
	//mainWindow.webContents.openDevTools();
	// Emitted when the window is closed.
});
