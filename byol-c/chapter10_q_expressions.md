---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter10_q_expressions/
---

<h1>Q-Expressions <small>&bull; Chapter 10</small></h1>


<h2 id='adding_features'>Adding Features</h2> <hr/>

<p>You'll notice that the following chapters will all follow a similar pattern. This pattern is the typical approach used to add new features to a language. It consists of a number of steps that bring a feature from start to finish. These are listed below, and are exactly what we're going to do in this chapter to introduce a new feature called a Q-Expression.</p>

<table class='table'>
  <tr><td><strong>Syntax</strong></td><td>Add new rule to the language grammar for this feature.</td></tr>
  <tr><td><strong>Representation</strong></td><td>Add new data type variation to represent this feature.</td></tr>
  <tr><td><strong>Parsing</strong></td><td>Add new functions for reading this feature from the <em>abstract syntax tree</em>.</td></tr>
  <tr><td><strong>Semantics</strong></td><td>Add new functions for evaluating and manipulating this feature.</td></tr>
</table>


<h2 id='quoted_expressions'>Quoted Expressions</h2> <hr/>

<p>In this chapter we'll implement a new type of Lisp Value called a Q-Expression.</p>

<p>This stands for <em>quoted expression</em>, and is a type of Lisp Expression that is not evaluated by the standard Lisp mechanics. When encountered by the evaluation function Q-expressions are left exactly as they are. This makes them ideal for a number of purposes. We can use them to store and manipulate other Lisp values such as numbers, symbols, or other S-Expressions themselves.</p>

<p>After we've added Q-Expressions we are going to implement a concise set of operators to manipulate them. Like the arithmetic operators these will prove fundamental in how we think about and play with expressions.</p>

<p>The syntax for Q-Expressions is very similar to that of S-Expressions. The only difference is that instead of parenthesis <code>()</code> Q-Expressions are surrounded by curly brackets <code>{}</code>. We can add this to our grammar as follows.</p>

<div class="alert alert-warning">
  <p><strong>I've never heard of Q-Expressions.</strong></p>

  <p>Q-Expressions don't exist in other Lisps. Other Lisps use <em>Macros</em> to stop evaluation. These look like normal functions, but they do not evaluate their arguments. A special Macro called quote <code>'</code> exists, which can be used to stop the evaluation of almost anything. This is the inspiration for Q-Expressions, which are unique to our Lisp, and will be used instead of Macros for doing all the same tasks and more.</p>

  <p>The way I've used <em>S-Expression</em> and <em>Q-Expression</em> in this book is a slight abuse of terminology, but I hope this misdemeanor makes the behaviour of our Lisp clearer.</p>
</div>

<pre><code data-language='c'>mpc_parser_t* Number = mpc_new("number");
mpc_parser_t* Symbol = mpc_new("symbol");
mpc_parser_t* Sexpr  = mpc_new("sexpr");
mpc_parser_t* Qexpr  = mpc_new("qexpr");
mpc_parser_t* Expr   = mpc_new("expr");
mpc_parser_t* Lispy  = mpc_new("lispy");

mpca_lang(MPCA_LANG_DEFAULT,
  "                                                    \
    number : /-?[0-9]+/ ;                              \
    symbol : '+' | '-' | '*' | '/' ;                   \
    sexpr  : '(' &lt;expr&gt;* ')' ;                         \
    qexpr  : '{' &lt;expr&gt;* '}' ;                         \
    expr   : &lt;number&gt; | &lt;symbol&gt; | &lt;sexpr&gt; | &lt;qexpr&gt; ; \
    lispy  : /^/ &lt;expr&gt;* /$/ ;                         \
  ",
  Number, Symbol, Sexpr, Qexpr, Expr, Lispy);</code></pre>

<p>We also must remember to update our cleanup function to deal with the new rule we've added.</p>

<pre><code data-language='c'>mpc_cleanup(6, Number, Symbol, Sexpr, Qexpr, Expr, Lispy);</code></pre>


<h2 id='reading_q-expressions'>Reading Q-Expressions</h2> <hr/>

<p>Because Q-Expressions are so similar S-Expressions much of their internal behaviour is going to be the same. We're going to reuse our S-Expression data fields to represent Q-Expressions, but we still need to add a separate type to the enumeration.</p>

<pre><code data-language='C'>enum { LVAL_ERR, LVAL_NUM, LVAL_SYM, LVAL_SEXPR, LVAL_QEXPR };</code></pre>

<p>We can also add a constructor for this variation.</p>

<pre><code data-language='C'>/* A pointer to a new empty Qexpr lval */
lval* lval_qexpr(void) {
  lval* v = malloc(sizeof(lval));
  v->type = LVAL_QEXPR;
  v->count = 0;
  v->cell = NULL;
  return v;
}
</code></pre>

<p>To print and delete Q-Expressions we do essentially the same thing as with S-Expressions. We can add the relevant lines to our functions for printing and deletion as follows.</p>

<pre><code data-language='C'>void lval_print(lval* v) {
  switch (v->type) {
    case LVAL_NUM:   printf("%li", v->num); break;
    case LVAL_ERR:   printf("Error: %s", v->err); break;
    case LVAL_SYM:   printf("%s", v->sym); break;
    case LVAL_SEXPR: lval_expr_print(v, '(', ')'); break;
    case LVAL_QEXPR: lval_expr_print(v, '{', '}'); break;
  }
}
</code></pre>

<pre><code data-language='C'>void lval_del(lval* v) {

  switch (v->type) {
    case LVAL_NUM: break;
    case LVAL_ERR: free(v->err); break;
    case LVAL_SYM: free(v->sym); break;

    /* If Qexpr or Sexpr then delete all elements inside */
    case LVAL_QEXPR:
    case LVAL_SEXPR:
      for (int i = 0; i < v->count; i++) {
        lval_del(v->cell[i]);
      }
      /* Also free the memory allocated to contain the pointers */
      free(v->cell);
    break;
  }

  free(v);
}
</code></pre>

<p>Using these simple changes we can update our reading function <code>lval_read</code> to be able to read in Q-Expressions. Because we reused all the S-Expression data fields for our Q-Expression type, we can also reuse all of the functions for S-Expressions such as <code>lval_add</code>. Therefore to read in Q-Expressions we just need to add a special case for constructing an empty Q-Expression to <code>lval_read</code> just below where we detect and create empty S-Expressions from the <em>abstract syntax tree</em>.</p>

<pre><code data-language='C'>if (strstr(t->tag, "qexpr"))  { x = lval_qexpr(); }</code></pre>

<p>We also need to update <code>lval_read</code> to recognize the curly bracket characters when they appear.</p>

<pre><code data-language='C'>if (strcmp(t->children[i]->contents, "(") == 0) { continue; }
if (strcmp(t->children[i]->contents, ")") == 0) { continue; }
if (strcmp(t->children[i]->contents, "}") == 0) { continue; }
if (strcmp(t->children[i]->contents, "{") == 0) { continue; }
</code></pre>

<p>Because there is no special method of evaluating Q-Expressions, we don't need to edit any of the evaluation functions. Our Q-Expressions should be ready to try. Compile and run the program. Try using them as a new data type and ensure they are not evaluated.</p>

<pre><code data-language='lispy'>{% raw %}lispy&gt; {1 2 3 4}
{1 2 3 4}
lispy&gt; {1 2 (+ 5 6) 4}
{1 2 (+ 5 6) 4}
lispy&gt; {{2 3 4} {1}}
{{2 3 4} {1}}
lispy&gt;
{% endraw %}</code></pre>

<h2 id='builtin_functions'>Builtin Functions</h2> <hr/>

<p>We can read in Q-Expressions but they are still useless. We need some way to manipulate them.</p>

<p>For this we can define some built-in operators to work on our list type. Choosing a concise set of these is important. If we implement a few fundamental operations then we can use these to define new operations without adding extra C code. There are a few ways to pick these fundamental operators but I've chosen a set that will allow us to do everything we need. They are defined as follows.</p>

<table class='table'>
  <tr><td><code>list</code></td><td>Takes one or more arguments and returns a new Q-Expression containing the arguments</td></tr>
  <tr><td><code>head</code></td><td>Takes a Q-Expression and returns a Q-Expression with only the first element</td></tr>
  <tr><td><code>tail</code></td><td>Takes a Q-Expression and returns a Q-Expression with the first element removed</td></tr>
  <tr><td><code>join</code></td><td>Takes one or more Q-Expressions and returns a Q-Expression of them conjoined together</td></tr>
  <tr><td><code>eval</code></td><td>Takes a Q-Expression and evaluates it as if it were a S-Expression</td></tr>
</table>

<p>Like with our mathematical operators we should add these functions as possible valid symbols. Afterward we can go about trying to define their behaviour in a similar way to <code>builtin_op</code>.</p>

<pre><code data-language='c'>mpca_lang(MPCA_LANG_DEFAULT,
  "                                                        \
    number : /-?[0-9]+/ ;                                  \
    symbol : \"list\" | \"head\" | \"tail\"                \
           | \"join\" | \"eval\" | '+' | '-' | '*' | '/' ; \
    sexpr  : '(' &lt;expr&gt;* ')' ;                             \
    qexpr  : '{' &lt;expr&gt;* '}' ;                             \
    expr   : &lt;number&gt; | &lt;symbol&gt; | &lt;sexpr&gt; | &lt;qexpr&gt; ;     \
    lispy  : /^/ &lt;expr&gt;* /$/ ;                             \
  ",
  Number, Symbol, Sexpr, Qexpr, Expr, Lispy)
</code></pre>


<h2 id='first_attempt'>First Attempt</h2> <hr/>

<p>Our builtin functions should have the same interface as <code>builtin_op</code>. That means the arguments should be bundled into an S-Expression which the function must use and then delete. They should return a new <code>lval*</code> as a result of the evaluation.</p>

<p>The actual functionality of taking the head or tail of an Q-Expression shouldn't be too hard for us. We can make use of the existing functions we've defined for S-Expressions such as <code>lval_take</code> and <code>lval_pop</code>. But like <code>builtin_op</code> we also need to check that the inputs we get are valid.</p>

<p>Let's take a look at <code>head</code> and <code>tail</code> first. These functions have a number of conditions under which they can't act. First of all we must ensure they are only passed a single argument, and that that argument is a Q-Expression. Then we need to ensure that this Q-Expression isn't empty and actually has some elements.</p>

<p>The <code>head</code> function can repeatedly pop and delete the item at index <code>1</code> until there is nothing else left in the list.</p>

<p>The <code>tail</code> function is even more simple. It can pop and delete the item at index <code>0</code>, leaving the tail remaining. An initial attempt at these functions might look like this.</p>

<pre><code data-language="c">lval* builtin_head(lval* a) {
  /* Check Error Conditions */
  if (a-&gt;count != 1) {
    lval_del(a);
    return lval_err("Function 'head' passed too many arguments!");
  }

  if (a-&gt;cell[0]-&gt;type != LVAL_QEXPR) {
    lval_del(a);
    return lval_err("Function 'head' passed incorrect types!");
  }

  if (a-&gt;cell[0]-&gt;count == 0) {
    lval_del(a);
    return lval_err("Function 'head' passed {}!");
  }

  /* Otherwise take first argument */
  lval* v = lval_take(a, 0);

  /* Delete all elements that are not head and return */
  while (v-&gt;count &gt; 1) { lval_del(lval_pop(v, 1)); }
  return v;
}
</code></pre>

<pre><code data-language="c">lval* builtin_tail(lval* a) {
  /* Check Error Conditions */
  if (a-&gt;count != 1) {
    lval_del(a);
    return lval_err("Function 'tail' passed too many arguments!");
  }

  if (a-&gt;cell[0]-&gt;type != LVAL_QEXPR) {
    lval_del(a);
    return lval_err("Function 'tail' passed incorrect types!");
  }

  if (a-&gt;cell[0]-&gt;count == 0) {
    lval_del(a);
    return lval_err("Function 'tail' passed {}!");
  }

  /* Take first argument */
  lval* v = lval_take(a, 0);

  /* Delete first element and return */
  lval_del(lval_pop(v, 0));
  return v;
}</code></pre>


<h2 id='macros'>Macros</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/strawberry.png" alt="strawberry" class="img-responsive" width="297px" height="200px"/>
  <p><small>Strawberry &bull; A delicious macro.</small></p>
</div>

<p>These <code>head</code> and <code>tail</code> functions do the correct thing, but the code is pretty unclear, and long. There is so much error checking that the functionality is hard to see. One method we can use to clean it up is to use a <em>Macro</em>.</p>

<p>A Macro is a <em>preprocessor</em> statement for creating function-like-things that are evaluated before the program is compiled. It can be used for many different things, one of which is what we need to do here, clean up code.</p>

<p>Macros work by taking some arguments (which can be almost anything), and copying and pasting them into some given pattern. By changing the pattern or the arguments we can alter what code is generated by the Macro. To define macros we use the <code>#define</code> preprocessor directive. After this we write the name of the macro, followed by the argument names in parenthesis. After this the pattern is specified, to declare what code should be generated for the given arguments.</p>

<p>We can design a macro to help with our error conditions called <code>LASSERT</code>. Macros are typically given names in capitals to help distinguish them from normal C functions. This macro take in three arguments <code>args</code>, <code>cond</code> and <code>err</code>. It then generates code as shown on the right hand side, but with these variables pasted in at the locations where they are named. This pattern is a good fit for all of our error conditions.</p>

<pre><code data-language="c">#define LASSERT(args, cond, err) \
  if (!(cond)) { lval_del(args); return lval_err(err); }</code></pre>

<p>We can use this to change how our above functions are written, without actually changing what code is generated by the compiler. This makes it much easier to read for the programmer, and saves a bit of typing. The rest of the error conditions for our functions should become easy to write too!</p>

<h3>Head &amp; Tail</h3>

<p>Using this our <code>head</code> and <code>tail</code> functions are defined as follows. Notice how much clearer their real functionality is.</p>

<pre><code data-language="c">lval* builtin_head(lval* a) {
  LASSERT(a, a-&gt;count == 1,
    "Function 'head' passed too many arguments!");
  LASSERT(a, a-&gt;cell[0]-&gt;type == LVAL_QEXPR,
    "Function 'head' passed incorrect type!");
  LASSERT(a, a-&gt;cell[0]-&gt;count != 0,
    "Function 'head' passed {}!");

  lval* v = lval_take(a, 0);
  while (v-&gt;count &gt; 1) { lval_del(lval_pop(v, 1)); }
  return v;
}
</code></pre>

<pre><code data-language="c">lval* builtin_tail(lval* a) {
  LASSERT(a, a-&gt;count == 1,
    "Function 'tail' passed too many arguments!");
  LASSERT(a, a-&gt;cell[0]-&gt;type == LVAL_QEXPR,
    "Function 'tail' passed incorrect type!");
  LASSERT(a, a-&gt;cell[0]-&gt;count != 0,
    "Function 'tail' passed {}!");

  lval* v = lval_take(a, 0);
  lval_del(lval_pop(v, 0));
  return v;
}</code></pre>

<h3>List &amp; Eval</h3>

<p>The <code>list</code> function is simple. It just converts the input S-Expression to a Q-Expression and returns it.</p>

<p>The <code>eval</code> function is similar to the converse. It takes as input some single Q-Expression, which it converts to an S-Expression, and evaluates using <code>lval_eval</code>.</p>

<pre><code data-language='c'>lval* builtin_list(lval* a) {
  a-&gt;type = LVAL_QEXPR;
  return a;
}
</code></pre>

<pre><code data-language='c'>lval* builtin_eval(lval* a) {
  LASSERT(a, a-&gt;count == 1,
    "Function 'eval' passed too many arguments!");
  LASSERT(a, a-&gt;cell[0]-&gt;type == LVAL_QEXPR,
    "Function 'eval' passed incorrect type!");

  lval* x = lval_take(a, 0);
  x-&gt;type = LVAL_SEXPR;
  return lval_eval(x);
}</code></pre>

<h3>Join</h3>

<p>The <code>join</code> function is our final function to define.</p>

<p>Unlike the others it can take multiple arguments, so its structure looks somewhat more like that of <code>builtin_op</code>. First we check that all of the arguments are Q-Expressions and then we join them together one by one. To do this we use the function <code>lval_join</code>. This works by repeatedly popping each item from <code>y</code> and adding it to <code>x</code> until <code>y</code> is empty. It then deletes <code>y</code> and returns <code>x</code>.</p>

<pre><code data-language="c">lval* builtin_join(lval* a) {

  for (int i = 0; i &lt; a-&gt;count; i++) {
    LASSERT(a, a-&gt;cell[i]-&gt;type == LVAL_QEXPR,
      "Function 'join' passed incorrect type.");
  }

  lval* x = lval_pop(a, 0);

  while (a-&gt;count) {
    x = lval_join(x, lval_pop(a, 0));
  }

  lval_del(a);
  return x;
}
</code></pre>

<pre><code data-language='c'>lval* lval_join(lval* x, lval* y) {

  /* For each cell in 'y' add it to 'x' */
  while (y-&gt;count) {
    x = lval_add(x, lval_pop(y, 0));
  }

  /* Delete the empty 'y' and return 'x' */
  lval_del(y);
  return x;
}</code></pre>


<h2 id='builtins_lookup'>Builtins Lookup</h2> <hr/>

<p>We've now got all of our builtin functions defined. We need to make a function that can call the correct one depending on what symbol it encounters in evaluation. We can do this using <code>strcmp</code> and <code>strstr</code>.</p>

<pre><code data-language='c'>lval* builtin(lval* a, char* func) {
  if (strcmp("list", func) == 0) { return builtin_list(a); }
  if (strcmp("head", func) == 0) { return builtin_head(a); }
  if (strcmp("tail", func) == 0) { return builtin_tail(a); }
  if (strcmp("join", func) == 0) { return builtin_join(a); }
  if (strcmp("eval", func) == 0) { return builtin_eval(a); }
  if (strstr("+-/*", func)) { return builtin_op(a, func); }
  lval_del(a);
  return lval_err("Unknown Function!");
}</code></pre>

<p>Then we can change our evaluation line in <code>lval_eval_sexpr</code> to call <code>builtin</code> rather than <code>builtin_op</code>.</p>

<pre><code data-language='c'>/* Call builtin with operator */
lval* result = builtin(v, f-&gt;sym);
lval_del(f);
return result;</code></pre>

<p>Finally Q-Expressions should be fully supported in our language. Compile and run the latest version and see what you can do with the new list operators. Try putting code and symbols into our lists and evaluating them in different ways. The ability to put S-Expressions inside a list using Q-Expressions is pretty awesome. It means we can treat code like data itself. This is a flagship feature of Lisps, and something that really cannot be done in languages such as C!</p>

<pre><code data-language='lispy'>{% raw %}lispy&gt; list 1 2 3 4
{1 2 3 4}
lispy&gt; {head (list 1 2 3 4)}
{head (list 1 2 3 4)}
lispy&gt; eval {head (list 1 2 3 4)}
{1}
lispy&gt; tail {tail tail tail}
{tail tail}
lispy&gt; eval (tail {tail tail {5 6 7}})
{6 7}
lispy&gt; eval (head {(+ 1 2) (+ 10 20)})
3{% endraw %}</code></pre>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; What are the four typical steps for adding new language features?</li>
    <li class="list-group-item">&rsaquo; Create a Macro specifically for testing for the incorrect number of arguments.</li>
    <li class="list-group-item">&rsaquo; Create a Macro specifically for testing for being called with the empty list.</li>
    <li class="list-group-item">&rsaquo; Add a builtin function <code>cons</code> that takes a value and a Q-Expression and appends it to the front.</li>
    <li class="list-group-item">&rsaquo; Add a builtin function <code>len</code> that returns the number of elements in a Q-Expression.</li>
    <li class="list-group-item">&rsaquo; Add a builtin function <code>init</code> that returns all of a Q-Expression except the final element.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter9_s_expressions"><h4>&lsaquo; S-Expressions</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter11_variables"><h4>Variables &rsaquo;</h4></a></td>
  </tr>
</table>