"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackages = exports.findAllPackages = void 0;
const util_1 = require("util");
const path = require("path");
const glob = require("glob");
const safefs = require('safefs');
const readFile_p = util_1.promisify(safefs.readFile);
const glob_p = util_1.promisify(glob);
async function findAllPackages(basePath) {
    const files = await glob_p(path.join(basePath, '**/package.json'));
    return loadPackages(files);
}
exports.findAllPackages = findAllPackages;
async function loadPackages(files) {
    let packs = await Promise.all(files.map(async (file) => {
        const buffer = await readFile_p(file);
        const pack = JSON.parse(buffer.toString());
        return {
            name: pack.name,
            version: pack.version,
            ngccProcessed: !!pack['__processed_by_ivy_ngcc__'],
            path: path.dirname(file),
            filePath: file
        };
    }));
    packs = packs.filter(pack => pack.name);
    const map = new Map();
    packs.forEach((pack) => map[pack.name] = pack);
    packs.forEach((pack) => {
        while (pack.ngccProcessed && !pack.version) {
            const parts = pack.name.split('/');
            const parentName = parts.slice(0, parts.length - 1).join('/');
            if (parentName && (pack = map[parentName])) {
                pack.ngccProcessed = true;
            }
        }
    });
    return packs.filter((pack) => pack.version);
}
exports.loadPackages = loadPackages;
