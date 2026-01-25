---
layout: post
title:  "Compiling Ada-"
date:   2026-01-25 23:57:00 +0600
categories: software-development retro-computing
comments: true
---

Recently Ada compiler from 1988 was [appear](https://git.sr.ht/~jelle/Ada-Minus-Compiler) on the Internet. That immidiately caught my attention, since I was always intrigued by Ada, since I can say my second programming language was Pascal. So this post would be about my journey towards compiling old Ada using modern compiler.

<!--more-->

To start playing, since I don't have Linux machine, and I dislike WSL so much, I create [GitHub fork](https://github.com/kant2002/Ada-Minus-Compiler) of the project. The GitHub was chosen purely for free GitHub actions, so I can create CI pipeline and modify code in ther github.dev. If you can use other hosting provider, not from USA company, please do.

Thankfully original code dump have makefile in `src` folder. So my pipeline simply use that for building.

So I start very bravely trying to fix all issues with old code, like K&R style, missing headers, and other issues. Ha-ha! Very soon I realized that that's not nescessary. Most output from compiler was warnings, not errors. So why bother. Let's suppress them.

First folder which building is `src/view`. So far, that's was enough to ignore all erorrs.
```
-Wno-implicit-function-declaration -Wno-builtin-declaration-mismatch -Wno-implicit-int -Wno-endif-labels -Wno-return-type -Wno-pointer-to-int-cast -Wno-int-conversion -Wno-format-overflow
```

After applying these flags one by one, I notice I compilition error. Compiler looks for some strange `creat` function. https://github.com/kant2002/Ada-Minus-Compiler/blob/ee20fabf09accde47aefc8ef2dab08542e38535f/src/view/cungen.c#L54

This seems to be some obscure old function for opening files. After asking around, I [was pointed](https://linux.die.net/man/2/creat) that this is standard Linux interface. 

Also there two places where linker produce errors. `view1.c` and `view2.c` define two variables `prefix` and `lib_name`, which I bravely mark as `extern`. This obviosuly does not work, since that way nothing is defined. So I have to track what's used and where. This require some guessing and trials. During this process I found that `viewname` variable also not consistently defined, so I fix it too.

Next set of troubles come from unknown compiler switch `-ll` when building `adaload`.

```
adaload	:	adaload.o viewlib.a
		cc -o adaload adaload.o viewlib.a -ll
```

Quick research does not give me anything, so I remove this flag. Maybe I will figure out this later.

Funny offender was `exit()` calls, which I should assume equivalent to `exit(0)`. So I replace them as such when I do found these.

After these changes made, the `view` folder was compiled successfully, and I face new obstacly on `front` folder. The `1A12.c:181:37: error: ‘HUGE’ undeclared (first use in this function)`. This define was used in following snippet:

```c
#ifdef GMX_OLD
	if ((nd + exp * negexp) < - LOGHUGE) {
#else
	if ((nd + exp * negexp) < - HUGE) {
#endif
```

Looking for LOGHUGE and HUGE on Github give me hints. https://github.com/Zeke-OS/zeke/blob/c6cd23959e3916c1aae04d909997f67c57c25e91/include/math.h#L17-L18

Probably this is about floating point operations. My current guess is that it represents exponenta of biggest representable number. So it should be either `127` or `1023`. I will define this using `-DHUGE=127` during compilation.

So far, so good. But obviosuly not without an issues. So compiler produce next issue

```
1A17.c: In function ‘CONST_TYPE’:
1A17.c:370:21: error: invalid storage class for function ‘const_type’
  370 |         static bool const_type ();
      |                     ^~~~~~~~~~
```

This is forward declaration of static function `const_type`. Forward declarations cannot be static, so have to remove forward declaration and rearrange code. Also fun thing, is that static declarations was made local in couple places, so I have to remove these too. Now do the same in 1A18.c. And in CGcode09.c (35 functions with forward declarations). So fun.

One of the issue was that compiler have function `select` as part of compiler. That was clashed with `select` from `<sys/select.h>`. So I have to define `_XOPEN_SOURCE=500` in build to disable declaration of that function.

Also lot of code in `front.h` define external functions without specifying parameters. Sometimes functions declared `static` somewhere else. Logically if they are referenced in header files, then they should not be marked as static. Have to remove that.

Another gem is next error

```
CGstor02.c: In function ‘subbody’:
CGstor02.c:249:33: error: lvalue required as left operand of assignment
  249 |            s_SBB_valoff (x, off = align (off, ADDR_ALIGN));
      |                                 ^
../h/access.h:423:71: note: in definition of macro ‘s_SBB_valoff’
  423 | #define s_SBB_valoff(x, y)      ((*x)._subbody.SBB_valoff = ((MAXADDR)y))
```
Turns out that I should put `y` parameters in brackets. 
```
s_SBB_valoff (x, (off = align (off, ADDR_ALIGN)));
```

After fixing these all code in `front` folder compiles. But linker start complaining. Except typical linkage errors due to missing export declarations, producing duplicate symbol errors, one error was more interesting.

```
/usr/bin/ld: CGcode09.o: in function `is_positional':
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/CGcode09.c:151: multiple definition of `is_positional'; predicates.o:/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/predicates.c:908: first defined here
```

Turn out that `is_positional` defined twice in difference files. `CGcode09.c` have defined it as static function, `predicates.c` have it defined as normal function, and `front.h` have it defined as extern function.
So I should rename `is_positional` to `is_positional_func` in `CGcode09.c`.

Looks like it helped, but another error appears. 

```
reader.o record_man.o std.o rec_sizes.o ../libvy/libvy.a ../view/viewlib.a
/usr/bin/ld: cannot find ../libvy/libvy.a: No such file or directory
collect2: error: ld returned 1 exit status
```

The `libvy` library is missing. Actually this library is from this project, but it disabled during building. So I have to uncommend it in `src/makefile` and build. Let's see.

Hah. Again some cruft from project which was frozen during development.

```
cp: cannot create regular file '/home/adacomp/lib/libvy.a': No such file or directory
```

Somebody hardcoded paths. Have to fix that. I change `DIR=home/runner` so make place `.a` file to home of runner. So far, so good. I mean new linker error, what do you think.

```
reader.o record_man.o std.o rec_sizes.o ../libvy/libvy.a ../view/viewlib.a
/usr/bin/ld: main.o: in function `dump_core':
main.c:(.text+0x6f): undefined reference to `_cleanup'
/usr/bin/ld: 1A00.o: in function `yylex':
1A00.c:(.text+0xdce): undefined reference to `yywrap'
/usr/bin/ld: 1A09.o: in function `rem_list':
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/1A09.c:190:(.text+0x466): undefined reference to `cfree'
/usr/bin/ld: 1A13.o: in function `del_tripels':
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/1A13.c:130:(.text+0x4c8): undefined reference to `cfree'
/usr/bin/ld: 1A14.o: in function `del_set':
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/1A14.c:140:(.text+0x175): undefined reference to `cfree'
/usr/bin/ld: CGcode08.o: in function `rlist':
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/CGcode08.c:169:(.text+0x570): undefined reference to `cfree'
/usr/bin/ld: record_man.o: in function `tree_init':
record_man.c:(.text+0x12f): undefined reference to `cfree'
collect2: error: ld returned 1 exit status
```

Oooh not, I was hoping that this was simple linking something additional. No, no, I have to build another YACC fork in the subfolder `veyacc`. And obviously it was conviniently commented out.

So what this is mean? I should use `libfl-dev` and that solves `-ll` mistery for me. Obviosuly I should use `-lfl`

Now bunch of legacy issues

```
/usr/bin/ld: main.o: in function `dump_core':
main.c:(.text+0x6f): undefined reference to `_cleanup'
```

Replacing `_cleanup()` to `fflush(NULL).

```
/home/runner/work/Ada-Minus-Compiler/Ada-Minus-Compiler/src/front/1A13.c:130:(.text+0x4c8): undefined reference to `cfree'
```

Simply replace `cfree()` with `free()`.

Argh!! `Cannot cd to cg`. You know what? Whole folder with codegen part is missing. So disappointing.

Next error also legacy one. Quite interesting

```
adaparseyacc.y:61.44: error: unexpected =
   61 | CompilationUnit	:	ContextClause Unit =
      |                                            ^
adaparseyacc.y:73.37: error: unexpected =
   73 | ContextClause	:	/* empty */ =
      |                                     ^
adaparseyacc.y:89.36: error: unexpected =
   89 | WithClause 	:	WITH IDENT =
      |                                    ^
```

The bison no longer need `=` before action, so I have to remove it.

It seems we have one fun bit. 

```
adaparselex.l:109:9: error: address of register variable ‘ctext’ requested
  109 |         for (i = 0; res_word [i]. stringrep != NULL; i++)
      |         ^~~~~~~~~
adaparselex.l:111:12: error: address of register variable ‘ctext’ requested
  111 |               return res_word [i]. res_value;
```
This is because variable ctext is declared as register variable, which you cannot index, since that's requrie taking address of variable. Just remove `register` keyword from declaration and hope that compiler smart enough to optimize as needed.

Phew, that was long. `adadep` folder finished. Hurray. Small win

Obviosuly next folder, next problem.
```
/bin/as   -o adb_break.o adb_break.s
adb_break.s: Assembler messages:
adb_break.s:8: Error: no such instruction: `rts'
adb_break.s:10: Error: no such instruction: `rts'
```

I don't ready to cross build yet. Since that's assembly, and I need other tooling, I should comment out this folder for now. `rt` - The Ada runtime, wait for me.

Unfortunately last folder `standard` also depends on the `ada_cg` which should be produced by `cg` folder, and we don't have it. Maybe somebody can found it somewhere?

To have at least some form of closure, I decide to uncomment and build other folders
- treetool
- codgen2
- codgen1

treetool compiled as is. codgen2 requrie cg68 (which is codgen1). But codgen1 require ldfile executable which seems to be produced by `rt` folder. So I think I build all what I can.

Okay. last attempt - `amdb` which is Ada debugger. It has funny error. In same file, 10 lines apart.

```c
extern int		nr_steps;
// ...
extern long		nr_steps;
```

And another one

```
debug.h:57:26: error: expected identifier or ‘(’ before ‘inline’
   57 | extern char             *inline();
```

Have to rename to `inline_char`

Then I discover some include clashes, so I have to backout of `amdb` folder for now. That's probably a sign that this is what I can do for now.

Summary
=======

What was interesting to me is that old codebase was more or less compilable today with minor in my opinion changes. I also hope that my work simplify life of somebody else who want to build this codebase further, or maybe compile it for actual platform which was originally used. The changes can be seen in [this PR](https://github.com/kant2002/Ada-Minus-Compiler/pull/1). It was small and fun excercise, so I'm pleased that it spend day on it. Have a great hacking!
