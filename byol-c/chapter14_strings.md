---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter14_strings
---

<h1>Strings <small>&bull; Chapter 14</small></h1>


<h2 id='libraries'>Libraries</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/string.png" alt="string" class="img-responsive" width="300px" height="219px"/>
  <p><small>String &bull; How long is it.</small></p>
</div>

<p>Our Lisp is finally functional. We should be able to write almost any functions we want. We can build some quite complex constructs using it, and even do some cool things that can't be done in lots of other heavyweight and popular languages;</p>

<p>Every time we update our program and run it again it is annoying having to type in all of our functions. In this chapter we'll add the functionality to load code from a file and run it. This will allow us to start building up a standard library up. Along the way we'll also add support for code comments, strings, and printing.</p>


<h2 id='string_type'>String Type</h2> <hr/>

<p>For the user to load a file we'll have to let them supply a string consisting of the file name. Our language supports symbols, but still doesn't support strings, which can include spaces and other characters. We need to add this possible <code>lval</code> type to specify the file names we need.</p>

<p>We start, as in other chapters, by adding an entry to our enum and adding an entry to our <code>lval</code> to represent the type's data.</p>

<pre><code data-language='c'>enum { LVAL_ERR, LVAL_NUM,   LVAL_SYM, LVAL_STR,
       LVAL_FUN, LVAL_SEXPR, LVAL_QEXPR };</code></pre>

<pre><code data-language='c'>/* Basic */
long num;
char* err;
char* sym;
char* str;
</code></pre>

<p>Next we can add a function for constructing string <code>lval</code>, very similar to how we construct constructing symbols.</p>

<pre><code data-language='c'>lval* lval_str(char* s) {
  lval* v = malloc(sizeof(lval));
  v-&gt;type = LVAL_STR;
  v-&gt;str = malloc(strlen(s) + 1);
  strcpy(v-&gt;str, s);
  return v;
}</code></pre>

<p>We also need to add the relevant entries into our functions that deal with <code>lval</code>.</p>

<p>For <strong>Deletion</strong>...</p>

<pre><code data-language='c'>case LVAL_STR: free(v-&gt;str); break;</code></pre>

<p>For <strong>Copying</strong>...</p>

<pre><code data-language='c'>case LVAL_STR: x-&gt;str = malloc(strlen(v-&gt;str) + 1);
  strcpy(x-&gt;str, v-&gt;str); break;</code></pre>

<p>For <strong>Equality</strong>...</p>

<pre><code data-language='c'>case LVAL_STR: return (strcmp(x-&gt;str, y-&gt;str) == 0);</code></pre>

<p>For <strong>Type Name</strong>...</p>

<pre><code data-language='c'>case LVAL_STR: return "String";</code></pre>

<p>For <strong>Printing</strong> we need to do a little more. The string we store internally is different to the string we want to print. We want to print a string as a user might input it, using escape characters such as <code>\n</code> to represent a new line.</p>

<p>We therefore need to escape it before we print it. Luckily we can make use of a <code>mpc</code> function that will do this for us.</p>

<p>In the printing function we add the following...</p>

<pre><code data-language='c'>case LVAL_STR:   lval_print_str(v); break;</code></pre>

<p>Where...</p>

<pre><code data-language='c'>void lval_print_str(lval* v) {
  /* Make a Copy of the string */
  char* escaped = malloc(strlen(v-&gt;str)+1);
  strcpy(escaped, v-&gt;str);
  /* Pass it through the escape function */
  escaped = mpcf_escape(escaped);
  /* Print it between " characters */
  printf("\"%s\"", escaped);
  /* free the copied string */
  free(escaped);
}</code></pre>


<h2 id='reading_strings'>Reading Strings</h2> <hr/>

<p>Now we need to add support for parsing strings. As usual this requires first adding a new grammar rule called <code>string</code> and adding it to our parser.</p>

<p>The rule we are going to use that represents a string is going to be the same as for C style strings. This means a string is essentially a series of escape characters, or normal characters, between two quotation marks <code>""</code>. We can specify this as a regular expression inside our grammar string as follows.</p>

<pre><code>string  : /\"(\\\\.|[^\"])*\"/ ;</code></pre>

<p>This looks complicated but makes a lot more sense when explained in parts. It reads like this. A string is a <code>"</code> character, followed by zero or more of either a backslash <code>\\</code> followed by any other character <code>.</code>, or anything that <em>isn't</em> a <code>"</code> character <code>[^\\"]</code>. Finally it ends with another <code>"</code> character.</p>

<p>We also need to add a case to deal with this in the <code>lval_read</code> function.</p>

<pre><code data-language='c'>if (strstr(t-&gt;tag, "string")) { return lval_read_str(t); }</code></pre>

<p>Because the input string is input in an escaped form we need to create a function <code>lval_read_str</code> which deals with this. This function is a little tricky because it has to do a few tasks. First it must strip the input string of the <code>"</code> characters on either side. Then it must unescape the string, converting series of characters such as <code>\n</code> to their actual encoded characters. Finally it has to create a new <code>lval</code> and clean up anything that has happened in-between.</p>

<pre><code data-language='c'>lval* lval_read_str(mpc_ast_t* t) {
  /* Cut off the final quote character */
  t-&gt;contents[strlen(t-&gt;contents)-1] = '\0';
  /* Copy the string missing out the first quote character */
  char* unescaped = malloc(strlen(t-&gt;contents+1)+1);
  strcpy(unescaped, t-&gt;contents+1);
  /* Pass through the unescape function */
  unescaped = mpcf_unescape(unescaped);
  /* Construct a new lval using the string */
  lval* str = lval_str(unescaped);
  /* Free the string and return */
  free(unescaped);
  return str;
}</code></pre>

<p>If this all works we should be able to play around with strings in the prompt. Next we'll add functions which can actually make use of them.</p>

<pre><code data-language='lispy'>lispy&gt; "hello"
"hello"
lispy&gt; "hello\n"
"hello\n"
lispy&gt; "hello\""
"hello\""
lispy&gt; head {"hello" "world"}
{"hello"}
lispy&gt; eval (head {"hello" "world"})
"hello"
lispy&gt;</code></pre>


<h2 id='comments'>Comments</h2> <hr/>

<p>While we're building in new syntax to the language we may as well look at comments.</p>

<p>Just like in C, we can use comments in inform other people (or ourselves) about what the code is meant to do or why it has been written. In C comments go between <code>/*</code> and <code>*/</code>. Lisp comments, on the other hand, start with <code>;</code> and run to the end of the line.</p>

<p>I attempted to research why Lisps use <code>;</code> for comments, but it appears that the origins of this have been lost in the mists of time. I imagine it as a small rebellion against the imperative languages such as C and Java which use semicolons so shamelessly and frequently to separate/terminate statements. Compared to Lisp all these languages are just comments.</p>

<p>So in lisp a comment is defined by a semicolon <code>;</code> followed by any number of characters that are not newline characters represented by either <code>\r</code> or <code>\n</code>. We can use another regex to define it.</p>

<pre><code>comment : /;[^\\r\\n]*/ ;</code></pre>

<p>As with strings we need to create a new parser and use this to update our language in <code>mpca_lang</code>. We also need to remember to add the parser to <code>mpc_cleanup</code>, and update the first integer argument to reflect the new number of parsers passed in.</p>

<p>Our final grammar now looks like this.</p>

<pre><code data-language='c'>mpca_lang(MPCA_LANG_DEFAULT,
  "                                              \
    number  : /-?[0-9]+/ ;                       \
    symbol  : /[a-zA-Z0-9_+\\-*\\/\\\\=&lt;&gt;!&amp;]+/ ; \
    string  : /\"(\\\\.|[^\"])*\"/ ;             \
    comment : /;[^\\r\\n]*/ ;                    \
    sexpr   : '(' &lt;expr&gt;* ')' ;                  \
    qexpr   : '{' &lt;expr&gt;* '}' ;                  \
    expr    : &lt;number&gt;  | &lt;symbol&gt; | &lt;string&gt;    \
            | &lt;comment&gt; | &lt;sexpr&gt;  | &lt;qexpr&gt;;    \
    lispy   : /^/ &lt;expr&gt;* /$/ ;                  \
  ",
  Number, Symbol, String, Comment, Sexpr, Qexpr, Expr, Lispy);
</code></pre>

<p>And the cleanup function looks like this.</p>

<pre><code data-language='c'>mpc_cleanup(8,
  Number, Symbol, String, Comment,
  Sexpr,  Qexpr,  Expr,   Lispy);</code></pre>

<p>Because comments are only for programmers reading the code, our internal function for reading them in just consists of ignoring them. We can add a clause to deal with them in a similar way to brackets and parenthesis in <code>lval_read</code>.</p>

<pre><code data-language='c'>if (strstr(t-&gt;children[i]-&gt;tag, "comment")) { continue; }</code></pre>

<p>Comments won't be of much use on the interactive prompt, but they will be very helpful for adding into files of code to annotate them.</p>


<h2 id='load_function'>Load Function</h2>

<p>We want to built a function that can load and evaluate a file when passed a string of its name. To implement this function we'll need to make use of our grammar as we'll need it to to read in the file contents, parse, and evaluate them. Our load function is going to rely on our <code>mpc_parser*</code> called <code>Lispy</code>.</p>

<p>Therefore, just like with functions, we need to forward declare our parser pointers, and place them at the top of the file.</p>

<pre><code data-language='c'>mpc_parser_t* Number;
mpc_parser_t* Symbol;
mpc_parser_t* String;
mpc_parser_t* Comment;
mpc_parser_t* Sexpr;
mpc_parser_t* Qexpr;
mpc_parser_t* Expr;
mpc_parser_t* Lispy;
</code></pre>

<p>Our <code>load</code> function will be just like any other builtin. We need to start by checking that the input argument is a single string. Then we can use the <code>mpc_parse_contents</code> function to read in the contents of a file using a grammar. Just like <code>mpc_parse</code> this parses the contents of a file into some <code>mpc_result</code> object, which is our case is an <em>abstract syntax tree</em> again or an <em>error</em>.</p>

<p>Slightly differently to our command prompt, on successfully parsing a file we shouldn't treat it like one expression. When typing into a file we let users list multiple expressions and evaluate all of them individually. To achieve this behaviour we need to loop over each expression in the contents of the file and evaluate it one by one. If there are any errors we should print them and continue.</p>

<p>If there is a parse error we're going to extract the message and put it into a error <code>lval</code> which we return. If there are no errors the return value for this builtin can just be the empty expression. The full code for this looks like this.</p>

<pre><code data-language='c'>lval* builtin_load(lenv* e, lval* a) {
  LASSERT_NUM("load", a, 1);
  LASSERT_TYPE("load", a, 0, LVAL_STR);

  /* Parse File given by string name */
  mpc_result_t r;
  if (mpc_parse_contents(a-&gt;cell[0]-&gt;str, Lispy, &r)) {

    /* Read contents */
    lval* expr = lval_read(r.output);
    mpc_ast_delete(r.output);

    /* Evaluate each Expression */
    while (expr-&gt;count) {
      lval* x = lval_eval(e, lval_pop(expr, 0));
      /* If Evaluation leads to error print it */
      if (x-&gt;type == LVAL_ERR) { lval_println(x); }
      lval_del(x);
    }

    /* Delete expressions and arguments */
    lval_del(expr);
    lval_del(a);

    /* Return empty list */
    return lval_sexpr();

  } else {
    /* Get Parse Error as String */
    char* err_msg = mpc_err_string(r.error);
    mpc_err_delete(r.error);

    /* Create new error message using it */
    lval* err = lval_err("Could not load Library %s", err_msg);
    free(err_msg);
    lval_del(a);

    /* Cleanup and return error */
    return err;
  }
}</code></pre>


<h2 id='command_line_arguments'>Command Line Arguments</h2> <hr/>

<p>With the ability to load files, we can take the chance to add in some functionality typical of other programming languages. When file names are given as arguments to the command line we can try to run these files. For example to run a python file one might write <code>python filename.py</code>.</p>

<p>These command line arguments are accessible using the <code>argc</code> and <code>argv</code> variables that are given to <code>main</code>. The <code>argc</code> variable gives the number of arguments, and <code>argv</code> specifies each string. The <code>argc</code> is always set to at least one, where the first argument is always the complete command invoked.</p>

<p>That means if <code>argc</code> is set to <code>1</code> we can invoke the interpreter, otherwise we can run each of the arguments through the <code>builtin_load</code> function.</p>

<pre><code data-language='c'>/* Supplied with list of files */
if (argc &gt;= 2) {

  /* loop over each supplied filename (starting from 1) */
  for (int i = 1; i &lt; argc; i++) {

    /* Argument list with a single argument, the filename */
    lval* args = lval_add(lval_sexpr(), lval_str(argv[i]));

    /* Pass to builtin load and get the result */
    lval* x = builtin_load(e, args);

    /* If the result is an error be sure to print it */
    if (x-&gt;type == LVAL_ERR) { lval_println(x); }
    lval_del(x);
  }
}
</code></pre>

<p>It's now possible to write some basic program and try to invoke it using this method.</p>

<pre><code>lispy example.lspy</code></pre>


<h2 id='print_function'>Print Function</h2> <hr/>

<p>If we are running programs from the command line we might want them to output some data, rather than just define functions and other values. We can add a <code>print</code> function to our Lisp which makes use of our existing <code>lval_print</code> function.</p>

<p>This function prints each argument separated by a space and then prints a newline character to finish. It returns the empty expression.</p>

<pre><code data-language='c'>lval* builtin_print(lenv* e, lval* a) {

  /* Print each argument followed by a space */
  for (int i = 0; i &lt; a-&gt;count; i++) {
    lval_print(a-&gt;cell[i]); putchar(' ');
  }

  /* Print a newline and delete arguments */
  putchar('\n');
  lval_del(a);

  return lval_sexpr();
}</code></pre>


<h2 id='error_function'>Error Function</h2> <hr/>

<p>We can also make use of strings to add in an error reporting function. This can take as input a user supplied string and provide it as an error message for <code>lval_err</code>.</p>

<pre><code data-language='c'>lval* builtin_error(lenv* e, lval* a) {
  LASSERT_NUM("error", a, 1);
  LASSERT_TYPE("error", a, 0, LVAL_STR);

  /* Construct Error from first argument */
  lval* err = lval_err(a-&gt;cell[0]-&gt;str);

  /* Delete arguments and return */
  lval_del(a);
  return err;
}</code></pre>

<p>The final step is to register these as builtins. Now finally we can start building up libraries and writing them to files.</p>

<pre><code data-language='c'>/* String Functions */
lenv_add_builtin(e, "load",  builtin_load);
lenv_add_builtin(e, "error", builtin_error);
lenv_add_builtin(e, "print", builtin_print);
</code></pre>

<pre><code data-language='lispy'>lispy&gt; print "Hello World!"
"Hello World!"
()
lispy&gt; error "This is an error"
Error: This is an error
lispy&gt; load "hello.lspy"
"Hello World!"
()
lispy&gt;
</code></pre>


<h2 id='finishing_up'>Finishing Up</h2> <hr/>

<p>This is the last chapter in which we are going to explicitly work on our C implementation of Lisp. The result of this chapter will be the final state of your language implementation.</p>

<p>The final line count should clock in somewhere close to 1000 lines of code. Writing this amount of code is not trivial. If you've made it this far you've written a real program and started on a proper project. The skills you've learnt here should be transferable, and give you the confidence to seek out your own goals and targets. You now have a complex and beautiful program which you can interact and play with. This is something you should be proud of. Go show it off to your friends and family!</p>

<p>In the next chapter we start using our Lisp to build up a standard library of common functions. After that I describe some possible improvements and directions in which the language should be taken. Although we've finished with my involvement this is really this is only the beginning. Thanks for following along, and good luck with whatever C you write in the future!</p>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Adapt the builtin function <code>join</code> to work on strings.</li>
    <li class="list-group-item">&rsaquo; Adapt the builtin function <code>head</code> to work on strings.</li>
    <li class="list-group-item">&rsaquo; Adapt the builtin function <code>tail</code> to work on strings.</li>
    <li class="list-group-item">&rsaquo; Create a builtin function <code>read</code> that reads in and converts a string to a Q-expression.</li>
    <li class="list-group-item">&rsaquo; Create a builtin function <code>show</code> that can print the contents of strings as it is (unescaped).</li>
    <li class="list-group-item">&rsaquo; Create a special value <code>ok</code> to return instead of empty expressions <code>()</code>.</li>
    <li class="list-group-item">&rsaquo; Add functions to wrap all of C's file handling functions such as <code>fopen</code> and <code>fgets</code>.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter13_conditionals"><h4>&lsaquo; Conditionals</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter15_standard_library"><h4>Standard Library &rsaquo;</h4></a></td>
  </tr>
</table>