"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listItemsInStage = listItemsInStage;
exports.readItem = readItem;
exports.writeItem = writeItem;
exports.moveItem = moveItem;
exports.deleteItem = deleteItem;
exports.generateId = generateId;
exports.readContextFile = readContextFile;
exports.findItemById = findItemById;
exports.getStagePath = getStagePath;
exports.getItemPath = getItemPath;
exports.extractPhaseNumber = extractPhaseNumber;
exports.extractTaskNumber = extractTaskNumber;
exports.generateSlugFromTitle = generateSlugFromTitle;
exports.extractSlugFromId = extractSlugFromId;
exports.loadAllItems = loadAllItems;
// lib/fs-adapter.ts
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Root directory for all docflow files
const DOCFLOW_ROOT = path_1.default.join(process.cwd(), 'docflow');
/**
 * Validates that a path resolves inside the docflow directory
 */
function validatePath(filePath) {
    const resolvedPath = path_1.default.resolve(filePath);
    const resolvedRoot = path_1.default.resolve(DOCFLOW_ROOT);
    if (!resolvedPath.startsWith(resolvedRoot)) {
        throw new Error(`Path ${filePath} is outside of docflow directory`);
    }
    return resolvedPath;
}
/**
 * Lists all .md files in a given stage folder
 */
async function listItemsInStage(stage) {
    const stagePath = validatePath(path_1.default.join(DOCFLOW_ROOT, stage));
    try {
        const files = await fs_1.promises.readdir(stagePath);
        const mdFiles = files
            .filter(file => file.endsWith('.md') && !file.startsWith('.'))
            .map(file => path_1.default.join(stagePath, file));
        return mdFiles;
    }
    catch (error) {
        // If directory doesn't exist or is empty, return empty array
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
/**
 * Reads the content of a file
 */
async function readItem(filePath) {
    const validatedPath = validatePath(filePath);
    return await fs_1.promises.readFile(validatedPath, 'utf-8');
}
/**
 * Writes content to a file (creates parent directories if needed)
 */
async function writeItem(filePath, content) {
    const validatedPath = validatePath(filePath);
    const dirPath = path_1.default.dirname(validatedPath);
    // Create parent directory if it doesn't exist
    await fs_1.promises.mkdir(dirPath, { recursive: true });
    await fs_1.promises.writeFile(validatedPath, content, 'utf-8');
}
/**
 * Moves a file from one location to another
 */
async function moveItem(fromPath, toPath) {
    const validatedFromPath = validatePath(fromPath);
    const validatedToPath = validatePath(toPath);
    const toDirPath = path_1.default.dirname(validatedToPath);
    // Create destination directory if it doesn't exist
    await fs_1.promises.mkdir(toDirPath, { recursive: true });
    // Check if destination file already exists
    try {
        await fs_1.promises.access(validatedToPath);
        throw new Error(`File already exists at ${toPath}`);
    }
    catch (error) {
        // File doesn't exist, proceed with move
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    // Move the file
    await fs_1.promises.rename(validatedFromPath, validatedToPath);
}
/**
 * Deletes a file
 */
async function deleteItem(filePath) {
    const validatedPath = validatePath(filePath);
    await fs_1.promises.unlink(validatedPath);
}
/**
 * Generates a unique ID from a title
 * Format: {slug}-{4-char-hash}
 */
function generateId(title, prefix) {
    // Create slug from title
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .split('-')
        .slice(0, 4) // Max 4 words
        .join('-');
    // Generate 4-char hash from timestamp
    const hash = Date.now().toString(36).slice(-4);
    // Add prefix if provided (e.g., "phase1-task1")
    const fullSlug = prefix ? `${prefix}-${slug}` : slug;
    return `${fullSlug}-${hash}`;
}
/**
 * Reads a context file (stage or phase context)
 */
async function readContextFile(type, id) {
    let contextPath;
    if (type === 'stage') {
        contextPath = path_1.default.join(DOCFLOW_ROOT, '_context', 'stages', `${id}.md`);
    }
    else {
        contextPath = path_1.default.join(DOCFLOW_ROOT, '_context', 'phases', `${id}.md`);
    }
    const validatedPath = validatePath(contextPath);
    try {
        return await fs_1.promises.readFile(validatedPath, 'utf-8');
    }
    catch (error) {
        // If context file doesn't exist, return empty string
        if (error.code === 'ENOENT') {
            return '';
        }
        throw error;
    }
}
/**
 * Finds an item by ID across all stage folders
 */
async function findItemById(itemId) {
    const stages = ['queue', 'planning', 'coding', 'auditing', 'completed'];
    for (const stage of stages) {
        const items = await listItemsInStage(stage);
        const found = items.find(itemPath => {
            const filename = path_1.default.basename(itemPath, '.md');
            return filename === itemId;
        });
        if (found) {
            return found;
        }
    }
    return null;
}
/**
 * Gets the stage folder path for a given stage
 */
function getStagePath(stage) {
    return path_1.default.join(DOCFLOW_ROOT, stage);
}
/**
 * Gets the full file path for an item in a specific stage
 */
function getItemPath(itemId, stage) {
    return path_1.default.join(DOCFLOW_ROOT, stage, `${itemId}.md`);
}
/**
 * Extract phase number from ID
 * e.g., "phase2-task1-foo-abc" -> 2
 */
function extractPhaseNumber(id) {
    const match = id.match(/phase(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}
/**
 * Extract task number from ID
 * e.g., "phase1-task3-bar-def" -> 3
 */
function extractTaskNumber(id) {
    const match = id.match(/task(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}
/**
 * Generate slug from title
 * Converts title to URL-friendly slug
 */
function generateSlugFromTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}
/**
 * Extract slug portion from ID
 * Removes phase/task prefixes and hash suffix
 */
function extractSlugFromId(id) {
    const parts = id.split('-');
    // Remove phase{N}, task{M} (if present), and hash (last part)
    const filtered = parts.filter(part => !part.match(/^phase\d+$/) &&
        !part.match(/^task\d+$/));
    // Remove last part (hash)
    filtered.pop();
    return filtered.join('-');
}
/**
 * Load all items from all stages
 */
async function loadAllItems() {
    const stages = ['queue', 'planning', 'coding', 'auditing', 'completed'];
    const allItems = [];
    // Import parseItem dynamically to avoid circular dependency
    const { parseItem } = await Promise.resolve().then(() => __importStar(require('./parser')));
    for (const stage of stages) {
        const itemPaths = await listItemsInStage(stage);
        for (const itemPath of itemPaths) {
            try {
                const content = await readItem(itemPath);
                const item = parseItem(content, itemPath);
                allItems.push(item);
            }
            catch {
                // Skip invalid items
                continue;
            }
        }
    }
    return allItems;
}
//# sourceMappingURL=fs-adapter.js.map