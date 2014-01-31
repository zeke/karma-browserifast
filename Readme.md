# karma-browserifast

[Browserify](http://browserify.org/) your JavaScript on the fly when testing
with [Karma](http://karma-runner.github.io).

## Installation

Install with npm:

```sh
npm install karma-browserifast
```

## Configuration

tl;dr version:

```js
module.exports = function (karma) {
    karma.set({
        frameworks: ["browserify"],

        // Files that are to be loaded as globals
        files: [
            "node_modules/es5-shim/es5-shim.js"
        ],

        // Files to browserify
        browserify: {
            files: [
                "test/**/*.js"
            ]
        },

        // Hopefully temporary hack
        preprocessors: {
            "/**/*.browserify": "browserify"
        }

        // ...
    });
};
```

### Somewhat more elaborate version

Add `"browserify"` to your list of frameworks in `karma.conf`, e.g.:

```js
frameworks: ["browserify"]
```

Any tests or other files to browserify should not be listed in Karma's `files`
configuration. Instead, use the `browserify` key. This accepts the same list as
`files`, e.g. filenames as strings, and/or objects with `pattern`, `served`,
`included` and `watched` properties.

```js
// Files that are to be loaded as globals
files: [
    "node_modules/es5-shim/es5-shim.js"
],

// Files to browserify
browserify: {
    files: [
        "test/**/*.js",
        { pattern: "integration/**/*.js",
          watched: false }
    ]
}
```

The last step is a temporary hack that we hope to get rid of very soon:

```js
preprocessors: {
    "/**/*.browserify": "browserify"
}
```

What is this? karma-browserifast works by adding a file to Karma's list of
files. This file resides in your OS tmp directory, and if you set the log level
to `karma.LOG_DEBUG`, karma-browserifast will tell you the exact file name. This
file is empty, and the above pre-processor provides the content Karma will use.
This content is of course the browserified JavaScript.

The reason for this somewhat elaborate approach is that Karma's `framework` hook
does not wait for asynchronous operations, meaning we can't browserify in this
hook. The pre-processors however, are asynchronous, thus this hack. We're
investigating how to fix this weirdness.

### Optional configuration options

```js
browserify: {
    debug: true
}
```

Adds sourcemaps to your Browserify bundle.

## File watching

When you move files from Karma's list of files to the browserify list, you also
opt out of Karma's watching feature. Don't worry, karma-browserifast has your
back. It tells Karma to watch its bundle, and updates this whenever
your files change. The Karma `autoWatch` configuration option, as well as
individual files configurations (e.g. `watch: true|false`), are respected. If
`autoWatch` is `true`, dependencies resolved by browserify will be watched in
addition to files explicitly enumerated.

## Alternatives

There's also [karma-browserify](https://github.com/xdissent/karma-browserify),
however, we found its performance to be unacceptable as the number of files in
our project increases. karma-browserify adds a pre-processor that browserifies
all known files each time a new file is passed to it. This means that for `n`
files, karma-browserify will run `browserify` `n!` times and write to the same
file `n` times. This quickly becomes noticably slow.

# BSD 2-clause License

Copyright (c) 2014, Jostein Holje and Christian Johansen
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
