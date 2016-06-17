/*
 #  Copyright 2016 Chaoyi Zha
 #
 #  Licensed under the Apache License, Version 2.0 (the "License");
 #  you may not use this file except in compliance with the License.
 #  You may obtain a copy of the License at
 #
 #      http://www.apache.org/licenses/LICENSE-2.0
 #
 #  Unless required by applicable law or agreed to in writing, software
 #  distributed under the License is distributed on an "AS IS" BASIS,
 #  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 #  See the License for the specific language governing permissions and
 #  limitations under the License.
 */


'use strict';

const electron = require('electron');
const ipcMain = require('electron').ipcMain;

const request = require('request');
const electron_settings = require('electron-settings');
const lys_config = require('./config.js').LysConfig;
const Lifx_Oauth = require('./lib/lifx-oauth/main.js').LifxOauth;

const client_id = lys_config.client_id;
const client_secret = lys_config.client_secret;

let lifx_profile = new Lifx_Oauth(client_id, client_secret);

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function getTemplate(template_name) {
    return 'file://' + __dirname + '/built/templates/' + template_name + '.html';
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    var user_token_cache = lifx_profile.getTokenFromCache();

    if (user_token_cache) {
        // Load app directly if token is cached
        mainWindow.loadURL(getTemplate('app'));
    }
    else {
        // Load the login prompt if no token is cached
        mainWindow.loadURL(getTemplate('auth'));
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

ipcMain.on('authenticate', function(event, arg) {
    lifx_profile.authorize(function (token) {
        mainWindow.loadURL(getTemplate('app'));
    });
    event.returnValue = 'OK';
});

ipcMain.on('get_token', function(event, arg) {
    event.returnValue = lifx_profile.token;
});

ipcMain.on('open_link', function(event, arg) {
    shell.openExternal(arg);
});


/* XXX Teardown Methods */

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
