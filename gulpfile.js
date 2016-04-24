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

var gulp = require('gulp');
var swig = require('gulp-swig');
var fs = require('fs');
var rmrf = require('rimraf');

// Define watch paths
var paths = {
    templates: 'templates/*.html'
};

gulp.task('clean', function() {
  return rmrf.sync('built/');
});

gulp.task('templates', function() {
    gulp.src( __dirname + '/templates/*.html')
        .pipe(swig({defaults: { cache: false }}))
        .pipe(gulp.dest('./built/templates'));
});

gulp.task('watch', function() {
    gulp.watch(paths.templates, ['clean', 'templates']);
});

gulp.task('default', ['clean', 'templates', 'watch']);
