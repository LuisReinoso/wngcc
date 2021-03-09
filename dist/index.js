"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const command_line_options_1 = require("@angular/compiler-cli/ngcc/src/command_line_options");
const build_marker_1 = require("@angular/compiler-cli/ngcc/src/packages/build_marker");
const ngcc_1 = require("@angular/compiler-cli/ngcc");
const package_finder_1 = require("./package-finder");
const cache_1 = require("./cache");
async function main() {
    const opts = command_line_options_1.parseCommandLineOptions(process.argv.slice(2));
    const cache = new cache_1.Cache(build_marker_1.NGCC_VERSION);
    await cache.init();
    const packs = await package_finder_1.findAllPackages(opts.basePath);
    const cached = packs
        .filter(pack => !pack.ngccProcessed && cache.hasPackage(pack))
        .map(pack => cache.copyFromCache(pack));
    await Promise.all(cached);
    await Promise.resolve(ngcc_1.process(opts));
    const packsToCheck = await package_finder_1.findAllPackages(opts.basePath);
    const toCache = packsToCheck
        .filter(pack => pack.ngccProcessed && !cache.hasPackage(pack))
        .map(pack => cache.copyToCache(pack));
    await Promise.all(toCache);
    await cache.save();
}
exports.main = main;
