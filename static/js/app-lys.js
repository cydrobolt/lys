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

const ipcRenderer = require('electron').ipcRenderer;
const shell = require('electron').shell;
const lifx_http_api = require('lifx-http-api');

// Declare LIFX API instance
var lifx = null;

window.tinycolor = require('tinycolor2');
window.Slider = require('bootstrap-slider');

window.lights_global = false;
var light_nav_item, light_elem_item;

function spaceToUnderscore(text) {
    text = text.replace(/ /g,"_");
    return text;
}

function syncInterface() {
    return new Promise(function (resolve) {
        lifx.listLights().then(function(lights) {
            var light;

            lights_global = lights;

            $('.ly-refresh-icon').show();
            if (lights.length === 0) {
                $('.ly-no-lights').show();
            }
            else {
                $('.ly-no-lights').hide();
            }

            var markup_nav = "", markup_tab = "", elem, ctx;

            ctx = {
                tab_label: spaceToUnderscore("Lys Home"),
                label: "Home",
                extra_classes: "active"
            };

            // Add nav item for home panel
            elem = light_nav_item(ctx);
            markup_nav += elem;

            for (var i in lights) {
                light = lights[i];

                tab_label = spaceToUnderscore(light.label);

                ctx = light;
                ctx.tab_label = tab_label;
                ctx.indice = i;

                // Compile template for light nav
                elem = light_nav_item(ctx);
                markup_nav += elem;

                // Compile template for light content node
                elem = light_elem_item(ctx);
                markup_tab += elem;

                console.log(light);
            }

            // Remove previous dynamically loaded tabs
            $('.ly-dyn').remove();

            $('.ly-pad-top-nav ul').html(markup_nav);
            $('.ly-tabs').append(markup_tab);

            resolve();
        });
    });
}

function getSelectorFromIndice(indice) {
    return "id:" + lights_global[indice].id;
}

$(function() {
    // Hide refresh button
    $('.ly-refresh-icon').hide();

    // Load tabs
    $('.ly-tab-ul a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Load Handlebars templates
    var light_nav_item_hbs = $("#ly-light-nav-template").html();
    light_nav_item = Handlebars.compile(light_nav_item_hbs);

    var light_elem_item_hbs = $("#ly-light-elem-template").html();
    light_elem_item = Handlebars.compile(light_elem_item_hbs);

    // Request authentication token
    window.lifx_token = ipcRenderer.sendSync('get_token', 'get_token');

    console.log(lifx_token);
    lifx = new lifx_http_api({
        bearerToken: lifx_token
    });

    syncInterface();

    $('.ly-refresh-icon').click(function () {
        // Resync interface when refresh icon is clicked
        var refresh_icon = $('.ly-refresh-icon');
        var current_tab_id = $('ul .active').children(":first").attr('id');
        refresh_icon.removeClass('fa-refresh').addClass('fa-gear fa-spin');

        syncInterface().then(function () {
            refresh_icon.removeClass('fa-gear fa-spin').addClass('fa-refresh');

            // Reactivate previously active tab
            $('#' + current_tab_id).tab('show');
        });
    });

    // Color Changes
    $('body').delegate('.ly-change-color', 'sliderup', function() {
        var indice = $(this).data('ly-indice');
        var color_hex = $(this).val();
        var selector = getSelectorFromIndice(indice);

        lifx.setState(selector, {
            'color': color_hex
        })
        .then(function (r) {
            console.log(r);
        })
        .fail(function(e) {
            console.log(e);
        });
    });

    // Brightness Changes

    $('body').delegate('.ly-change-brightness', 'slide', function() {
        var indice = $(this).data('ly-indice');
        var brightness = $(this).val();
        var selector = getSelectorFromIndice(indice);

        lifx.setState(selector, {
            'brightness': brightness
        })
        .then(function (r) {
            console.log(r);
        })
        .fail(function(e) {
            console.log(e);
        });
    });

    // Light Toggle Changes

    $('body').delegate('.ly-toggle-power', 'click', function() {
        var indice = $(this).data('ly-indice');
        var selector = getSelectorFromIndice(indice);

        lifx.togglePower(selector, 1)
        .then(function (r) {
            console.log(r);
        })
        .fail(function(e) {
            console.log(e);
        });
    });

    // Opening external link
    $('a').click(function(e) {
        var link_dest = $(this).attr('href');
        shell.openExternal(link_dest);
        e.preventDefault();
    });

});
