import { v4 as uuidv4 } from 'uuid';
import type {
  IndicatorNode,
  IndicatorTreeState,
  SchemaStatus,
  ValidationError as SchemaValidationError
} from '@/store/useIndicatorBuilderStore';

/**
 * Tree Utilities for Hierarchical Indicators
 *
 * Provides functions for:
 * - Code calculation (1.1, 1.1.1, etc.)
 * - Tree validation
 * - Tree transformations (flat ↔ nested)
 * - Node search and navigation
 */

// ============================================================================
// Code Calculation
// ============================================================================

/**
 * Recalculate codes for entire tree
 * Codes are based on position in hierarchy (e.g., "1", "1.1", "1.1.1", "1.2", "2")
 *
 * @param nodes - Map of all nodes
 * @param rootIds - Array of root node IDs
 * @returns Updated Map with recalculated codes
 */
export function recalculateCodes(
  nodes: Map<string, IndicatorNode>,
  rootIds: string[]
): Map<string, IndicatorNode> {
  const updatedNodes = new Map(nodes);

  // Calculate codes for each root and its descendants
  rootIds.forEach((rootId, index) => {
    const rootCode = `${index + 1}`;
    recalculateNodeCode(updatedNodes, rootId, rootCode);
  });

  return updatedNodes;
}

/**
 * Recursively calculate code for a node and its descendants
 */
function recalculateNodeCode(
  nodes: Map<string, IndicatorNode>,
  nodeId: string,
  code: string
): void {
  const node = nodes.get(nodeId);
  if (!node) return;

  // Set this node's code
  node.code = code;

  // Get children sorted by order
  const children = Array.from(nodes.values())
    .filter(n => n.parent_temp_id === nodeId)
    .sort((a, b) => a.order - b.order);

  // Recursively calculate children codes
  children.forEach((child, index) => {
    const childCode = `${code}.${index + 1}`;
    recalculateNodeCode(nodes, child.temp_id, childCode);
  });
}

// ============================================================================
// Tree Transformations
// ============================================================================

/**
 * Build nested tree structure from flat Map
 * Used for display in tree components (react-arborist)
 *
 * @param nodes - Flat Map of nodes
 * @param rootIds - Array of root node IDs
 * @returns Array of nested tree nodes
 */
export function buildTreeFromFlat(
  nodes: Map<string, IndicatorNode>,
  rootIds: string[]
): IndicatorNode[] {
  const buildChildren = (parentId: string | null): IndicatorNode[] => {
    return Array.from(nodes.values())
      .filter(node => node.parent_temp_id === parentId)
      .sort((a, b) => a.order - b.order)
      .map(node => ({
        ...node,
        children: buildChildren(node.temp_id),
      })) as IndicatorNode[];
  };

  // Build from roots
  return rootIds
    .map(rootId => {
      const root = nodes.get(rootId);
      if (!root) return null;
      return {
        ...root,
        children: buildChildren(rootId),
      } as IndicatorNode;
    })
    .filter(Boolean) as IndicatorNode[];
}

/**
 * Flatten nested tree structure to Map
 * Inverse of buildTreeFromFlat
 *
 * @param tree - Array of nested tree nodes
 * @returns Object with flat Map and root IDs
 */
export function flattenTree(tree: IndicatorNode[]): {
  nodes: Map<string, IndicatorNode>;
  rootIds: string[];
} {
  const nodes = new Map<string, IndicatorNode>();
  const rootIds: string[] = [];

  const flatten = (node: IndicatorNode) => {
    // Store node without children property
    const { children, ...nodeData } = node as any;
    nodes.set(node.temp_id, nodeData);

    // Recursively flatten children
    if (children && Array.isArray(children)) {
      children.forEach(flatten);
    }
  };

  tree.forEach(root => {
    rootIds.push(root.temp_id);
    flatten(root);
  });

  return { nodes, rootIds };
}

/**
 * Convert Map to plain object for serialization
 * (localStorage and API submission)
 */
export function serializeNodes(nodes: Map<string, IndicatorNode>): Record<string, IndicatorNode> {
  const obj: Record<string, IndicatorNode> = {};
  nodes.forEach((node, key) => {
    obj[key] = node;
  });
  return obj;
}

/**
 * Convert plain object to Map for deserialization
 */
export function deserializeNodes(obj: Record<string, IndicatorNode>): Map<string, IndicatorNode> {
  return new Map(Object.entries(obj));
}

// ============================================================================
// Tree Validation
// ============================================================================

export interface ValidationError {
  nodeId: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate entire tree structure and node data
 *
 * @param tree - Tree state to validate
 * @returns Array of validation errors
 */
export function validateTree(tree: IndicatorTreeState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { nodes, rootIds } = tree;

  // Validation: At least one root node
  if (rootIds.length === 0) {
    errors.push({
      nodeId: '',
      message: 'Tree must have at least one indicator',
      severity: 'error',
    });
    return errors; // Can't proceed with other validations
  }

  // Validate each node
  nodes.forEach(node => {
    // Required fields
    if (!node.name || node.name.trim().length === 0) {
      errors.push({
        nodeId: node.temp_id,
        field: 'name',
        message: 'Indicator name is required',
        severity: 'error',
      });
    }

    if (node.name && node.name.length < 3) {
      errors.push({
        nodeId: node.temp_id,
        field: 'name',
        message: 'Indicator name must be at least 3 characters',
        severity: 'error',
      });
    }

    // Validate parent exists (if not root)
    if (node.parent_temp_id && !nodes.has(node.parent_temp_id)) {
      errors.push({
        nodeId: node.temp_id,
        field: 'parent_temp_id',
        message: 'Parent indicator not found',
        severity: 'error',
      });
    }

    // Warn if no description
    if (!node.description || node.description.trim().length === 0) {
      errors.push({
        nodeId: node.temp_id,
        field: 'description',
        message: 'Consider adding a description for clarity',
        severity: 'warning',
      });
    }

    // Validate form schema if present
    if (node.form_schema) {
      if (!node.form_schema.fields || !Array.isArray(node.form_schema.fields)) {
        errors.push({
          nodeId: node.temp_id,
          field: 'form_schema',
          message: 'Form schema must have a fields array',
          severity: 'error',
        });
      }
    }

    // Auto-calculable requires children
    if (node.is_auto_calculable) {
      const hasChildren = Array.from(nodes.values()).some(
        n => n.parent_temp_id === node.temp_id
      );
      if (!hasChildren) {
        errors.push({
          nodeId: node.temp_id,
          field: 'is_auto_calculable',
          message: 'Auto-calculable indicators must have children',
          severity: 'error',
        });
      }
    }
  });

  // Validate no circular references
  const circularErrors = detectCircularReferences(nodes);
  errors.push(...circularErrors);

  // Validate no orphaned nodes
  const orphanedErrors = detectOrphanedNodes(nodes, rootIds);
  errors.push(...orphanedErrors);

  return errors;
}

/**
 * Detect circular references in parent-child relationships
 */
function detectCircularReferences(nodes: Map<string, IndicatorNode>): ValidationError[] {
  const errors: ValidationError[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const detectCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }
    if (visited.has(nodeId)) {
      return false; // Already checked
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodes.get(nodeId);
    if (node && node.parent_temp_id) {
      if (detectCycle(node.parent_temp_id)) {
        errors.push({
          nodeId,
          field: 'parent_temp_id',
          message: 'Circular reference detected in parent-child relationship',
          severity: 'error',
        });
        recursionStack.delete(nodeId);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  nodes.forEach((_, nodeId) => {
    if (!visited.has(nodeId)) {
      detectCycle(nodeId);
    }
  });

  return errors;
}

/**
 * Detect nodes that are neither roots nor have valid parents
 */
function detectOrphanedNodes(
  nodes: Map<string, IndicatorNode>,
  rootIds: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const reachable = new Set<string>(rootIds);

  // Mark all reachable nodes
  const markReachable = (nodeId: string) => {
    const children = Array.from(nodes.values()).filter(
      n => n.parent_temp_id === nodeId
    );
    children.forEach(child => {
      reachable.add(child.temp_id);
      markReachable(child.temp_id);
    });
  };

  rootIds.forEach(markReachable);

  // Find orphaned nodes
  nodes.forEach((node, nodeId) => {
    if (!reachable.has(nodeId)) {
      errors.push({
        nodeId,
        message: 'Orphaned indicator (not reachable from any root)',
        severity: 'error',
      });
    }
  });

  return errors;
}

// ============================================================================
// Schema Validation & Completion Status
// ============================================================================

/**
 * Calculate schema completion status for an indicator
 *
 * Determines whether each schema type (form, calculation, remark) is complete
 * and returns an overall completion status with validation errors.
 *
 * @param indicator - The indicator node to check
 * @returns SchemaStatus object with completion flags and errors
 *
 * @example
 * ```typescript
 * const status = calculateSchemaStatus(indicator);
 * if (status.isComplete) {
 *   console.log('All schemas configured!');
 * } else {
 *   console.log(`${status.errors.length} errors found`);
 * }
 * ```
 */
export function calculateSchemaStatus(indicator: IndicatorNode): SchemaStatus {
  const errors: SchemaValidationError[] = [];

  // Check form schema completeness
  const hasFormSchema = indicator.form_schema &&
    indicator.form_schema.fields &&
    Array.isArray(indicator.form_schema.fields) &&
    indicator.form_schema.fields.length > 0;

  const formComplete = !!hasFormSchema;

  // Validate form schema if present
  if (indicator.form_schema && !hasFormSchema) {
    errors.push({
      field: 'form',
      message: 'Form schema must have at least one field',
      severity: 'error',
    });
  }

  // Check calculation schema completeness
  const hasCalculationSchema = indicator.calculation_schema &&
    indicator.calculation_schema.formula &&
    indicator.calculation_schema.formula.trim().length > 0;

  const calculationComplete = !!hasCalculationSchema;

  // Validate calculation schema if present
  if (indicator.calculation_schema && !hasCalculationSchema) {
    errors.push({
      field: 'calculation',
      message: 'Calculation schema must have a formula',
      severity: 'error',
    });
  }

  // Check remark schema completeness (optional but should have content if present)
  const hasRemarkSchema = indicator.remark_schema &&
    typeof indicator.remark_schema === 'string' &&
    indicator.remark_schema.trim().length > 0;

  const remarkComplete = !!hasRemarkSchema;

  // Overall completion: all three schemas must be complete
  const isComplete = formComplete && calculationComplete && remarkComplete;

  return {
    formComplete,
    calculationComplete,
    remarkComplete,
    isComplete,
    errors,
    lastEdited: Date.now(),
  };
}

/**
 * Validate indicator schemas and return detailed errors
 *
 * Performs deep validation on all three schema types and returns
 * specific validation errors for each field.
 *
 * @param indicator - The indicator node to validate
 * @returns Array of validation errors
 *
 * @example
 * ```typescript
 * const errors = validateIndicatorSchemas(indicator);
 * if (errors.length > 0) {
 *   errors.forEach(error => {
 *     console.error(`${error.field}: ${error.message}`);
 *   });
 * }
 * ```
 */
export function validateIndicatorSchemas(indicator: IndicatorNode): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  // ============================================================================
  // Form Schema Validation
  // ============================================================================

  if (indicator.form_schema) {
    const formSchema = indicator.form_schema;

    // Must have fields array
    if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
      errors.push({
        field: 'form',
        message: 'Form schema must have a fields array',
        severity: 'error',
      });
    } else {
      // Must have at least one field
      if (formSchema.fields.length === 0) {
        errors.push({
          field: 'form',
          message: 'Form schema must have at least one field',
          severity: 'error',
        });
      }

      // Validate each field
      formSchema.fields.forEach((field: any, index: number) => {
        // Field must have name
        if (!field.name || field.name.trim().length === 0) {
          errors.push({
            field: 'form',
            message: `Field ${index + 1}: Name is required`,
            severity: 'error',
          });
        }

        // Field must have label
        if (!field.label || field.label.trim().length === 0) {
          errors.push({
            field: 'form',
            message: `Field ${index + 1} (${field.name}): Label is required`,
            severity: 'error',
          });
        }

        // Field must have type
        if (!field.type) {
          errors.push({
            field: 'form',
            message: `Field ${index + 1} (${field.name}): Field type is required`,
            severity: 'error',
          });
        }

        // Validate select/radio options
        if ((field.type === 'select' || field.type === 'radio') &&
            (!field.options || field.options.length === 0)) {
          errors.push({
            field: 'form',
            message: `Field ${index + 1} (${field.name}): Select/radio fields must have options`,
            severity: 'error',
          });
        }
      });

      // Warn if no fields have validation rules
      const hasValidation = formSchema.fields.some((field: any) =>
        field.validation && field.validation.length > 0
      );
      if (!hasValidation) {
        errors.push({
          field: 'form',
          message: 'Consider adding validation rules to ensure data quality',
          severity: 'warning',
        });
      }
    }
  } else {
    // Form schema is required
    errors.push({
      field: 'form',
      message: 'Form schema is required for data collection',
      severity: 'error',
    });
  }

  // ============================================================================
  // Calculation Schema Validation
  // ============================================================================

  if (indicator.calculation_schema) {
    const calcSchema = indicator.calculation_schema;

    // Must have formula
    if (!calcSchema.formula || calcSchema.formula.trim().length === 0) {
      errors.push({
        field: 'calculation',
        message: 'Calculation formula is required',
        severity: 'error',
      });
    } else {
      // Validate formula syntax (basic check)
      const formula = calcSchema.formula.trim();

      // Check for basic arithmetic operators
      const hasOperators = /[+\-*/()]/.test(formula);
      if (!hasOperators && !formula.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        errors.push({
          field: 'calculation',
          message: 'Formula should contain arithmetic operations or be a valid field reference',
          severity: 'warning',
        });
      }

      // Check for unmatched parentheses
      const openCount = (formula.match(/\(/g) || []).length;
      const closeCount = (formula.match(/\)/g) || []).length;
      if (openCount !== closeCount) {
        errors.push({
          field: 'calculation',
          message: 'Unmatched parentheses in formula',
          severity: 'error',
        });
      }
    }

    // Validate result type
    if (calcSchema.result_type && !['number', 'percentage', 'boolean', 'text'].includes(calcSchema.result_type)) {
      errors.push({
        field: 'calculation',
        message: 'Invalid result type (must be: number, percentage, boolean, or text)',
        severity: 'error',
      });
    }
  } else {
    // Calculation schema is required
    errors.push({
      field: 'calculation',
      message: 'Calculation schema is required for scoring',
      severity: 'error',
    });
  }

  // ============================================================================
  // Remark Schema Validation
  // ============================================================================

  if (indicator.remark_schema) {
    const remarkSchema = indicator.remark_schema;

    // Must be a string
    if (typeof remarkSchema !== 'string') {
      errors.push({
        field: 'remark',
        message: 'Remark template must be a string',
        severity: 'error',
      });
    } else {
      // Must have content
      if (remarkSchema.trim().length === 0) {
        errors.push({
          field: 'remark',
          message: 'Remark template should not be empty',
          severity: 'warning',
        });
      }

      // Warn if very short
      if (remarkSchema.trim().length < 10) {
        errors.push({
          field: 'remark',
          message: 'Consider adding more detailed remark guidance',
          severity: 'warning',
        });
      }
    }
  } else {
    // Remark schema is optional but recommended
    errors.push({
      field: 'remark',
      message: 'Consider adding a remark template to guide assessors',
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Check if an indicator has complete and valid schemas
 *
 * Quick utility to check if all three schemas are present and valid.
 *
 * @param indicator - The indicator node to check
 * @returns True if all schemas are complete with no errors
 */
export function hasSchemasComplete(indicator: IndicatorNode): boolean {
  const status = calculateSchemaStatus(indicator);
  return status.isComplete && status.errors.length === 0;
}

/**
 * Get schema completion percentage for an indicator
 *
 * Returns a percentage (0-100) of how complete the schemas are.
 *
 * @param indicator - The indicator node to check
 * @returns Completion percentage (0-100)
 */
export function getSchemaCompletionPercentage(indicator: IndicatorNode): number {
  const status = calculateSchemaStatus(indicator);
  let completed = 0;

  if (status.formComplete) completed++;
  if (status.calculationComplete) completed++;
  if (status.remarkComplete) completed++;

  return Math.round((completed / 3) * 100);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a new temporary ID (UUID v4)
 */
export function generateTempId(): string {
  return uuidv4();
}

/**
 * Find a node by temp_id
 */
export function findNode(
  nodes: Map<string, IndicatorNode>,
  tempId: string
): IndicatorNode | undefined {
  return nodes.get(tempId);
}

/**
 * Find parent of a node
 */
export function findParent(
  nodes: Map<string, IndicatorNode>,
  node: IndicatorNode
): IndicatorNode | null {
  if (!node.parent_temp_id) return null;
  return nodes.get(node.parent_temp_id) || null;
}

/**
 * Find all children of a node
 */
export function findChildren(
  nodes: Map<string, IndicatorNode>,
  parentId: string | null
): IndicatorNode[] {
  return Array.from(nodes.values())
    .filter(node => node.parent_temp_id === parentId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Find all descendants of a node (recursive)
 */
export function findDescendants(
  nodes: Map<string, IndicatorNode>,
  nodeId: string
): IndicatorNode[] {
  const descendants: IndicatorNode[] = [];

  const collect = (id: string) => {
    const children = findChildren(nodes, id);
    children.forEach(child => {
      descendants.push(child);
      collect(child.temp_id);
    });
  };

  collect(nodeId);
  return descendants;
}

/**
 * Find all ancestors of a node (up to root)
 */
export function findAncestors(
  nodes: Map<string, IndicatorNode>,
  node: IndicatorNode
): IndicatorNode[] {
  const ancestors: IndicatorNode[] = [];
  let current = node;

  while (current.parent_temp_id) {
    const parent = nodes.get(current.parent_temp_id);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

/**
 * Get depth level of a node (0 = root, 1 = child of root, etc.)
 */
export function getNodeDepth(
  nodes: Map<string, IndicatorNode>,
  node: IndicatorNode
): number {
  let depth = 0;
  let current = node;

  while (current.parent_temp_id) {
    const parent = nodes.get(current.parent_temp_id);
    if (!parent) break;
    depth++;
    current = parent;
  }

  return depth;
}

/**
 * Get total count of all nodes in tree
 */
export function getNodeCount(nodes: Map<string, IndicatorNode>): number {
  return nodes.size;
}

/**
 * Get count of root nodes
 */
export function getRootCount(rootIds: string[]): number {
  return rootIds.length;
}

/**
 * Get count of leaf nodes (nodes with no children)
 */
export function getLeafCount(nodes: Map<string, IndicatorNode>): number {
  let count = 0;
  nodes.forEach(node => {
    const hasChildren = Array.from(nodes.values()).some(
      n => n.parent_temp_id === node.temp_id
    );
    if (!hasChildren) count++;
  });
  return count;
}

/**
 * Get maximum depth of the tree
 */
export function getMaxDepth(
  nodes: Map<string, IndicatorNode>,
  rootIds: string[]
): number {
  let maxDepth = 0;

  const calculateDepth = (nodeId: string, currentDepth: number) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    const children = findChildren(nodes, nodeId);
    children.forEach(child => {
      calculateDepth(child.temp_id, currentDepth + 1);
    });
  };

  rootIds.forEach(rootId => {
    calculateDepth(rootId, 0);
  });

  return maxDepth;
}

/**
 * Check if node A is an ancestor of node B
 */
export function isAncestor(
  nodes: Map<string, IndicatorNode>,
  ancestorId: string,
  descendantId: string
): boolean {
  let current = nodes.get(descendantId);
  if (!current) return false;

  while (current.parent_temp_id) {
    if (current.parent_temp_id === ancestorId) return true;
    current = nodes.get(current.parent_temp_id);
    if (!current) break;
  }

  return false;
}

/**
 * Get path from root to node (as array of codes)
 */
export function getNodePath(
  nodes: Map<string, IndicatorNode>,
  node: IndicatorNode
): string[] {
  const path: string[] = [];
  let current = node;

  while (true) {
    path.unshift(current.code || current.temp_id);
    if (!current.parent_temp_id) break;
    const parent = nodes.get(current.parent_temp_id);
    if (!parent) break;
    current = parent;
  }

  return path;
}

/**
 * Get breadcrumb trail for a node
 */
export function getBreadcrumbs(
  nodes: Map<string, IndicatorNode>,
  node: IndicatorNode
): Array<{ id: string; name: string; code?: string }> {
  const breadcrumbs: Array<{ id: string; name: string; code?: string }> = [];
  let current = node;

  while (true) {
    breadcrumbs.unshift({
      id: current.temp_id,
      name: current.name,
      code: current.code,
    });
    if (!current.parent_temp_id) break;
    const parent = nodes.get(current.parent_temp_id);
    if (!parent) break;
    current = parent;
  }

  return breadcrumbs;
}
