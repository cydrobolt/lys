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

const authorize_url  = "https://cloud.lifx.com/oauth/authorize";
const token_url      = "https://cloud.lifx.com/oauth/token";
const required_scope = "remote_control:all";

const request = require('request');
const BrowserWindow = require('electron').BrowserWindow;
const dialog = require('electron').dialog;
const ipcMain = require('electron').ipcMain;


function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var LifxOauth = class {
    constructor(client_id, client_secret) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.token = "";
    }
    getToken(code, callback) {
        request.post(token_url, {
            form: {
                client_id: this.client_id,
                client_secret: this.client_secret,
                code: code,
                grant_type: 'authorization_code'
            },
            headers: {
                'User-Agent': 'Lys desktop client'
            }
        }, function (error, response, body) {
            if (!error) {
                console.log(body);
                var parsed_body = JSON.parse(body);
                console.log(parsed_body);
                var token = parsed_body.access_token;
                callback(token);
            }
            else {
                dialog.showErrorBox("Could not authenticate", "Could not authenticate with LIFX. Please close the application and try again later.");
                callback(false);
            }
        });

    }
    authorize(auth_callback) {
        var auth_window = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });
        var auth_url = authorize_url + '?client_id=' + this.client_id + '&scope=' + required_scope + '&response_type=code';
        auth_window.loadURL(auth_url);
        auth_window.show();

        auth_window.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
            console.log(oldUrl);
            console.log(newUrl);

            var code = getParameterByName('code', newUrl);
            console.log(code);

            if (code) {
                this.getToken(code, function (token) {
                    if (token) {
                        this.token = token;
                        auth_window.destroy();

                        auth_callback(token);
                    }
                }.bind(this));
            }
        }.bind(this));
    }
};

exports.LifxOauth = LifxOauth;
