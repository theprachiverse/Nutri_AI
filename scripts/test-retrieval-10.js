"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var retrieve_1 = require("../lib/rag/retrieve");
var scopeGuard_1 = require("../lib/scopeGuard");
var router_1 = require("../lib/rag/router");
var questions = [
    "How much iron does an adult woman need per day?",
    "What are the main food sources of Vitamin B12?",
    "How much protein does a sedentary vegetarian adult need daily?",
    "How long can cooked chicken be safely stored in the fridge?",
    "Is it safe to refreeze meat that has been thawed in the fridge?",
    "Does boiling vegetables destroy all their vitamins?",
    "What is the safest internal temperature for cooked pork?",
    "Is coffee good or bad for your health overall?",
    "Are artificial sweeteners harmful in moderate amounts?",
    "Is eating red meat a few times a week harmful long-term?"
];
function runTest() {
    return __awaiter(this, void 0, void 0, function () {
        var i, q, scopeCheck, route, chunks, _i, _a, chunk;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < questions.length)) return [3 /*break*/, 5];
                    q = questions[i];
                    console.log("\n--- Q".concat(i + 1, ": ").concat(q, " ---"));
                    return [4 /*yield*/, (0, scopeGuard_1.checkScope)(q, [])];
                case 2:
                    scopeCheck = _b.sent();
                    if (scopeCheck.blocked) {
                        console.log("\u274C Scope Guard Blocked: ".concat(scopeCheck.category));
                        return [3 /*break*/, 4];
                    }
                    route = (0, router_1.routeQuery)(q, [], []);
                    console.log("Router: mode=".concat(route.mode, ", docIds=").concat(route.docIds, ", population=").concat(route.population));
                    if (route.mode === 'not_covered') {
                        console.log("\u274C Router Rejected: not_covered (food_composition)");
                        return [3 /*break*/, 4];
                    }
                    return [4 /*yield*/, (0, retrieve_1.hybridSearch)(route.retrievalQuery, route.mode === 'all' ? 'standard' : 'per_document', route.population)];
                case 3:
                    chunks = _b.sent();
                    console.log("Top 3 Chunks Retrieved:");
                    for (_i = 0, _a = chunks.slice(0, 3); _i < _a.length; _i++) {
                        chunk = _a[_i];
                        console.log("  - [".concat(chunk.doc_id, "] ").concat(chunk.section_heading, " (Score: ").concat(chunk.rrf_score.toFixed(3), ")"));
                        console.log("    Excerpt: ".concat(chunk.text.substring(0, 80), "..."));
                    }
                    _b.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
runTest().catch(console.error).finally(function () { return process.exit(0); });
