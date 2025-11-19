"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectContext = injectContext;
exports.createItemWithContext = createItemWithContext;
exports.reinjectContextForStageChange = reinjectContextForStageChange;
exports.updateFrontmatterOnly = updateFrontmatterOnly;
// lib/context-injector.ts
const fs_adapter_1 = require("./fs-adapter");
const parser_1 = require("./parser");
/**
 * Injects stage and phase context into an item
 * Preserves user content below the separator
 */
async function injectContext(item, newStage, newPhaseId) {
    // Read stage context
    const stageContent = await (0, fs_adapter_1.readContextFile)('stage', newStage);
    // Read phase context if phase is specified
    let phaseContent = '';
    let phaseTitle = '';
    const phaseId = newPhaseId || item.frontmatter.phase;
    if (phaseId) {
        phaseContent = await (0, fs_adapter_1.readContextFile)('phase', phaseId);
        // Try to get phase title from phase file
        if (phaseContent) {
            try {
                const phasePath = await (0, fs_adapter_1.findItemById)(phaseId);
                if (phasePath) {
                    const phaseFileContent = await (0, fs_adapter_1.readItem)(phasePath);
                    const phaseItem = (0, parser_1.parseItem)(phaseFileContent, phasePath);
                    phaseTitle = phaseItem.frontmatter.title;
                }
            }
            catch {
                // If we can't read phase file, use phaseId as title
                phaseTitle = phaseId;
            }
        }
    }
    // Build managed section
    const managedContent = (0, parser_1.buildManagedSection)(newStage, stageContent, phaseTitle, phaseContent);
    // Serialize with user content preserved
    return (0, parser_1.serializeItem)(item.frontmatter, managedContent, item.body);
}
/**
 * Creates a new item with context injection
 */
async function createItemWithContext(frontmatter, initialUserContent = '') {
    // Read stage context
    const stageContent = await (0, fs_adapter_1.readContextFile)('stage', frontmatter.stage);
    // Read phase context if applicable
    let phaseContent = '';
    let phaseTitle = '';
    if (frontmatter.phase) {
        phaseContent = await (0, fs_adapter_1.readContextFile)('phase', frontmatter.phase);
        // Try to get phase title from phase file
        try {
            const phasePath = await (0, fs_adapter_1.findItemById)(frontmatter.phase);
            if (phasePath) {
                const phaseFileContent = await (0, fs_adapter_1.readItem)(phasePath);
                const phaseItem = (0, parser_1.parseItem)(phaseFileContent, phasePath);
                phaseTitle = phaseItem.frontmatter.title;
            }
        }
        catch {
            // If we can't read phase file, use phase ID as title
            phaseTitle = frontmatter.phase;
        }
    }
    // Build managed section
    const managedContent = (0, parser_1.buildManagedSection)(frontmatter.stage, stageContent, phaseTitle, phaseContent);
    // Serialize
    return (0, parser_1.serializeItem)(frontmatter, managedContent, initialUserContent);
}
/**
 * Re-injects context when moving an item to a new stage
 * Preserves user content
 */
async function reinjectContextForStageChange(itemContent, itemPath, newStage, newPhaseId) {
    // Parse current item
    const item = (0, parser_1.parseItem)(itemContent, itemPath);
    // Update stage in frontmatter
    const updatedFrontmatter = {
        ...item.frontmatter,
        stage: newStage,
        ...(newPhaseId && { phase: newPhaseId }),
        updated: new Date().toISOString(),
    };
    // Create updated item
    const updatedItem = {
        ...item,
        frontmatter: updatedFrontmatter,
    };
    // Inject context
    return await injectContext(updatedItem, newStage, newPhaseId);
}
/**
 * Updates frontmatter without touching context or user content
 */
async function updateFrontmatterOnly(itemContent, itemPath, updates) {
    // Parse current item
    const item = (0, parser_1.parseItem)(itemContent, itemPath);
    // Update frontmatter
    const updatedFrontmatter = {
        ...item.frontmatter,
        ...updates,
        updated: new Date().toISOString(),
    };
    // Extract user content
    const userContent = (0, parser_1.extractUserContent)(itemContent);
    // Read current stage context
    const stageContent = await (0, fs_adapter_1.readContextFile)('stage', updatedFrontmatter.stage);
    // Read phase context if applicable
    let phaseContent = '';
    let phaseTitle = '';
    if (updatedFrontmatter.phase) {
        phaseContent = await (0, fs_adapter_1.readContextFile)('phase', updatedFrontmatter.phase);
        try {
            const phasePath = await (0, fs_adapter_1.findItemById)(updatedFrontmatter.phase);
            if (phasePath) {
                const phaseFileContent = await (0, fs_adapter_1.readItem)(phasePath);
                const phaseItem = (0, parser_1.parseItem)(phaseFileContent, phasePath);
                phaseTitle = phaseItem.frontmatter.title;
            }
        }
        catch {
            phaseTitle = updatedFrontmatter.phase;
        }
    }
    // Build managed section
    const managedContent = (0, parser_1.buildManagedSection)(updatedFrontmatter.stage, stageContent, phaseTitle, phaseContent);
    // Serialize
    return (0, parser_1.serializeItem)(updatedFrontmatter, managedContent, userContent);
}
//# sourceMappingURL=context-injector.js.map