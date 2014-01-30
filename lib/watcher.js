var chokidar = require("chokidar");
var path = require("path");

function createWatcher(opt, callback) {
    var watcher;
    var options = { autoWatch: !!opt.autoWatch, log: opt.log };
    var watching = [];

    function logFileWatch(file) {
        if (options.log) {
            options.log.debug("Watch", file);
        }
    }

    function watch(file) {
        if (watching.indexOf(file) >= 0) { return; }
        logFileWatch(file);
        watcher.add(file)
        watching.push(file);
    }

    function watchPaths(paths) {
        if (!watcher) {
            watcher = chokidar.watch(paths);
            paths.forEach(logFileWatch);
            watcher.on("change", callback);
            watching = paths.slice();
        } else {
            paths.forEach(watch);
        }
    }

    return {
        bundle: function (bundle) {
            if (!options.autoWatch) { return; }
            bundle.deps().on("data", function (dep) {
                Object.keys(dep.deps).forEach(function (k) { watch(dep.deps[k]); });
            });
        },

        directories: function (directories) {
            if (!options.autoWatch) { return; }
            watchPaths(directories.map(function (p) {
                // This is "a bit" of a hack: If patterns like /test/**/*.js are
                // used, they will work as expected, but the `dirname` will be
                // /test/**. Because this is so useful, we hack around to remove
                // the slash. I'm sure I will regret this at some point.
                return path.dirname(p.replace("**/*", "*"));
            }));
        },

        files: function (files) {
            if (!options.autoWatch) { return; }
            watchPaths(files.filter(function (f) { return f.watched; }).map(function (f) { return f.pattern; }));
        }
    };
}

module.exports = { create: createWatcher };
