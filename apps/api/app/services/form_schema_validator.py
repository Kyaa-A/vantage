"""
Form Schema Validation Service

This module provides reusable validation functions for form schemas.
These functions are used across the application to ensure form schema integrity.
"""

from typing import List, Set, Dict
from app.schemas.form_schema import (
    FormSchema,
    FormField,
    FileUploadField,
    CheckboxGroupField,
    RadioButtonField,
)


def validate_field_ids_unique(fields: List[FormField]) -> bool:
    """
    Validate that all field_ids are unique within the field list.

    Args:
        fields: List of form fields to validate

    Returns:
        True if all field_ids are unique, False otherwise
    """
    if not fields:
        return True

    field_ids = [field.field_id for field in fields]
    return len(field_ids) == len(set(field_ids))


def validate_no_circular_references(fields: List[FormField]) -> bool:
    """
    Validate that there are no circular references in field dependencies.
    Checks conditional MOV logic to ensure fields don't create circular dependencies.

    Args:
        fields: List of form fields to validate

    Returns:
        True if no circular references exist, False otherwise
    """
    if not fields:
        return True

    # Build dependency graph
    dependencies: Dict[str, Set[str]] = {}

    for field in fields:
        dependencies[field.field_id] = set()

        # Check FileUploadField conditional MOV references
        if isinstance(field, FileUploadField) and field.conditional_mov_requirement:
            referenced_field = field.conditional_mov_requirement.field_id
            dependencies[field.field_id].add(referenced_field)

    # Detect cycles using DFS
    def has_cycle(node: str, visited: Set[str], rec_stack: Set[str]) -> bool:
        """Helper function to detect cycles using depth-first search"""
        visited.add(node)
        rec_stack.add(node)

        # Check all dependencies of current node
        for neighbor in dependencies.get(node, set()):
            if neighbor not in visited:
                if has_cycle(neighbor, visited, rec_stack):
                    return True
            elif neighbor in rec_stack:
                return True

        rec_stack.remove(node)
        return False

    visited: Set[str] = set()

    for field_id in dependencies:
        if field_id not in visited:
            if has_cycle(field_id, visited, set()):
                return False

    return True


def validate_conditional_mov_logic(field: FileUploadField, all_fields: List[FormField]) -> bool:
    """
    Validate conditional MOV logic for a file upload field.
    Ensures the referenced field exists and the logic is valid.

    Args:
        field: FileUploadField to validate
        all_fields: List of all fields in the schema

    Returns:
        True if conditional MOV logic is valid, False otherwise
    """
    if not field.conditional_mov_requirement:
        # No conditional logic, so it's valid
        return True

    # Check if referenced field exists
    referenced_field_id = field.conditional_mov_requirement.field_id
    field_ids = {f.field_id for f in all_fields}

    if referenced_field_id not in field_ids:
        return False

    # Check if field references itself (immediate circular reference)
    if referenced_field_id == field.field_id:
        return False

    return True


def detect_circular_references(form_schema: FormSchema) -> List[str]:
    """
    Detect circular references in form schema and return error messages.

    Args:
        form_schema: FormSchema object to validate

    Returns:
        List of error messages describing circular references. Empty list if none found.
    """
    errors: List[str] = []
    fields = form_schema.fields

    # Build dependency graph
    dependencies: Dict[str, Set[str]] = {}

    for field in fields:
        dependencies[field.field_id] = set()

        # Check FileUploadField conditional MOV references
        if isinstance(field, FileUploadField) and field.conditional_mov_requirement:
            referenced_field = field.conditional_mov_requirement.field_id
            dependencies[field.field_id].add(referenced_field)

            # Check for self-reference
            if referenced_field == field.field_id:
                errors.append(
                    f"Field '{field.field_id}' references itself in conditional MOV logic"
                )

    # Detect cycles using DFS and track the path
    def find_cycle_path(node: str, visited: Set[str], rec_stack: List[str]) -> List[str]:
        """Helper function to find and return the cycle path"""
        visited.add(node)
        rec_stack.append(node)

        for neighbor in dependencies.get(node, set()):
            if neighbor not in visited:
                cycle = find_cycle_path(neighbor, visited, rec_stack.copy())
                if cycle:
                    return cycle
            elif neighbor in rec_stack:
                # Found a cycle - return the path
                cycle_start = rec_stack.index(neighbor)
                return rec_stack[cycle_start:] + [neighbor]

        return []

    visited: Set[str] = set()

    for field_id in dependencies:
        if field_id not in visited:
            cycle_path = find_cycle_path(field_id, visited, [])
            if cycle_path:
                cycle_str = " -> ".join(cycle_path)
                errors.append(
                    f"Circular reference detected in field dependencies: {cycle_str}"
                )

    return errors


def generate_validation_errors(schema: FormSchema) -> List[str]:
    """
    Generate a comprehensive list of validation errors for a form schema.

    Args:
        schema: FormSchema object to validate

    Returns:
        List of error messages. Empty list if schema is valid.
    """
    errors: List[str] = []

    # Check if fields list is empty
    if not schema.fields or len(schema.fields) == 0:
        errors.append("Form schema must have at least one field")
        return errors  # No point checking further if no fields

    # Check for duplicate field_ids
    if not validate_field_ids_unique(schema.fields):
        field_ids = [field.field_id for field in schema.fields]
        duplicates = [fid for fid in field_ids if field_ids.count(fid) > 1]
        unique_duplicates = list(set(duplicates))
        errors.append(
            f"Duplicate field_ids found: {', '.join(unique_duplicates)}"
        )

    # Check for circular references
    circular_errors = detect_circular_references(schema)
    errors.extend(circular_errors)

    # Validate individual field conditional MOV logic
    for field in schema.fields:
        if isinstance(field, FileUploadField):
            if not validate_conditional_mov_logic(field, schema.fields):
                if field.conditional_mov_requirement:
                    errors.append(
                        f"Field '{field.field_id}' has invalid conditional MOV logic: "
                        f"referenced field '{field.conditional_mov_requirement.field_id}' "
                        "does not exist"
                    )

        # Validate checkbox/radio fields have at least one option
        if isinstance(field, (CheckboxGroupField, RadioButtonField)):
            if not field.options or len(field.options) == 0:
                field_type = "Checkbox group" if isinstance(field, CheckboxGroupField) else "Radio button"
                errors.append(
                    f"{field_type} field '{field.field_id}' must have at least one option"
                )

    return errors
