import { describe, it, expect } from 'vitest';
import {
  recalculateCodes,
  buildTreeFromFlat,
  validateTree,
  flattenTree,
  generateTempId,
  findNode,
  findParent,
  findChildren,
  findDescendants,
  findAncestors,
  getNodeDepth,
  getMaxDepth,
  getNodeCount,
  isAncestor,
  getNodePath,
  getBreadcrumbs,
} from '../indicator-tree-utils';
import type { IndicatorNode } from '@/store/useIndicatorBuilderStore';

describe('indicator-tree-utils', () => {
  // Helper function to create a test node
  const createNode = (
    id: string,
    name: string,
    parent_temp_id: string | null = null,
    code?: string,
    order: number = 0
  ): IndicatorNode => ({
    temp_id: id,
    parent_temp_id,
    order,
    name,
    code,
    is_active: true,
    is_auto_calculable: false,
    is_profiling_only: false,
  });

  describe('generateTempId', () => {
    it('should generate a valid UUID', () => {
      const id = generateTempId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateTempId();
      const id2 = generateTempId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('recalculateCodes', () => {
    it('should calculate codes for a flat list of root nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['a', createNode('a', 'First', null, undefined, 0)],
        ['b', createNode('b', 'Second', null, undefined, 1)],
        ['c', createNode('c', 'Third', null, undefined, 2)],
      ]);

      const result = recalculateCodes(nodes, ['a', 'b', 'c']);

      expect(result.get('a')?.code).toBe('1');
      expect(result.get('b')?.code).toBe('2');
      expect(result.get('c')?.code).toBe('3');
    });

    it('should calculate codes for a hierarchy', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null, undefined, 0)],
        ['child1', createNode('child1', 'Child 1', 'root', undefined, 0)],
        ['child2', createNode('child2', 'Child 2', 'root', undefined, 1)],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child1', undefined, 0)],
      ]);

      const result = recalculateCodes(nodes, ['root']);

      expect(result.get('root')?.code).toBe('1');
      expect(result.get('child1')?.code).toBe('1.1');
      expect(result.get('child2')?.code).toBe('1.2');
      expect(result.get('grandchild')?.code).toBe('1.1.1');
    });

    it('should handle multiple root hierarchies', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root1', createNode('root1', 'Root 1', null, undefined, 0)],
        ['root1_child', createNode('root1_child', 'Root 1 Child', 'root1', undefined, 0)],
        ['root2', createNode('root2', 'Root 2', null, undefined, 1)],
        ['root2_child', createNode('root2_child', 'Root 2 Child', 'root2', undefined, 0)],
      ]);

      const result = recalculateCodes(nodes, ['root1', 'root2']);

      expect(result.get('root1')?.code).toBe('1');
      expect(result.get('root1_child')?.code).toBe('1.1');
      expect(result.get('root2')?.code).toBe('2');
      expect(result.get('root2_child')?.code).toBe('2.1');
    });

    it('should preserve node data except for code', () => {
      const nodes = new Map<string, IndicatorNode>([
        [
          'a',
          {
            temp_id: 'a',
            parent_temp_id: null,
            order: 0,
            name: 'Test',
            description: 'Test description',
            is_active: false,
            is_auto_calculable: true,
            is_profiling_only: true,
          },
        ],
      ]);

      const result = recalculateCodes(nodes, ['a']);
      const node = result.get('a');

      expect(node?.name).toBe('Test');
      expect(node?.description).toBe('Test description');
      expect(node?.is_active).toBe(false);
      expect(node?.is_auto_calculable).toBe(true);
      expect(node?.is_profiling_only).toBe(true);
    });
  });

  describe('buildTreeFromFlat', () => {
    it('should build a tree structure from flat map', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null, '1', 0)],
        ['child1', createNode('child1', 'Child 1', 'root', '1.1', 0)],
        ['child2', createNode('child2', 'Child 2', 'root', '1.2', 1)],
      ]);

      const tree = buildTreeFromFlat(nodes, ['root']);

      expect(tree).toHaveLength(1);
      expect(tree[0].temp_id).toBe('root');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children?.[0].temp_id).toBe('child1');
      expect(tree[0].children?.[1].temp_id).toBe('child2');
    });

    it('should handle multiple root nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root1', createNode('root1', 'Root 1', null, '1', 0)],
        ['root2', createNode('root2', 'Root 2', null, '2', 1)],
      ]);

      const tree = buildTreeFromFlat(nodes, ['root1', 'root2']);

      expect(tree).toHaveLength(2);
      expect(tree[0].temp_id).toBe('root1');
      expect(tree[1].temp_id).toBe('root2');
    });

    it('should handle deep nesting', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null, '1', 0)],
        ['child', createNode('child', 'Child', 'root', '1.1', 0)],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child', '1.1.1', 0)],
        ['greatgrandchild', createNode('greatgrandchild', 'Great-grandchild', 'grandchild', '1.1.1.1', 0)],
      ]);

      const tree = buildTreeFromFlat(nodes, ['root']);

      expect(tree[0].children?.[0].children?.[0].children?.[0].temp_id).toBe('greatgrandchild');
    });

    it('should return empty array for empty input', () => {
      const nodes = new Map<string, IndicatorNode>();
      const tree = buildTreeFromFlat(nodes, []);

      expect(tree).toEqual([]);
    });
  });

  describe('validateTree', () => {
    it('should validate a correct tree', () => {
      const treeState = {
        nodes: new Map<string, IndicatorNode>([
          ['root', createNode('root', 'Root', null)],
          ['child', createNode('child', 'Child', 'root')],
        ]),
        rootIds: ['root'],
        governanceAreaId: 1,
        creationMode: 'incremental',
        currentStep: 2,
      };

      const result = validateTree(treeState);

      expect(result).toHaveLength(0); // No errors
    });

    it('should detect missing names', () => {
      const treeState = {
        nodes: new Map<string, IndicatorNode>([
          ['root', createNode('root', '', null)],
        ]),
        rootIds: ['root'],
        governanceAreaId: 1,
        creationMode: 'incremental',
        currentStep: 2,
      };

      const result = validateTree(treeState);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((e) => e.message.includes('name'))).toBe(true);
    });

    it('should detect missing parent references', () => {
      const treeState = {
        nodes: new Map<string, IndicatorNode>([
          ['root', createNode('root', 'Root', null)],
          ['orphan', createNode('orphan', 'Orphan', 'nonexistent')],
        ]),
        rootIds: ['root', 'orphan'],
        governanceAreaId: 1,
        creationMode: 'incremental',
        currentStep: 2,
      };

      const result = validateTree(treeState);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((e) => e.message.includes('parent'))).toBe(true);
    });

    it('should validate a complex valid tree', () => {
      const treeState = {
        nodes: new Map<string, IndicatorNode>([
          ['root1', createNode('root1', 'Root 1', null)],
          ['root1_child1', createNode('root1_child1', 'Child 1', 'root1')],
          ['root1_child2', createNode('root1_child2', 'Child 2', 'root1')],
          ['root2', createNode('root2', 'Root 2', null)],
          ['root2_child', createNode('root2_child', 'Child', 'root2')],
        ]),
        rootIds: ['root1', 'root2'],
        governanceAreaId: 1,
        creationMode: 'incremental',
        currentStep: 2,
      };

      const result = validateTree(treeState);

      expect(result).toHaveLength(0); // No errors
    });
  });

  describe('flattenTree', () => {
    it('should flatten a tree structure', () => {
      const tree: IndicatorNode[] = [
        {
          temp_id: 'root',
          parent_temp_id: null,
          order: 0,
          name: 'Root',
          is_active: true,
          is_auto_calculable: false,
          is_profiling_only: false,
          children: [
            {
              temp_id: 'child',
              parent_temp_id: 'root',
              order: 0,
              name: 'Child',
              is_active: true,
              is_auto_calculable: false,
              is_profiling_only: false,
              children: [],
            },
          ],
        },
      ];

      const { nodes, rootIds } = flattenTree(tree);

      expect(nodes.size).toBe(2);
      expect(nodes.has('root')).toBe(true);
      expect(nodes.has('child')).toBe(true);
      expect(rootIds).toEqual(['root']);
    });

    it('should handle multiple roots', () => {
      const tree: IndicatorNode[] = [
        {
          temp_id: 'root1',
          parent_temp_id: null,
          order: 0,
          name: 'Root 1',
          is_active: true,
          is_auto_calculable: false,
          is_profiling_only: false,
          children: [],
        },
        {
          temp_id: 'root2',
          parent_temp_id: null,
          order: 1,
          name: 'Root 2',
          is_active: true,
          is_auto_calculable: false,
          is_profiling_only: false,
          children: [],
        },
      ];

      const { nodes, rootIds } = flattenTree(tree);

      expect(nodes.size).toBe(2);
      expect(rootIds).toEqual(['root1', 'root2']);
    });
  });

  describe('findNode', () => {
    it('should find an existing node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['a', createNode('a', 'Node A', null)],
        ['b', createNode('b', 'Node B', null)],
      ]);

      const node = findNode(nodes, 'b');

      expect(node).toBeDefined();
      expect(node?.data.name).toBe('Node B');
    });

    it('should return undefined for non-existent node', () => {
      const nodes = new Map<string, IndicatorNode>();

      const node = findNode(nodes, 'nonexistent');

      expect(node).toBeUndefined();
    });
  });

  describe('findParent', () => {
    it('should find the parent of a node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['parent', createNode('parent', 'Parent', null)],
        ['child', createNode('child', 'Child', 'parent')],
      ]);

      const parent = findParent(nodes, 'child');

      expect(parent).toBeDefined();
      expect(parent?.temp_id).toBe('parent');
    });

    it('should return undefined for root nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
      ]);

      const parent = findParent(nodes, 'root');

      expect(parent).toBeUndefined();
    });

    it('should return undefined if parent does not exist', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['orphan', createNode('orphan', 'Orphan', 'missing')],
      ]);

      const parent = findParent(nodes, 'orphan');

      expect(parent).toBeUndefined();
    });
  });

  describe('findChildren', () => {
    it('should find all direct children', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['parent', createNode('parent', 'Parent', null)],
        ['child1', createNode('child1', 'Child 1', 'parent')],
        ['child2', createNode('child2', 'Child 2', 'parent')],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child1')],
      ]);

      const children = findChildren(nodes, 'parent');

      expect(children).toHaveLength(2);
      expect(children.map((c) => c.temp_id).sort()).toEqual(['child1', 'child2']);
    });

    it('should return empty array for leaf nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['leaf', createNode('leaf', 'Leaf', null)],
      ]);

      const children = findChildren(nodes, 'leaf');

      expect(children).toHaveLength(0);
    });
  });

  describe('findDescendants', () => {
    it('should find all descendants', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['child1', createNode('child1', 'Child 1', 'root')],
        ['child2', createNode('child2', 'Child 2', 'root')],
        ['grandchild1', createNode('grandchild1', 'Grandchild 1', 'child1')],
        ['grandchild2', createNode('grandchild2', 'Grandchild 2', 'child1')],
      ]);

      const descendants = findDescendants(nodes, 'root');

      expect(descendants).toHaveLength(4);
      expect(descendants.map((d) => d.temp_id).sort()).toEqual([
        'child1',
        'child2',
        'grandchild1',
        'grandchild2',
      ]);
    });

    it('should return empty array for leaf nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['leaf', createNode('leaf', 'Leaf', null)],
      ]);

      const descendants = findDescendants(nodes, 'leaf');

      expect(descendants).toHaveLength(0);
    });
  });

  describe('findAncestors', () => {
    it('should find all ancestors', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['parent', createNode('parent', 'Parent', 'root')],
        ['child', createNode('child', 'Child', 'parent')],
      ]);

      const ancestors = findAncestors(nodes, 'child');

      expect(ancestors).toHaveLength(2);
      expect(ancestors.map((a) => a.temp_id)).toEqual(['parent', 'root']);
    });

    it('should return empty array for root nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
      ]);

      const ancestors = findAncestors(nodes, 'root');

      expect(ancestors).toHaveLength(0);
    });
  });

  describe('getNodeDepth', () => {
    it('should return 0 for root nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
      ]);

      const depth = getNodeDepth(nodes, 'root');

      expect(depth).toBe(0);
    });

    it('should calculate depth for nested nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['child', createNode('child', 'Child', 'root')],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child')],
      ]);

      expect(getNodeDepth(nodes, 'root')).toBe(0);
      expect(getNodeDepth(nodes, 'child')).toBe(1);
      expect(getNodeDepth(nodes, 'grandchild')).toBe(2);
    });

    it('should return 0 for non-existent nodes', () => {
      const nodes = new Map<string, IndicatorNode>();

      const depth = getNodeDepth(nodes, 'nonexistent');

      expect(depth).toBe(0);
    });
  });

  describe('getMaxDepth', () => {
    it('should return 0 for empty tree', () => {
      const nodes = new Map<string, IndicatorNode>();

      const depth = getMaxDepth(nodes, []);

      expect(depth).toBe(0);
    });

    it('should calculate max depth for single root', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['child', createNode('child', 'Child', 'root')],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child')],
      ]);

      const depth = getMaxDepth(nodes, ['root']);

      expect(depth).toBe(2);
    });

    it('should calculate max depth across multiple roots', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root1', createNode('root1', 'Root 1', null)],
        ['root1_child', createNode('root1_child', 'Child', 'root1')],
        ['root2', createNode('root2', 'Root 2', null)],
        ['root2_child', createNode('root2_child', 'Child', 'root2')],
        ['root2_grandchild', createNode('root2_grandchild', 'Grandchild', 'root2_child')],
      ]);

      const depth = getMaxDepth(nodes, ['root1', 'root2']);

      expect(depth).toBe(2); // root2 -> root2_child -> root2_grandchild
    });
  });

  describe('getNodeCount', () => {
    it('should count all nodes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['a', createNode('a', 'A', null)],
        ['b', createNode('b', 'B', null)],
        ['c', createNode('c', 'C', 'a')],
      ]);

      const count = getNodeCount(nodes);

      expect(count).toBe(3);
    });

    it('should return 0 for empty map', () => {
      const nodes = new Map<string, IndicatorNode>();

      const count = getNodeCount(nodes);

      expect(count).toBe(0);
    });
  });

  describe('isAncestor', () => {
    it('should detect direct parent relationship', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['parent', createNode('parent', 'Parent', null)],
        ['child', createNode('child', 'Child', 'parent')],
      ]);

      const result = isAncestor(nodes, 'parent', 'child');

      expect(result).toBe(true);
    });

    it('should detect indirect ancestor relationship', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['parent', createNode('parent', 'Parent', 'root')],
        ['child', createNode('child', 'Child', 'parent')],
      ]);

      const result = isAncestor(nodes, 'root', 'child');

      expect(result).toBe(true);
    });

    it('should return false for non-ancestor relationships', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['a', createNode('a', 'A', null)],
        ['b', createNode('b', 'B', null)],
      ]);

      const result = isAncestor(nodes, 'a', 'b');

      expect(result).toBe(false);
    });

    it('should return false for self-relationship', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['a', createNode('a', 'A', null)],
      ]);

      const result = isAncestor(nodes, 'a', 'a');

      expect(result).toBe(false);
    });
  });

  describe('getNodePath', () => {
    it('should get path for root node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
      ]);

      const path = getNodePath(nodes, 'root');

      expect(path).toEqual(['root']);
    });

    it('should get full path for nested node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['child', createNode('child', 'Child', 'root')],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child')],
      ]);

      const path = getNodePath(nodes, 'grandchild');

      expect(path).toEqual(['root', 'child', 'grandchild']);
    });

    it('should return empty array for non-existent node', () => {
      const nodes = new Map<string, IndicatorNode>();

      const path = getNodePath(nodes, 'nonexistent');

      expect(path).toEqual([]);
    });
  });

  describe('getBreadcrumbs', () => {
    it('should get breadcrumbs for root node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null, '1')],
      ]);

      const breadcrumbs = getBreadcrumbs(nodes, 'root');

      expect(breadcrumbs).toEqual([{ id: 'root', name: 'Root', code: '1' }]);
    });

    it('should get full breadcrumbs for nested node', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null, '1')],
        ['child', createNode('child', 'Child', 'root', '1.1')],
        ['grandchild', createNode('grandchild', 'Grandchild', 'child', '1.1.1')],
      ]);

      const breadcrumbs = getBreadcrumbs(nodes, 'grandchild');

      expect(breadcrumbs).toEqual([
        { id: 'root', name: 'Root', code: '1' },
        { id: 'child', name: 'Child', code: '1.1' },
        { id: 'grandchild', name: 'Grandchild', code: '1.1.1' },
      ]);
    });

    it('should handle nodes without codes', () => {
      const nodes = new Map<string, IndicatorNode>([
        ['root', createNode('root', 'Root', null)],
        ['child', createNode('child', 'Child', 'root')],
      ]);

      const breadcrumbs = getBreadcrumbs(nodes, 'child');

      expect(breadcrumbs).toEqual([
        { id: 'root', name: 'Root', code: undefined },
        { id: 'child', name: 'Child', code: undefined },
      ]);
    });

    it('should return empty array for non-existent node', () => {
      const nodes = new Map<string, IndicatorNode>();

      const breadcrumbs = getBreadcrumbs(nodes, 'nonexistent');

      expect(breadcrumbs).toEqual([]);
    });
  });
});
