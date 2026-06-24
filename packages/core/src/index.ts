// ===== packages/core/src/index.ts =====
// @auto-form-filler/core 主入口

export { NativeSetter } from './event/NativeSetter.js';
export { EventSimulator } from './event/EventSimulator.js';
export { EVENT_CHAINS } from './event/event-chains.js';

export { DOMScanner } from './field/DOMScanner.js';
export { FieldClassifier } from './field/FieldClassifier.js';
export { LabelParser } from './field/LabelParser.js';
export { FieldDetector } from './field/FieldDetector.js';

export { FieldMatcher } from './engine/FieldMatcher.js';
export { ActionQueue } from './engine/ActionQueue.js';
export type { QueuedAction } from './engine/ActionQueue.js';
export { FormFiller } from './engine/FormFiller.js';
export type { FillOptions, FillReport, FillDetail } from './engine/FormFiller.js';

export { flattenResumeData, VALUE_TRANSFORMS } from './schema/index.js';

export * from './utils/index.js';
