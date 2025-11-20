// lib/context-injector.ts
import { readContextFile, findItemById, readItem } from './fs-adapter';
import { parseItem, buildManagedSection, serializeItem, extractUserContent } from './parser';
import type { Item, Stage, Frontmatter } from './types';

async function resolveAgentAndContexts(frontmatter: Frontmatter): Promise<{ agentContent?: string; contextItems: { id: string; content: string }[] }> {
  const contextItems: { id: string; content: string }[] = [];
  const agentContent = frontmatter.agent
    ? await readContextFile('agent', frontmatter.agent)
    : undefined;

  if (frontmatter.contexts && frontmatter.contexts.length > 0) {
    for (const ctxId of frontmatter.contexts) {
      const ctxContent = await readContextFile('context', ctxId);
      contextItems.push({
        id: ctxId,
        content: ctxContent.trim() || '_No context content defined yet._',
      });
    }
  }

  return { agentContent, contextItems };
}

/**
 * Injects stage and phase context into an item
 * Preserves user content below the separator
 */
export async function injectContext(
  item: Item,
  newStage: Stage,
  newPhaseId?: string
): Promise<string> {
  // Read stage context
  const stageContent = await readContextFile('stage', newStage);

  // Read phase context if phase is specified
  let phaseContent = '';
  let phaseTitle = '';

  const phaseId = newPhaseId || item.frontmatter.phase;

  if (phaseId) {
    phaseContent = await readContextFile('phase', phaseId);

    // Try to get phase title from phase file
    if (phaseContent) {
      try {
        const phasePath = await findItemById(phaseId);
        if (phasePath) {
          const phaseFileContent = await readItem(phasePath);
          const phaseItem = parseItem(phaseFileContent, phasePath);
          phaseTitle = phaseItem.frontmatter.title;
        }
      } catch {
        // If we can't read phase file, use phaseId as title
        phaseTitle = phaseId;
      }
    }
  }

  // Build managed section
  const { agentContent, contextItems } = await resolveAgentAndContexts(item.frontmatter);

  const managedContent = buildManagedSection(
    newStage,
    stageContent,
    phaseTitle,
    phaseContent,
    item.frontmatter.agent,
    agentContent,
    contextItems
  );

  // Serialize with user content preserved
  return serializeItem(
    item.frontmatter,
    managedContent,
    item.body
  );
}

/**
 * Creates a new item with context injection
 */
export async function createItemWithContext(
  frontmatter: Frontmatter,
  initialUserContent: string = ''
): Promise<string> {
  // Read stage context
  const stageContent = await readContextFile('stage', frontmatter.stage);

  // Read phase context if applicable
  let phaseContent = '';
  let phaseTitle = '';

  if (frontmatter.phase) {
    phaseContent = await readContextFile('phase', frontmatter.phase);

    // Try to get phase title from phase file
    try {
      const phasePath = await findItemById(frontmatter.phase);
      if (phasePath) {
        const phaseFileContent = await readItem(phasePath);
        const phaseItem = parseItem(phaseFileContent, phasePath);
        phaseTitle = phaseItem.frontmatter.title;
      }
    } catch {
      // If we can't read phase file, use phase ID as title
      phaseTitle = frontmatter.phase;
    }
  }

  // Build managed section
  const { agentContent, contextItems } = await resolveAgentAndContexts(frontmatter);

  const managedContent = buildManagedSection(
    frontmatter.stage,
    stageContent,
    phaseTitle,
    phaseContent,
    frontmatter.agent,
    agentContent,
    contextItems
  );

  // Serialize
  return serializeItem(
    frontmatter,
    managedContent,
    initialUserContent
  );
}

/**
 * Re-injects context when moving an item to a new stage
 * Preserves user content
 */
export async function reinjectContextForStageChange(
  itemContent: string,
  itemPath: string,
  newStage: Stage,
  newPhaseId?: string
): Promise<string> {
  // Parse current item
  const item = parseItem(itemContent, itemPath);

  // Update stage in frontmatter
  const updatedFrontmatter = {
    ...item.frontmatter,
    stage: newStage,
    ...(newPhaseId && { phase: newPhaseId }),
    updated: new Date().toISOString(),
  };

  // Create updated item
  const updatedItem: Item = {
    ...item,
    frontmatter: updatedFrontmatter,
  };

  // Inject context
  return await injectContext(updatedItem, newStage, newPhaseId);
}

/**
 * Updates frontmatter without touching context or user content
 */
export async function updateFrontmatterOnly(
  itemContent: string,
  itemPath: string,
  updates: Partial<Frontmatter>
): Promise<string> {
  // Parse current item
  const item = parseItem(itemContent, itemPath);

  // Update frontmatter
  const updatedFrontmatter = {
    ...item.frontmatter,
    ...updates,
    updated: new Date().toISOString(),
  };

  // Extract user content
  const userContent = extractUserContent(itemContent);

  // Read current stage context
  const stageContent = await readContextFile('stage', updatedFrontmatter.stage);

  // Read phase context if applicable
  let phaseContent = '';
  let phaseTitle = '';

  if (updatedFrontmatter.phase) {
    phaseContent = await readContextFile('phase', updatedFrontmatter.phase);

    try {
      const phasePath = await findItemById(updatedFrontmatter.phase);
      if (phasePath) {
        const phaseFileContent = await readItem(phasePath);
        const phaseItem = parseItem(phaseFileContent, phasePath);
        phaseTitle = phaseItem.frontmatter.title;
      }
    } catch {
      phaseTitle = updatedFrontmatter.phase;
    }
  }

  // Build managed section
  const { agentContent, contextItems } = await resolveAgentAndContexts(updatedFrontmatter);

  const managedContent = buildManagedSection(
    updatedFrontmatter.stage,
    stageContent,
    phaseTitle,
    phaseContent,
    updatedFrontmatter.agent,
    agentContent,
    contextItems
  );

  // Serialize
  return serializeItem(
    updatedFrontmatter,
    managedContent,
    userContent
  );
}
