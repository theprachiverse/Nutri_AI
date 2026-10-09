"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.hybridSearch = hybridSearch;
var db_1 = require("../db");
var config_1 = require("./config");
var embedder_1 = require("./embedder");
function hybridSearch(query_1, mode_1) {
    return __awaiter(this, arguments, void 0, function (query, mode, userDemographic) {
        var queryEmbedding, vectorStr, kCandidates, rrfK, boost, results, kPerDoc, grouped, _i, results_1, row, list;
        if (userDemographic === void 0) { userDemographic = null; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, embedder_1.embedder.embed(query, true)];
                case 1:
                    queryEmbedding = _a.sent();
                    vectorStr = "[".concat(queryEmbedding.join(','), "]");
                    kCandidates = config_1.RAG_CONFIG.retrieval.k_candidates || 20;
                    rrfK = config_1.RAG_CONFIG.retrieval.rrf_k || 60;
                    boost = config_1.RAG_CONFIG.retrieval.population_boost || 0.05;
                    return [4 /*yield*/, db_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    WITH vector_search AS (\n      SELECT chunk_id,\n             doc_id,\n             text,\n             section_heading,\n             page_start,\n             page_end,\n             population,\n             population_excluded,\n             ROW_NUMBER() OVER (ORDER BY embedding <=> ", "::vector) AS vector_rank\n      FROM \"Chunk\"\n      WHERE ", "::text IS NULL OR NOT (", "::text = ANY(population_excluded))\n      ORDER BY vector_rank\n      LIMIT 100\n    ),\n    fts_search AS (\n      SELECT chunk_id,\n             ROW_NUMBER() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ", ")) DESC) AS fts_rank\n      FROM \"Chunk\"\n      WHERE ", "::text IS NULL OR NOT (", "::text = ANY(population_excluded))\n        AND tsv @@ websearch_to_tsquery('english', ", ")\n      ORDER BY fts_rank\n      LIMIT 100\n    ),\n    rrf AS (\n      SELECT \n        v.chunk_id,\n        v.doc_id,\n        v.text,\n        v.section_heading,\n        v.page_start,\n        v.page_end,\n        v.population,\n        v.population_excluded,\n        COALESCE(1.0 / (", " + v.vector_rank), 0.0) + \n        COALESCE(1.0 / (", " + f.fts_rank), 0.0) AS base_rrf_score\n      FROM vector_search v\n      LEFT JOIN fts_search f ON v.chunk_id = f.chunk_id\n    )\n    SELECT \n      chunk_id,\n      doc_id,\n      text,\n      section_heading,\n      page_start,\n      page_end,\n      population,\n      population_excluded,\n      CASE \n        WHEN ", "::text IS NOT NULL AND ", "::text = ANY(population) \n        THEN base_rrf_score + ", "\n        ELSE base_rrf_score\n      END as rrf_score\n    FROM rrf\n    ORDER BY rrf_score DESC\n    LIMIT ", ";\n  "], ["\n    WITH vector_search AS (\n      SELECT chunk_id,\n             doc_id,\n             text,\n             section_heading,\n             page_start,\n             page_end,\n             population,\n             population_excluded,\n             ROW_NUMBER() OVER (ORDER BY embedding <=> ", "::vector) AS vector_rank\n      FROM \"Chunk\"\n      WHERE ", "::text IS NULL OR NOT (", "::text = ANY(population_excluded))\n      ORDER BY vector_rank\n      LIMIT 100\n    ),\n    fts_search AS (\n      SELECT chunk_id,\n             ROW_NUMBER() OVER (ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ", ")) DESC) AS fts_rank\n      FROM \"Chunk\"\n      WHERE ", "::text IS NULL OR NOT (", "::text = ANY(population_excluded))\n        AND tsv @@ websearch_to_tsquery('english', ", ")\n      ORDER BY fts_rank\n      LIMIT 100\n    ),\n    rrf AS (\n      SELECT \n        v.chunk_id,\n        v.doc_id,\n        v.text,\n        v.section_heading,\n        v.page_start,\n        v.page_end,\n        v.population,\n        v.population_excluded,\n        COALESCE(1.0 / (", " + v.vector_rank), 0.0) + \n        COALESCE(1.0 / (", " + f.fts_rank), 0.0) AS base_rrf_score\n      FROM vector_search v\n      LEFT JOIN fts_search f ON v.chunk_id = f.chunk_id\n    )\n    SELECT \n      chunk_id,\n      doc_id,\n      text,\n      section_heading,\n      page_start,\n      page_end,\n      population,\n      population_excluded,\n      CASE \n        WHEN ", "::text IS NOT NULL AND ", "::text = ANY(population) \n        THEN base_rrf_score + ", "\n        ELSE base_rrf_score\n      END as rrf_score\n    FROM rrf\n    ORDER BY rrf_score DESC\n    LIMIT ", ";\n  "])), vectorStr, userDemographic, userDemographic, query, userDemographic, userDemographic, query, rrfK, rrfK, userDemographic, userDemographic, boost, kCandidates)];
                case 2:
                    results = _a.sent();
                    if (mode === 'per_document') {
                        kPerDoc = config_1.RAG_CONFIG.retrieval.k_per_doc || 2;
                        grouped = new Map();
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            row = results_1[_i];
                            list = grouped.get(row.doc_id) || [];
                            if (list.length < kPerDoc) {
                                list.push(row);
                                grouped.set(row.doc_id, list);
                            }
                        }
                        return [2 /*return*/, Array.from(grouped.values()).flat().sort(function (a, b) { return b.rrf_score - a.rrf_score; })];
                    }
                    return [2 /*return*/, results];
            }
        });
    });
}
var templateObject_1;
