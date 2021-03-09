"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const os = require("os");
const path = require("path");
const fs_1 = require("fs");
const safefs = require('safefs');
const util_1 = require("util");
const reflect = require("@alumna/reflect");
const mkdir_p = util_1.promisify(safefs.mkdir);
const rmdir_p = util_1.promisify(safefs.rmdir);
const access_p = util_1.promisify(safefs.access);
const readFile_p = util_1.promisify(safefs.readFile);
const writeFile_p = util_1.promisify(safefs.writeFile);
const CACHE_VERSION = "1";
class Cache {
    constructor(ngccVersion) {
        this.ngccVersion = ngccVersion;
        this.indexes = {
            version: CACHE_VERSION,
            index: {}
        };
        this.cachePath = process.platform === "win32" ?
            path.join(process.env.APPDATA, 'wngcc') :
            path.join(os.homedir(), '.wngcc');
    }
    get packages() {
        return this.indexes.index[this.ngccVersion];
    }
    async init() {
        await mkdir_p(this.cachePath, { recursive: true });
        return this.loadIndex();
    }
    hasPackage(pack) {
        var _a, _b;
        return !!((_b = (_a = this.packages[pack.name]) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b.includes(pack.version));
    }
    async copyFromCache(pack) {
        if (!this.hasPackage(pack)) {
            throw Error(`Unknown package ${this.ngccVersion}|${pack.name}@${pack.version}`);
        }
        console.log(`From cache ${pack.name}@${pack.version}`);
        const packCachePath = this.generateCachePath(pack);
        const { err } = await reflect({
            src: packCachePath,
            dest: pack.path,
            delete: true,
            exclude: ['node_modules']
        });
        if (err) {
            throw err;
        }
    }
    async copyToCache(pack) {
        console.log(`To cache ${pack.name}@${pack.version}`);
        const packCachePath = this.generateCachePath(pack);
        await mkdir_p(packCachePath, { recursive: true });
        const { err } = await reflect({
            src: pack.path,
            dest: packCachePath,
            delete: true,
            exclude: ['node_modules']
        });
        if (err) {
            throw err;
        }
        let indexRecord = this.packages[pack.name];
        if (!indexRecord) {
            indexRecord = {
                versions: []
            };
            this.packages[pack.name] = indexRecord;
        }
        indexRecord.versions.push(pack.version);
    }
    async save() {
        const indexPath = path.join(this.cachePath, '.index.json');
        const data = JSON.stringify(this.indexes, null, 2);
        return writeFile_p(indexPath, data);
    }
    async cleanCacheFolder() {
        await rmdir_p(this.cachePath, { recursive: true });
        await mkdir_p(this.cachePath);
    }
    generateCachePath(pack) {
        return path.join(this.cachePath, this.ngccVersion, pack.name, pack.version);
    }
    async loadIndex() {
        const indexPath = path.join(this.cachePath, '.index.json');
        if (await access_p(indexPath, fs_1.constants.F_OK).then(() => true, () => false)) {
            const buffer = await readFile_p(indexPath);
            const indexes = JSON.parse(buffer.toString());
            if (indexes.version === CACHE_VERSION) {
                this.indexes = indexes;
            }
            else {
                await this.cleanCacheFolder();
            }
        }
        if (!this.packages) {
            this.indexes.index[this.ngccVersion] = {};
        }
    }
}
exports.Cache = Cache;
