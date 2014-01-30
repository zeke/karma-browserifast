var fs = require("fs");
var glob = require("glob");
var path = require("path");
var os = require("os");
var browserify = require("browserify");
var watcher = require("./lib/watcher");
var crypto = require("crypto");

function hash(str) {
    return crypto.createHash("sha1").update(str).digest("hex");
}

/**
 * Because we're handling files outside Karma's `files` configuration key, we
 * have to manually ensure that all files are represented using Karma's object
 * describing a collection of files.
 */
function fileConfig(pattern, basePath) {
    if (typeof pattern === "object") { return pattern; }
    return {
        pattern: path.resolve(basePath, pattern),
        served: true,
        included: false,
        watched: true
    };
}

/**
 * Synchronously expand the glob in pattern, and duplicate the file descriptor
 * object once for every file on disk found.
 */
function expandGlob(file) {
    return glob.sync(file.pattern).map(function (filePath) {
        return {
            pattern: filePath,
            served: file.served,
            included: file.included,
            watched: file.watched
        };
    });
}

/**
 * Extract and, if necessary, expand every file descriptor in a bundle
 */
function fileDescriptors(bundle, basePath) {
    return bundle.reduce(function (files, file) {
        return files.concat(expandGlob(fileConfig(file, basePath)));
    }, []);
}

/**
 * For Logging
 */
function formatPaths(label, paths) {
    return [label].concat(paths).join("\n    ");
}

/**
 * Ideally, this plugin would only need to be a "framework". Unfortunately,
 * Karma's "framework" hook is not asynchronous, so we cannot browserify inside
 * it. For this reason, we expose a "framework" hook, and a pre-processor. These
 * live together in a closure in order to share the logger and file watcher
 * objects.
 */
function karmaBrowserifast() {
    var log, watch;

    /**
     * Whenever a test or one of its dependencies change, make a symbolic change
     * to the token bundle on disk. Karma will pick up the change and trigger a
     * new test run.
     */
    function writeBundleFile() {
        var tmpFile = path.join(os.tmpdir(), hash(process.cwd()) + ".browserify");
        log.debug("Write browserify bundle placeholder file", tmpFile);
        fs.writeFileSync(tmpFile, "/*" + new Date().getTime() + "*/");
        return tmpFile;
    }

    /**
     * The framework hook adds the token bundle file to the set of files Karma
     * should load (and watch for changes). It also sets up a watcher that keeps
     * tabs on all the directories in the original paths. The idea here is that
     * if you do this in karma.conf.js:
     *
     *     { browserify: {
     *         files: ["test/** /*.js"];
     *     }}
     *
     * karma-browserifast will watch the test directory for new files.
     */
    function framework(config, logger) {
        log = logger.create("framework.browserify");
        watch = watcher.create({
            autoWatch: config.autoWatch,
            log: log
        }, writeBundleFile);
        watch.directories(config.browserify && config.browserify.files || []);

        var tmpFile = writeBundleFile();

        config.files.unshift({
            pattern: tmpFile,
            served: true,
            included: true,
            watched: true
        });
    }

    function preprocessor(config) {
        var bc = config.browserify || {};
        bc.files = bc.files || [];

        return function (content, path, done) {
            log.info(formatPaths("Paths to browserify", bc.files));
            var files = fileDescriptors(bc.files, config.basePath);
            var paths = files.map(function (f) { return f.pattern; });
            var bundle = browserify({ entries: paths });
            watch.files(files);
            watch.bundle(bundle);

            log.debug("Browserify bundle");
            var start = new Date();

            bundle.bundle({ debug: bc.debug }, function (err, content) {
                log.info("Browserified in", (new Date() - start) + "ms,", Math.floor(content.length / 1024) + "kB");
                done(content);
            });
        };
    }

    return {
        framework: framework,
        preprocessor: preprocessor
    };
}

var plugin = karmaBrowserifast();
plugin.framework.$inject = ["config", "logger"];
plugin.preprocessor.$inject = ["config"];

module.exports = {
    karmaBrowserifast: karmaBrowserifast,
    "framework:browserify": ["factory", plugin.framework],
    "preprocessor:browserify": ["factory", plugin.preprocessor]
};
