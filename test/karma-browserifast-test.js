var buster = require("buster-node");
var assert = buster.assert;
var refute = buster.refute;
var karmaBrowserifast = require("../index.js").karmaBrowserifast;
var fs = require("fs");
var watcher = require("../lib/watcher.js");
var path = require("path");

buster.testCase("karma-browserifast", {
    setUp: function () {
        this.log = {
            info: this.spy(),
            debug: this.spy()
        };

        this.logger = { create: this.stub().returns(this.log) };
        this.watchStub = {
            directories: this.spy(),
            files: this.spy(),
            bundle: this.spy()
        };
        this.stub(watcher, "create").returns(this.watchStub);
        this.writeFileSync = this.stub(fs, "writeFileSync");
        this.plugin = karmaBrowserifast();
    },

    "framework": {
        "creates watcher based on config": function () {
            this.plugin.framework({ autoWatch: true, files: [] }, this.logger);

            assert.calledOnce(watcher.create);
            assert.calledWith(watcher.create, {
                autoWatch: true,
                log: this.log
            });
        },

        "watches file parent directories": function () {
            this.plugin.framework({
                files: [],
                browserify: {
                    files: ["rofl/LOL.js"]
                }
            }, this.logger);

            assert.calledOnceWith(this.watchStub.directories, ["rofl/LOL.js"]);
        },

        "creates temp file with timestamp": function () {
            this.plugin.framework({
                files: [],
                browserify: {
                    files: ["rofl/LOL.js"]
                }
            }, this.logger);

            assert.calledOnce(this.writeFileSync);
            assert.match(this.writeFileSync.args[0][0], /\.browserify$/);
        },

        "prepends file to config.files": function () {
            var files = ["hei"];
            this.plugin.framework({
                files: files,
                browserify: {
                    files: ["rofl/LOL.js"]
                }
            }, this.logger);

            assert.equals(files.length, 2);
            assert.isObject(files[0]);
        }
    },

    "preprocessor": {
        setUp: function () {
            this.config = {
                basePath: path.dirname(__filename),
                files: [],
                browserify: {
                    files: ["*-fixture.js"]
                }
            };
            this.plugin.framework(this.config, this.logger);
        },

        "browserifies bundle": function (done) {
            var preprocessor = this.plugin.preprocessor(this.config);

            preprocessor("", "/tmp/blabla.browserify", done(function (content) {
                assert.match(content, "browserifastication");
            }));
        }
    }
});
