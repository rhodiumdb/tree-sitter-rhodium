; Identifier conventions

; Assume all-caps names are constants
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'")
 (#is-not? local))

; Highlight local variables differently (figure out why this doesn't work)
; ((identifier) (#is? local)) @variable.local

; Assume that uppercase names in paths are types
((scoped_identifier
  path: (identifier) @type)
 (#match? @type "^[A-Z]"))
((scoped_identifier
  path: (scoped_identifier (identifier) @type))
 (#match? @type "^[A-Z]"))

; Assume other uppercase names are enum constructors
((identifier) @constructor
 (#match? @constructor "^[A-Z]"))

; Function calls

(call_expression
  function: (identifier) @function)
(call_expression
  function: (field_expression
    field: (field_identifier) @function.method))
(call_expression
  function: (scoped_identifier
    "::"
    name: (identifier) @function))

(instantiation) @function

; Function definitions

(function_item name: (identifier) @function)
(function_signature_item
 name: (scoped_identifier "::" name: (identifier) @function))

(query_item
 name: (type_identifier) @type
 name: (identifier) @function)

; Other identifiers

(type_identifier) @type
(primitive_types) @type.builtin
(field_identifier) @property

(line_comment) @comment
(doc_comment) @comment.doc

"(" @punctuation.bracket.paren
")" @punctuation.bracket.paren
"[" @punctuation.bracket.square
"]" @punctuation.bracket.square
"{" @punctuation.bracket.curly
"}" @punctuation.bracket.curly

(type_arguments
  "<" @punctuation.bracket.angle
  ">" @punctuation.bracket.angle)
(type_parameters
  "<" @punctuation.bracket.angle
  ">" @punctuation.bracket.angle)

"::" @punctuation.delimiter
":" @punctuation.delimiter
"." @punctuation.delimiter
"," @punctuation.delimiter
";" @punctuation.delimiter

(parameter (identifier) @variable.parameter)

"break" @keyword
"continue" @keyword
"else" @keyword
"enum" @keyword
"fn" @keyword
"for" @keyword
"if" @keyword
"in" @keyword
"let" @keyword
"loop" @keyword
"match" @keyword
"pub" @keyword
"query" @keyword
"return" @keyword
"struct" @keyword
"table" @keyword
"type" @keyword
"while" @keyword
(mutable_specifier) @keyword
(scoped_identifier (self) @keyword)

(self) @variable.builtin
(rel) @type.builtin

(attribute_item) @attribute

(char_literal) @string
(string_literal) @string

(boolean_literal) @constant.builtin
(integer_literal) @number

(escape_sequence) @escape

"as" @operator.as

(function_item "->" @operator.ty)
(function_signature_item "->" @operator.ty)
(query_item "->" @operator.ty)

(table_functional_dependency "->" @operator.fundep)

(unary_expression operator: "-" @operator.unary)
(unary_expression operator: "!" @operator.unary)
(unary_expression operator: "*" @operator.unary)
(binary_expression operator: "&&" @operator.boolean)
(binary_expression operator: "||" @operator.boolean)
(binary_expression operator: "&" @operator.bitwise)
(binary_expression operator: "|" @operator.bitwise)
(binary_expression operator: "^" @operator.bitwise)
(binary_expression operator: "==" @operator.comparison)
(binary_expression operator: "!=" @operator.comparison)
(binary_expression operator: "<" @operator.comparison)
(binary_expression operator: "<=" @operator.comparison)
(binary_expression operator: ">" @operator.comparison)
(binary_expression operator: ">=" @operator.comparison)
(binary_expression operator: ">>" @operator.shift)
(binary_expression operator: "<<" @operator.shift)
(binary_expression operator: "+" @operator.arithmetic)
(binary_expression operator: "-" @operator.arithmetic)
(binary_expression operator: "*" @operator.arithmetic)
(binary_expression operator: "/" @operator.arithmetic)
(binary_expression operator: "%" @operator.arithmetic)
