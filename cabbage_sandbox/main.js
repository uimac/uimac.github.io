const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const fs = require("fs");

// Report crashes to our server.
// electron.crashReporter.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;


// Quit when all windows are closed.
app.on('window-all-closed', function() {
	//app.quit();
});

//app.commandLine.appendSwitch('--javascript-harmony');
//app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
	// Create the browser window.

//	const backgroundURL = 'file://' + __dirname + '/background.htm';
//	const backgroundProcessHandler = main.createBackgroundProcess(backgroundURL);
//	backgroundProcessHandler.addWindow(mainWindow);

	// and load the index.html of the app.
	mainWindow = new BrowserWindow({width: 800, height: 600, title:"cabbage"});
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
		app.quit();
	});

	//mainWindow.setMenu(null);
	// Open the DevTools.
	//mainWindow.webContents.openDevTools();
	// Emitted when the window is closed.
});
