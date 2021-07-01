(function_item) @local.scope
(function_signature_item) @local.scope
(query_item) @local.scope
(field_declaration_list) @local.scope
(table_field_declaration_list) @local.scope
(block) @local.scope

(field_declaration name: (field_identifier) @local.definition)
(type_identifier) @local.definition
(type_parameters (type_identifier) @local.definition)
(parameters (parameter pattern: (identifier) @local.definition))

(assignment_expression left: (identifier) @local.definition)

(identifier) @local.reference
(table_functional_dependency sources: (field_identifier) @local.reference)
(table_functional_dependency targets: (field_identifier) @local.reference)
