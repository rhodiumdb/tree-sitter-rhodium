const PREC = {
    range: 15,
    call: 14,
    field: 13,
    unary: 11,
    multiplicative: 10,
    additive: 9,
    shift: 8,
    bitand: 7,
    bitxor: 6,
    bitor: 5,
    comparative: 4,
    and: 3,
    or: 2,
    assign: 0,
};

module.exports = grammar({
    name: 'rhodium',

    extras: $ => [/\s/, $.line_comment, $.doc_comment],

    externals: $ => [],

    supertypes: $ => [
        $._expression,
        $._type,
        $._literal,
        $._literal_pattern,
        $._declaration_statement,
        $._pattern,
    ],

    inline: $ => [
        $._path,
        // $._type_identifier,
        $._tokens,
        $._field_identifier,
        $._non_special_token,
        $._declaration_statement,
        $._reserved_identifier,
        $._expression_ending_with_block
    ],

    conflicts: $ => [
        [$.unit_type, $.tuple_pattern],
        [$.scoped_identifier, $.scoped_type_identifier],
        [$.parameters, $._pattern],
        [$.parameters, $.tuple_struct_pattern],
    ],

    word: $ => $.identifier,

    rules: {
        source_file: $ => repeat($._statement),

        _statement: $ => choice(
            $._expression_statement,
            $._declaration_statement
        ),

        _expression_statement: $ => choice(
            seq($._expression, ';'),
            prec(1, $._expression_ending_with_block)
        ),

        _declaration_statement: $ => choice(
            $.attribute_item,
            $.struct_item,
            $.table_item,
            $.enum_item,
            $.type_item,
            $.function_item,
            $.function_signature_item,
            $.query_item,
            $.let_declaration
        ),

        // Section - Declarations

        attribute_item: $ => seq(
            '#',
            '[',
            $.meta_item,
            ']'
        ),

        meta_item: $ => seq(
            $._path,
            optional(choice(
                seq('=', field('value', $._literal)),
                field('arguments', $.meta_arguments)
            ))
        ),

        meta_arguments: $ => seq(
            '(',
            sepBy(',', choice(
                $.meta_item,
                $._literal
            )),
            optional(','),
            ')'
        ),

        declaration_list: $ => seq(
            '{',
            repeat($._declaration_statement),
            '}'
        ),

        struct_item: $ => seq(
            optional($.visibility_modifier),
            'struct',
            field('name', $._type_identifier),
            field('type_parameters', optional($.type_parameters)),
            choice(
                seq(
                    field('body', $.field_declaration_list)
                ),
                seq(
                    field('body', $.ordered_field_declaration_list),
                    ';'
                ),
                ';'
            ),
        ),

        table_item: $ => seq(
            optional($.visibility_modifier),
            'table',
            field('name', $._type_identifier),
            field('type_parameters', optional($.type_parameters)),
            field('body', $.table_field_declaration_list)
        ),

        table_field_declaration_list: $ => seq(
            '{',
            sepBy(',', seq(repeat($.attribute_item),
                           $.table_field_declaration)),
            optional(','),
            '}'
        ),

        table_field_declaration: $ => choice(
            $.field_declaration,
            $.table_functional_dependency
        ),

        table_functional_dependency: $ => seq(
            field('sources', choice(seq('(', sepBy1(',', $._field_identifier), ')'),
                                    $._field_identifier)),
            '->',
            field('targets', choice(seq('(', sepBy1(',', $._field_identifier), ')'),
                                    $._field_identifier)),
        ),

        enum_item: $ => seq(
            optional($.visibility_modifier),
            'enum',
            field('name', $._type_identifier),
            field('type_parameters', optional($.type_parameters)),
            field('body', $.enum_variant_list)
        ),

        enum_variant_list: $ => seq(
            '{',
            sepBy(',', seq(repeat($.attribute_item), $.enum_variant)),
            optional(','),
            '}'
        ),

        enum_variant: $ => seq(
            field('name', $.identifier),
            field('body', optional(choice(
                $.field_declaration_list,
                $.ordered_field_declaration_list
            )))
        ),

        field_declaration_list: $ => seq(
            '{',
            sepBy(',', seq(repeat($.attribute_item), $.field_declaration)),
            optional(','),
            '}'
        ),

        field_declaration: $ => seq(
            field('name', $._field_identifier),
            ':',
            field('type', $._type)
        ),

        ordered_field_declaration_list: $ => seq(
            '(',
            sepBy(',', seq(
                repeat($.attribute_item),
                optional($.visibility_modifier),
                field('type', $._type)
            )),
            optional(','),
            ')'
        ),

        type_item: $ => seq(
            optional($.visibility_modifier),
            'type',
            field('name', $._type_identifier),
            field('type_parameters', optional($.type_parameters)),
            '=',
            field('type', $._type),
            ';'
        ),

        function_item: $ => seq(
            optional($.visibility_modifier),
            optional($.function_modifiers),
            'fn',
            field('name', $.identifier),
            field('type_parameters', optional($.type_parameters)),
            field('parameters', $.parameters),
            optional(seq('->', field('return_type', $._type))),
            field('body', $.block)
        ),

        function_signature_item: $ => seq(
            optional($.visibility_modifier),
            optional($.function_modifiers),
            'fn',
            field('name', $.scoped_identifier),
            field('type_parameters', optional($.type_parameters)),
            field('parameters', $.parameters),
            optional(seq('->', field('return_type', $._type))),
            ';'
        ),

        query_item: $ => seq(
            optional($.visibility_modifier),
            optional($.function_modifiers),
            'query',
            field('name', seq($._type_identifier, '::', $.identifier)),
            field('type_parameters', optional($.type_parameters)),
            field('parameters', $.parameters),
            optional(seq('->', field('return_type', $._type))),
            field('body', $.block)
        ),

        function_modifiers: $ => repeat1(choice(
        )),

        primitive_types: $ => choice(/[iu][1-9][0-9]*/, 'bool', 'string'),

        type_parameters: $ => prec(1, seq(
            '<',
            sepBy1(',', $._type_identifier),
            optional(','),
            '>'
        )),

        let_declaration: $ => seq(
            'let',
            optional($.mutable_specifier),
            field('pattern', $._pattern),
            optional(seq(
                ':',
                field('type', $._type)
            )),
            optional(seq(
                '=',
                field('value', $._expression)
            )),
            ';'
        ),

        parameters: $ => seq(
            '(',
            sepBy(',', seq(
                optional($.attribute_item),
                choice(
                    $.parameter,
                    $.self_parameter
                ))),
            optional(','),
            ')'
        ),

        self_parameter: $ => seq(
            $.self
        ),

        parameter: $ => seq(
            optional($.mutable_specifier),
            field('pattern', choice(
                $._pattern,
                $._reserved_identifier,
            )),
            ':',
            field('type', $._type)
        ),

        visibility_modifier: $ => prec.right(
            choice('pub')),

        // Section - Types

        _type: $ => choice(
            $.generic_type,
            $.scoped_type_identifier,
            $.tuple_type,
            $.unit_type,
            $.empty_type,
            $.array_type,
            $.pointer_type,
            $.primitive_types,
            $._type_identifier
        ),

        array_type: $ => seq(
            '[',
            field('element', $._type),
            optional(seq(
                ';',
                field('length', $._expression)
            )),
            ']'
        ),

        tuple_type: $ => seq(
            '(',
            sepBy1(',', $._type),
            optional(','),
            ')'
        ),

        unit_type: $ => seq('(', ')'),

        instantiation: $ => prec(1, seq(
            field('function', choice(
                $.identifier,
                $.scoped_identifier,
                $.field_expression
            )),
            '::',
            field('type_arguments', $.type_arguments)
        )),

        generic_type: $ => prec(1, seq(
            field('type', choice(
                $.rel,
                $._type_identifier,
                $.scoped_type_identifier
            )),
            field('type_arguments', $.type_arguments)
        )),

        generic_type_with_turbofish: $ => seq(
            field('type', choice(
                $._type_identifier,
                $.scoped_identifier
            )),
            '::',
            field('type_arguments', $.type_arguments)
        ),

        type_arguments: $ => seq(
            token(prec(1, '<')),
            sepBy1(',', $._type),
            optional(','),
            '>'
        ),

        pointer_type: $ => seq(
            '*',
            choice('const', $.mutable_specifier),
            field('type', $._type)
        ),

        empty_type: $ => '!',

        mutable_specifier: $ => 'mut',

        // Section - Expressions

        _expression: $ => choice(
            $.unary_expression,
            $.binary_expression,
            $.assignment_expression,
            $.type_cast_expression,
            $.range_expression,
            $.call_expression,
            $.return_expression,
            $._literal,
            prec.left($.identifier),
            alias($.primitive_types, $.identifier),
            prec.left($._reserved_identifier),
            $.self,
            $.scoped_identifier,
            $.instantiation,
            $.field_expression,
            $.array_expression,
            $.tuple_expression,
            $.unit_expression,
            $._expression_ending_with_block,
            $.break_expression,
            $.continue_expression,
            $.index_expression,
            $.parenthesized_expression,
            $.struct_expression
        ),

        _expression_ending_with_block: $ => choice(
            $.block,
            $.if_expression,
            $.if_let_expression,
            $.match_expression,
            $.while_expression,
            $.while_let_expression,
            $.loop_expression,
            $.for_expression
        ),

        scoped_identifier: $ => seq(
            field('path', optional(choice(
                $._path,
                alias($.generic_type_with_turbofish, $.generic_type)
            ))),
            '::',
            field('name', $.identifier)
        ),

        scoped_type_identifier_in_expression_position: $ => prec(-2, seq(
            field('path', optional(choice(
                $._path,
                alias($.generic_type_with_turbofish, $.generic_type)
            ))),
            '::',
            field('name', $._type_identifier)
        )),

        scoped_type_identifier: $ => seq(
            field('path', optional(choice(
                $._path,
                alias($.generic_type_with_turbofish, $.generic_type),
                $.generic_type
            ))),
            '::',
            field('name', $._type_identifier)
        ),

        range_expression: $ => prec.left(PREC.range,
            seq($._expression, choice('..', '..='), $._expression)
        ),

        unary_expression: $ => prec(PREC.unary, seq(
            field('operator', choice('-', '!', '*', '&')),
            $._expression
        )),

        binary_expression: $ => {
            const table = [
                [PREC.and, '&&'],
                [PREC.or, '||'],
                [PREC.bitand, '&'],
                [PREC.bitor, '|'],
                [PREC.bitxor, '^'],
                [PREC.comparative, choice('==', '!=', '<', '<=', '>', '>=')],
                [PREC.shift, choice('<<', '>>')],
                [PREC.additive, choice('+', '-')],
                [PREC.multiplicative, choice('*', '/', '%')],
            ];

            return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
                field('left', $._expression),
                field('operator', operator),
                field('right', $._expression),
            ))));
        },

        assignment_expression: $ => prec.left(PREC.assign, seq(
            field('left', $._expression),
            '=',
            field('right', $._expression)
        )),

        type_cast_expression: $ => seq(
            field('value', $._expression),
            'as',
            field('type', $._type)
        ),

        return_expression: $ => choice(
            prec.left(seq('return', $._expression)),
            prec(-1, 'return'),
        ),

        call_expression: $ => prec(PREC.call, seq(
            field('function', $._expression),
            field('arguments', $.arguments)
        )),

        arguments: $ => seq(
            '(',
            sepBy(',', seq(repeat($.attribute_item), $._expression)),
            optional(','),
            ')'
        ),

        array_expression: $ => seq(
            '[',
            repeat($.attribute_item),
            choice(
                seq(
                    $._expression,
                    ';',
                    field('length', $._expression)
                ),
                seq(
                    sepBy(',', $._expression),
                    optional(',')
                )
            ),
            ']'
        ),

        parenthesized_expression: $ => seq(
            '(',
            $._expression,
            ')'
        ),

        tuple_expression: $ => seq(
            '(',
            repeat($.attribute_item),
            seq($._expression, ','),
            repeat(seq($._expression, ',')),
            optional($._expression),
            ')'
        ),

        unit_expression: $ => seq('(', ')'),

        struct_expression: $ => seq(
            field('name', choice(
                $._type_identifier,
                $.generic_type_with_turbofish
            )),
            field('body', $.field_initializer_list)
        ),

        field_initializer_list: $ => seq(
            '{',
            sepBy(',', choice(
                $.shorthand_field_initializer,
                $.field_initializer,
                $.base_field_initializer
            )),
            optional(','),
            '}'
        ),

        shorthand_field_initializer: $ => seq(
            repeat($.attribute_item),
            $.identifier
        ),

        field_initializer: $ => seq(
            repeat($.attribute_item),
            field('name', $._field_identifier),
            ':',
            field('value', $._expression)
        ),

        base_field_initializer: $ => seq(
            '..',
            $._expression
        ),

        if_expression: $ => seq(
            'if',
            field('condition', $._expression),
            field('consequence', $.block),
            optional(field("alternative", $.else_clause))
        ),

        if_let_expression: $ => seq(
            'if',
            'let',
            field('pattern', $._pattern),
            '=',
            field('value', $._expression),
            field('consequence', $.block),
            optional(field('alternative', $.else_clause))
        ),

        else_clause: $ => seq(
            'else',
            choice(
                $.block,
                $.if_expression,
                $.if_let_expression
            )
        ),

        match_expression: $ => seq(
            'match',
            field('value', $._expression),
            field('body', $.match_block)
        ),

        match_block: $ => seq(
            '{',
            optional(seq(
                repeat($.match_arm),
                alias($.last_match_arm, $.match_arm)
            )),
            '}'
        ),

        match_arm: $ => seq(
            repeat($.attribute_item),
            field('pattern', $.match_pattern),
            '=>',
            choice(
                seq(field('value', $._expression), ','),
                field('value', prec(1, $._expression_ending_with_block))
            )
        ),

        last_match_arm: $ => seq(
            repeat($.attribute_item),
            field('pattern', $.match_pattern),
            '=>',
            field('value', $._expression),
            optional(',')
        ),

        match_pattern: $ => seq(
            $._pattern,
            optional(seq('if', field('condition', $._expression)))
        ),

        while_expression: $ => seq(
            optional(seq($.loop_label, ':')),
            'while',
            field('condition', $._expression),
            field('body', $.block)
        ),

        while_let_expression: $ => seq(
            optional(seq($.loop_label, ':')),
            'while',
            'let',
            field('pattern', $._pattern),
            '=',
            field('value', $._expression),
            field('body', $.block)
        ),

        loop_expression: $ => seq(
            optional(seq($.loop_label, ':')),
            'loop',
            field('body', $.block)
        ),

        for_expression: $ => seq(
            optional(seq($.loop_label, ':')),
            'for',
            field('pattern', $._pattern),
            'in',
            field('value', $._expression),
            field('body', $.block)
        ),

        loop_label: $ => seq('\'', $.identifier),

        break_expression: $ => prec.left(seq('break', optional($.loop_label), optional($._expression))),

        continue_expression: $ => prec.left(seq('continue', optional($.loop_label))),

        index_expression: $ => prec(PREC.call, seq($._expression, '[', $._expression, ']')),

        field_expression: $ => prec(PREC.field, seq(
            field('value', $._expression),
            '.',
            field('field', choice(
                $._field_identifier,
                $.integer_literal
            ))
        )),

        block: $ => seq(
            '{',
            repeat($._statement),
            optional($._expression),
            '}'
        ),

        // Section - Patterns

        _pattern: $ => choice(
            $._literal_pattern,
            alias($.primitive_types, $.identifier),
            $.identifier,
            $.tuple_pattern,
            $.tuple_struct_pattern,
            $.struct_pattern,
            '_'
        ),

        tuple_pattern: $ => seq(
            '(',
            sepBy(',', $._pattern),
            optional(','),
            ')'
        ),

        tuple_struct_pattern: $ => seq(
            field('type', choice(
                $.identifier,
                $.scoped_identifier
            )),
            '(',
            sepBy(',', $._pattern),
            optional(','),
            ')'
        ),

        struct_pattern: $ => seq(
            field('type', choice(
                $._type_identifier,
                $.scoped_type_identifier
            )),
            '{',
            sepBy(',', choice($.field_pattern, $.remaining_field_pattern)),
            optional(','),
            '}'
        ),

        field_pattern: $ => seq(
            choice(
                field('name', alias($.identifier, $.shorthand_field_identifier)),
                seq(
                    field('name', $._field_identifier),
                    ':',
                    field('pattern', $._pattern)
                )
            )
        ),

        remaining_field_pattern: $ => '..',

        // Section - Literals

        _literal: $ => choice(
            $.string_literal,
            $.char_literal,
            $.boolean_literal,
            $.integer_literal,
        ),

        _literal_pattern: $ => choice(
            $.string_literal,
            $.char_literal,
            $.boolean_literal,
            $.integer_literal,
            $.negative_literal,
        ),

        negative_literal: $ => seq('-', choice($.integer_literal)),

        integer_literal: $ => token(seq(
            choice(
                /[0-9][0-9_]*/,
                /0x[0-9a-fA-F_]+/,
                /0b[01_]+/,
                /0o[0-7_]+/
            ),
            optional(/[ui][1-9][0-9]*/)
        )),

        string_literal: $ => seq(
            alias(/b?"/, '"'),
            repeat(choice(
                $.escape_sequence,
            )),
            token.immediate('"')
        ),

        char_literal: $ => token(seq(
            optional('b'),
            '\'',
            optional(choice(
                seq('\\', choice(
                    /[^xu]/,
                    /u[0-9a-fA-F]{4}/,
                    /u{[0-9a-fA-F]+}/,
                    /x[0-9a-fA-F]{2}/
                )),
                /[^\\']/
            )),
            '\''
        )),

        escape_sequence: $ => token.immediate(
            seq('\\',
                choice(
                    /[^xu]/,
                    /u[0-9a-fA-F]{4}/,
                    /u{[0-9a-fA-F]+}/,
                    /x[0-9a-fA-F]{2}/
                )
               )),

        boolean_literal: $ => choice('true', 'false'),

        comment: $ => choice(
            $.line_comment,
            $.doc_comment
        ),

        line_comment: $ => /[/][/]([^/].*)?/,

        doc_comment: $ => /[/][/][/].*/,

        _path: $ => choice(
            $.self,
            alias($.primitive_types, $.identifier),
            $.identifier,
            $.scoped_identifier
        ),

        identifier: $ => /[_\p{XID_Start}][_\p{XID_Continue}]*/,

        _reserved_identifier: $ => alias(choice(
            'query',
            'table'
        ), $.identifier),

        _type_identifier: $ => prec(1, alias($.identifier, $.type_identifier)),
        _field_identifier: $ => alias($.identifier, $.field_identifier),

        self: $ => 'self',

        rel: $ => 'rel',
    }
});

function sepBy1(sep, rule) {
    return seq(rule, repeat(seq(sep, rule)));
}

function sepBy(sep, rule) {
    return optional(sepBy1(sep, rule));
}
