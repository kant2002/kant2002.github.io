---
layout: post
title:  "Tokens in different languages"
date:   2024-09-26 14:36:44 +0500
categories: Programming-Languages
comments: true
---

# How different languages define tokens?

One guy ask in the chat, "how should I define tokens? should I combine token information with position in file?". That's simple question, and coming from C#, for me answer was obviously yes. But, I was curios how other languages define different tokens.

So here compilation of links to GitHub, so you can take a look at yourself, how it's done by the industry already.
You would not find anything surpising. For me that's cool, you can real old book and immidiately know how industry did it. Probably you should read different books, so you will see different approaches.

## C#/Roslyn
- [SyntaxToken.cs](https://github.com/dotnet/roslyn/blob/main/src/Compilers/Core/Portable/Syntax/SyntaxToken.cs)

## C++/Clang
- [Token.h](https://github.com/llvm/llvm-project/blob/57bed5cd63b5d23ca821be09b4e593646cd84146/clang/include/clang/Lex/Token.h#L36)

## C++/GCC
- [cpplib.h](https://github.com/gcc-mirror/gcc/blob/27003e5d6eadcddde617b89f11bab47ab75cc203/libcpp/include/cpplib.h#L255)

## Dart
- [token.h](https://github.com/dart-lang/sdk/blob/63dff0db52a66e1f35d687abb28a248af4026de3/runtime/vm/token.h#L215)

## Erlang
- [erl_scan.erl](https://github.com/erlang/otp/blob/cc2dc0520c6c60f489d2f285e9e3349e669cf7d6/lib/stdlib/src/erl_scan.erl#L130)

## Haskell/GHC
- [Lexer.x](https://github.com/ghc/ghc/blob/e4ac1b0d281b85a0144d1ef6f84a1df00e236052/compiler/GHC/Parser/Lexer.x#L778)
- [SrcLoc.hs](https://github.com/ghc/ghc/blob/e4ac1b0d281b85a0144d1ef6f84a1df00e236052/compiler/GHC/Types/SrcLoc.hs#L881)

## Java/OpenJDK
- [Tokens.java](https://github.com/openjdk/jdk/blob/10da2c21a19affe93a3f5d67a70db5d9cd37181c/src/jdk.compiler/share/classes/com/sun/tools/javac/parser/Tokens.java#L294-L311)

## JavaScript/V8
- [token.h](https://github.com/v8/v8/blob/main/src/parsing/token.h)

## Go
- [token.go](https://github.com/golang/go/blob/80143607f06fd6410700e9764cfea9aaac9c311c/src/go/token/token.go#L16)

## Kotlin
- [KtToken.java](https://github.com/JetBrains/kotlin/blob/2190e31f3474a8201b821c498aca8a4580160338/compiler/psi/src/org/jetbrains/kotlin/lexer/KtToken.java#L24)

## Lua
- [llex.h](https://github.com/lua/lua/blob/fd0e1f530d06340f99334b07d74e5133ce073787/llex.h#L49-L59)

## Ocaml
- [defs.h](https://github.com/ocaml/ocaml/blob/trunk/yacc/defs.h#L136-L152)

## PHP
- [tokenizer.stub.php](https://github.com/php/php-src/blob/9ee9c0e6748157198d0180920454bc203ee439a5/ext/tokenizer/tokenizer.stub.php#L15)

## Python/CPython
- [state.h](https://github.com/python/cpython/blob/08a467b537b3d9b499d060697e79b3950374ab0f/Parser/lexer/state.h#L27-L32)

## R
- [gram.c](https://github.com/wch/r-source/blob/e43ac1439740a25d8ee280ffc6b3bff75a117d3d/src/main/gram.c#L500)

## Ruby
- [rubyparser.h](https://github.com/ruby/ruby/blob/b2ee760f306a24419d8ae0f4927d731bebbd76ac/rubyparser.h#L207-L219)

## Rust
- [token.rs](https://github.com/rust-lang/rust/blob/76ed7a1fa40c3f54d3fd3f834e12bf9c932d0146/compiler/rustc_ast/src/token.rs#L377-L381)
- [span_encoding.rs](https://github.com/rust-lang/rust/blob/76ed7a1fa40c3f54d3fd3f834e12bf9c932d0146/compiler/rustc_span/src/span_encoding.rs#L246)

## Scala
- [Lexer.scala](https://github.com/scala/scala/blob/01f25e8c7f27dd2e3040d7a5b2ba4a0a2c816b68/src/interactive/scala/tools/nsc/interactive/Lexer.scala#L31)

## Swift
- [Token.h](https://github.com/swiftlang/swift/blob/8c5d7ee45261a344f082c005564cc6e5bd787b4a/include/swift/Parse/Token.h#L44)

## TypeScript
- [types.ts](https://github.com/microsoft/TypeScript/blob/3ad0f752482f5e846dc35a69572ccb43311826c0/src/compiler/types.ts#L938)
- [types.ts](https://github.com/microsoft/TypeScript/blob/3ad0f752482f5e846dc35a69572ccb43311826c0/src/compiler/types.ts#L32)

## Zig
- [Tree.zig](https://github.com/ziglang/zig/blob/085cc54aadb327b9910be2c72b31ea046e7e8f52/lib/compiler/aro/aro/Tree.zig#L13-L20)

What to have your favorite language here? Drop me a line.
