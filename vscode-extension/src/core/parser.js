"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontmatterSchema = exports.USER_CONTENT_START = exports.MANAGED_SECTION_START = void 0;
exports.normalizeStageValue = normalizeStageValue;
exports.parseItem = parseItem;
exports.serializeItem = serializeItem;
exports.updateFrontmatter = updateFrontmatter;
exports.extractUserContent = extractUserContent;
exports.buildManagedSection = buildManagedSection;
exports.validateFrontmatterString = validateFrontmatterString;
// lib/parser.ts
const gray_matter_1 = __importDefault(require("gray-matter"));
const zod_1 = require("zod");
// Constants for separators
exports.MANAGED_SECTION_START = '<!-- DOCFLOW:MANAGED - Do not edit above the separator -->';
exports.USER_CONTENT_START = '<!-- DOCFLOW:USER-CONTENT - Edit below this line -->';
// Zod schema for frontmatter validation
const stageValues = [
    'queue',
    'planning',
    'coding',
    'auditing',
    'completed',
    'backlog',
    'in-progress',
    'review',
    'audit',
];
const stageNormalizationMap = {
    queue: 'queue',
    planning: 'planning',
    coding: 'coding',
    auditing: 'auditing',
    completed: 'completed',
    backlog: 'queue',
    'in-progress': 'planning',
    review: 'coding',
    audit: 'auditing',
};
function normalizeStageValue(stage) {
    const normalized = stageNormalizationMap[stage];
    if (!normalized) {
        throw new Error(`Unsupported stage value: ${stage}`);
    }
    return normalized;
}
exports.FrontmatterSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.enum(['phase', 'task']),
    title: zod_1.z.string().min(1),
    stage: zod_1.z.enum(stageValues),
    phase: zod_1.z.string().optional(),
    created: zod_1.z.string().datetime(),
    updated: zod_1.z.string().datetime(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    dependencies: zod_1.z.array(zod_1.z.string()).optional(),
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * Parses a markdown file with frontmatter
 * Splits content into managed section and user content
 */
function parseItem(content, filePath) {
    // Parse frontmatter with gray-matter
    const { data, content: bodyContent } = (0, gray_matter_1.default)(content);
    // Validate frontmatter with Zod
    const parsedFrontmatter = exports.FrontmatterSchema.parse(data);
    const frontmatter = {
        ...parsedFrontmatter,
        stage: normalizeStageValue(parsedFrontmatter.stage),
    };
    // Split body content at user content separator
    let userContent = '';
    if (bodyContent.includes(exports.USER_CONTENT_START)) {
        const parts = bodyContent.split(exports.USER_CONTENT_START);
        // Everything after the user content separator is user content
        userContent = parts[1] || '';
    }
    else {
        // If no separator found, treat all content as user content
        userContent = bodyContent;
    }
    return {
        frontmatter,
        body: userContent.trim(),
        fullContent: content,
        filePath,
    };
}
/**
 * Serializes an item back to markdown format
 * Combines frontmatter, managed section, and user content
 */
function serializeItem(frontmatter, managedContent, userContent) {
    // Build the frontmatter section
    const frontmatterStr = gray_matter_1.default.stringify('', frontmatter);
    // Build the complete file content
    const parts = [
        frontmatterStr.trim(),
        '',
        exports.MANAGED_SECTION_START,
        '',
        managedContent.trim(),
        '',
        '---',
        exports.USER_CONTENT_START,
        '',
        userContent.trim(),
    ];
    return parts.join('\n') + '\n';
}
/**
 * Updates frontmatter fields
 */
function updateFrontmatter(current, updates) {
    return {
        ...current,
        ...updates,
        updated: new Date().toISOString(),
    };
}
/**
 * Extracts user content from a markdown file
 * Returns empty string if no user content separator found
 */
function extractUserContent(content) {
    const { content: bodyContent } = (0, gray_matter_1.default)(content);
    if (bodyContent.includes(exports.USER_CONTENT_START)) {
        const parts = bodyContent.split(exports.USER_CONTENT_START);
        return (parts[1] || '').trim();
    }
    // If no separator, return all body content
    return bodyContent.trim();
}
/**
 * Builds the managed section (stage + phase context)
 */
function buildManagedSection(stage, stageContent, phaseTitle, phaseContent) {
    const parts = [];
    // Stage section
    parts.push(`## 🎯 Stage: ${formatStageTitle(stage)}`);
    parts.push('');
    parts.push(stageContent.trim());
    // Phase section (if applicable)
    // Always emit phase block if we have a phaseTitle, even if content is empty
    if (phaseTitle) {
        parts.push('');
        parts.push(`## 📦 Phase: ${phaseTitle}`);
        parts.push('');
        if (phaseContent && phaseContent.trim()) {
            parts.push(phaseContent.trim());
        }
        else {
            parts.push('_No phase context defined yet._');
        }
    }
    return parts.join('\n');
}
/**
 * Formats stage name for display
 */
function formatStageTitle(stage) {
    return stage
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Validates that a string is valid markdown frontmatter
 */
function validateFrontmatterString(content) {
    try {
        const { data } = (0, gray_matter_1.default)(content);
        exports.FrontmatterSchema.parse(data);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=parser.js.map