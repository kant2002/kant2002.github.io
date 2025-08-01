---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter11_variables/
---

<h1>Variables <small>&bull; Chapter 11</small></h1>


<h2 id='immutability'>Immutability</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/turtle.png" alt="turtle" class="img-responsive" width="279px" height="267px"/>
  <p><small>Teenage Ninja Turtle &bull; Not Immutable.</small></p>
</div>

<p>In the previous chapters we've made considerable progress on the infrastructure of our language.</p>

<p>Already we can do a number of cool things that other languages can't, such as putting code inside lists. Now is the time to start adding in the <em>features</em> which will make our language practical. The first one of these is going to be <em>variables</em>.</p>

<p>They're called variables, but it's a misleading name, because our variables won't vary. Our variables are <em>immutable</em> meaning they cannot change. Everything in our language so far has acted as if it is <em>immutable</em>. When we evaluate an expression we have imagined that the previous thing has been deleted and a new thing returned. In implementation often it is easier for us to reuse the data from the previous thing to build the new thing, but conceptually it is a good way to think about how our language works.</p>

<p>So actually our variables are simply a way of <em>naming values</em>. They let us assign a <em>name</em> to a <em>value</em>, and then let us get a copy of that <em>value</em> later on when we need it.</p>

<p>To allow for <em>naming values</em> we need to create a structure which stores the name and value of everything named in our program. We call this the <em>environment</em>. When we start a new interactive prompt we want to create a new environment to go along with it, in which each new bit of input is evaluated. Then we can store and recall variables as we program.</p>

<div class="alert alert-warning">
  <p><strong>What happens when we re-assign a name to something new? Isn't this like mutability?</strong></p>

  <p>In our Lisp, when we re-assign a name we're going to delete the old association and create a new one. This gives the illusion that the thing assigned to that name has changed, and is mutable, but in fact we have deleted the old thing and assigned it a new thing. This is different to C where we really can change the data pointed to by a pointer, or stored in a struct, without deleting it and creating a new one.</p>
</div>


<h2 id='symbol_syntax'>Symbol Syntax</h2> <hr/>

<p>Now that we're going to allow for user defined variables we need to update the grammar for symbols to be more flexible. Rather than just our builtin functions it should match any possible valid symbol. Unlike in C, where the name a variable can be given is fairly restrictive, we're going to allow for all sorts of characters in the name of a variable.</p>

<p>We can create a regular expression that expresses the range of characters available as follows.</p>

<pre><code>/[a-zA-Z0-9_+\\-*\\/\\\\=&lt;&gt;!&amp;]+/</code></pre>

<p>On first glance this looks like we've just bashed our hands into keyboard. Actually it is a regular expression using a big range specifier <code>[]</code>. Inside range specifiers special characters lose their meaning, but some of these characters still need to be escaped with backslashes. Because this is part of a C string we need to put two backslashes to represent a single backslash character in the input.</p>

<p>This rule lets symbols be any of the normal C identifier characters <code>a-zA-Z0-9_</code> the arithmetic operator characters <code>+\\-*\\/</code> the backslash character <code>\\\\</code> the comparison operator characters <code>=&lt;&gt;!</code> or an ampersands <code>&amp;</code>. This will give us all the flexibility we need for defining new and existing symbols.</p>

<pre><code data-language='C'>mpca_lang(MPCA_LANG_DEFAULT,
  "                                                     \
    number : /-?[0-9]+/ ;                               \
    symbol : /[a-zA-Z0-9_+\\-*\\/\\\\=&lt;&gt;!&amp;]+/ ;         \
    sexpr  : '(' &lt;expr&gt;* ')' ;                          \
    qexpr  : '{' &lt;expr&gt;* '}' ;                          \
    expr   : &lt;number&gt; | &lt;symbol&gt; | &lt;sexpr&gt; | &lt;qexpr&gt; ;  \
    lispy  : /^/ &lt;expr&gt;* /$/ ;                          \
  ",
  Number, Symbol, Sexpr, Qexpr, Expr, Lispy);
</code></pre>


<h2 id='function_pointers'>Function Pointers</h2> <hr/>

<p>Once we introduce variables, symbols will no longer represent functions in our language, but rather they will represent a name for us to look up into our environment and get some new value back from.</p>

<p>Therefore we need a new value to represent functions in our language, which we can return once one of the builtin symbols is encountered. To create this new type of <code>lval</code> we are going to use something called a <em>function pointer</em>.</p>

<p>Function pointers are a great feature of C that lets you store and pass around pointers to functions. It doesn't make sense to edit the data pointed to by these pointers. Instead we use them to call the function they point to, as if it were a normal function.</p>

<p>Like normal pointers, function pointers have some type associated with them. This type specifies the type of the function pointed to, not the type of the data pointed to. This lets the compiler work out if it has been called correctly.</p>

<p>In the previous chapter our builtin functions took a <code>lval*</code> as input and returned a <code>lval*</code> as output. In this chapter our builtin functions will take an extra pointer to the environment <code>lenv*</code> as input. We can declare a new function pointer type called <code>lbuiltin</code>, for this type of function, like this.</p>

<pre><code data-language='c'>typedef lval*(*lbuiltin)(lenv*, lval*);</code></pre>

<div class="alert alert-warning">
  <p><strong>Why is that syntax so odd?</strong></p>

  <p>In some places the syntax of C can look particularly weird. It can help if we understand exactly why the syntax is like this. Let us de-construct the syntax in the example above part by part.</p>

  <p>First the <code>typedef</code>. This can be put before any standard variable declaration. It results in the name of the variable, being declared a new type, matching what would be the inferred type of that variable. This is why in the above declaration what looks like the function name becomes the new type name.</p>

  <p>Next all those <code>*</code>. Pointer types in C are actually meant to be written with the star <code>*</code> on the left hand side of the variable name, not the right hand side of the type <code>int *x;</code>. This is because C type syntax works by a kind of inference. Instead of reading <em>"Create a new <code>int</code> pointer <code>x</code>"</em>. It is meant to read <em>"Create a new variable <code>x</code> where to dereference <code>x</code> results in an <code>int</code>."</em> Therefore <code>x</code> is inferred to be a pointer to an <code>int</code>.</p>

  <p>This idea is extended to function pointers. We can read the above declaration as follows. <em>"To get an <code>lval*</code> we dereference <code>lbuiltin</code> and call it with a <code>lenv*</code> and a <code>lval*</code>."</em> Therefore <code>lbuiltin</code> must be a function pointer that takes an <code>lenv*</code> and a <code>lval*</code> and returns a <code>lval*</code>.</p>
</div>

<h2 id='cyclic_types'>Cyclic Types</h2> <hr/>

<p>The <code>lbuiltin</code> type references the <code>lval</code> type and the <code>lenv</code> type. This means that they should be declared first in the source file.</p>

<p>But we want to make a <code>lbuiltin</code> field in our <code>lval</code> struct so we can create function values. So therefore our <code>lbuiltin</code> declaration must go before our <code>lval</code> declaration. This leads to what is called a cyclic type dependency, where two types depend on each other.</p>

<p>We've come across this problem before with functions which depend on each other. The solution was to create a <em>forward declaration</em> which declared a function but left the body of it empty.</p>

<p>In C we can do exactly the same with types. First we declare two <code>struct</code> types without a body. Secondly we typedef these to the names <code>lval</code> and <code>lenv</code>. Then we can define our <code>lbuiltin</code> function pointer type. And finally we can define the body of our <code>lval</code> struct. Now all our type issues are resolved and the compiler won't complain any more.</p>

<pre><code data-language='c'>/* Forward Declarations */

struct lval;
struct lenv;
typedef struct lval lval;
typedef struct lenv lenv;

/* Lisp Value */

enum { LVAL_ERR, LVAL_NUM,   LVAL_SYM,
       LVAL_FUN, LVAL_SEXPR, LVAL_QEXPR };

typedef lval*(*lbuiltin)(lenv*, lval*);

struct lval {
  int type;

  long num;
  char* err;
  char* sym;
  lbuiltin fun;

  int count;
  lval** cell;
};</code></pre>


<h2 id='function_type'>Function Type</h2> <hr/>

<p>As we've added a new possible <code>lval</code> type with the enumeration <code>LVAL_FUN</code>. We should update all our relevant functions that work on <code>lvals</code> to deal correctly with this update. In most cases this just means inserting new cases into switch statements.</p>

<p>We can start by making a new constructor function for this type.</p>

<pre><code data-language='c'>lval* lval_fun(lbuiltin func) {
  lval* v = malloc(sizeof(lval));
  v-&gt;type = LVAL_FUN;
  v-&gt;fun = func;
  return v;
}</code></pre>

<p>On <strong>deletion</strong> we don't need to do anything special for function pointers.</p>

<pre><code data-language='c'>case LVAL_FUN: break;</code></pre>

<p>On <strong>printing</strong> we can just print out a nominal string.</p>

<pre><code data-language='c'>case LVAL_FUN:   printf("&lt;function&gt;"); break;</code></pre>

<p>We're also going to add a new function for <strong>copying</strong> an <code>lval</code>. This is going to come in useful when we put things into, and take things out of, the environment. For numbers and functions we can just copy the relevant fields directly. For strings we need to copy using <code>malloc</code> and <code>strcpy</code>. To copy lists we need to allocate the correct amount of space and then copy each element individually.</p>

<pre><code data-language='c'>lval* lval_copy(lval* v) {

  lval* x = malloc(sizeof(lval));
  x->type = v-&gt;type;

  switch (v-&gt;type) {

    /* Copy Functions and Numbers Directly */
    case LVAL_FUN: x-&gt;fun = v-&gt;fun; break;
    case LVAL_NUM: x-&gt;num = v-&gt;num; break;

    /* Copy Strings using malloc and strcpy */
    case LVAL_ERR:
      x-&gt;err = malloc(strlen(v-&gt;err) + 1);
      strcpy(x-&gt;err, v-&gt;err); break;

    case LVAL_SYM:
      x-&gt;sym = malloc(strlen(v-&gt;sym) + 1);
      strcpy(x-&gt;sym, v-&gt;sym); break;

    /* Copy Lists by copying each sub-expression */
    case LVAL_SEXPR:
    case LVAL_QEXPR:
      x-&gt;count = v-&gt;count;
      x-&gt;cell = malloc(sizeof(lval*) * x-&gt;count);
      for (int i = 0; i &lt; x-&gt;count; i++) {
        x-&gt;cell[i] = lval_copy(v-&gt;cell[i]);
      }
    break;
  }

  return x;
}</code></pre>


<h2 id='environment'>Environment</h2> <hr/>

<p>Our environment structure must encode a list of relationships between <em>names</em> and <em>values</em>. There are many ways to build a structure that can do this sort of thing. We are going to go for the simplest possible method that works well. This is to use two lists of equal length. One is a list of <code>lval*</code>, and the other is a list of <code>char*</code>. Each entry in one list has a corresponding entry in the other list at the same position.</p>

<p>We've already forward declared our <code>lenv</code> struct, so we can define it as follows.</p>

<pre><code data-language='c'>struct lenv {
  int count;
  char** syms;
  lval** vals;
};</code></pre>

<p>We need some functions to create and delete this structure. These are pretty simple. Creation initialises the struct fields, while deletion iterates over the items in both lists and deletes or frees them.</p>

<pre><code data-language='c'>lenv* lenv_new(void) {
  lenv* e = malloc(sizeof(lenv));
  e-&gt;count = 0;
  e-&gt;syms = NULL;
  e-&gt;vals = NULL;
  return e;
}</code></pre>

<pre><code data-language='c'>void lenv_del(lenv* e) {
  for (int i = 0; i &lt; e-&gt;count; i++) {
    free(e-&gt;syms[i]);
    lval_del(e-&gt;vals[i]);
  }
  free(e-&gt;syms);
  free(e-&gt;vals);
  free(e);
}</code></pre>

<p>Next we can create two functions that either get values from the environment or put values into it.</p>

<p>To get a value from the environment we loop over all the items in the environment and check if the given symbol matches any of the stored strings. If we find a match we can return a copy of the stored value. If no match is found we should return an error.</p>

<p>The function for putting new variables into the environment is a little bit more complex. First we want to check if a variable with the same name already exists. If this is the case we should replace its value with the new one. To do this we loop over all the existing variables in the environment and check their name. If a match is found we delete the value stored at that location, and store there a copy of the input value.</p>

<p>If no existing value is found with that name, we need to allocate some more space to put it in. For this we can use <code>realloc</code>, and store a copy of the <code>lval</code> and its name at the newly allocated locations.</p>

<pre><code data-language='c'>lval* lenv_get(lenv* e, lval* k) {

  /* Iterate over all items in environment */
  for (int i = 0; i &lt; e-&gt;count; i++) {
    /* Check if the stored string matches the symbol string */
    /* If it does, return a copy of the value */
    if (strcmp(e-&gt;syms[i], k-&gt;sym) == 0) {
      return lval_copy(e-&gt;vals[i]);
    }
  }
  /* If no symbol found return error */
  return lval_err("unbound symbol!");
}</code></pre>

<pre><code data-language='c'>void lenv_put(lenv* e, lval* k, lval* v) {

  /* Iterate over all items in environment */
  /* This is to see if variable already exists */
  for (int i = 0; i &lt; e-&gt;count; i++) {

    /* If variable is found delete item at that position */
    /* And replace with variable supplied by user */
    if (strcmp(e-&gt;syms[i], k-&gt;sym) == 0) {
      lval_del(e-&gt;vals[i]);
      e-&gt;vals[i] = lval_copy(v);
      return;
    }
  }

  /* If no existing entry found allocate space for new entry */
  e-&gt;count++;
  e-&gt;vals = realloc(e-&gt;vals, sizeof(lval*) * e-&gt;count);
  e-&gt;syms = realloc(e-&gt;syms, sizeof(char*) * e-&gt;count);

  /* Copy contents of lval and symbol string into new location */
  e-&gt;vals[e-&gt;count-1] = lval_copy(v);
  e-&gt;syms[e-&gt;count-1] = malloc(strlen(k-&gt;sym)+1);
  strcpy(e-&gt;syms[e-&gt;count-1], k-&gt;sym);
}</code></pre>


<h2 id='variable_evaluation'>Variable Evaluation</h2> <hr/>

<p>Our evaluation function now depends on some environment. We should pass this in as an argument and use it to get a value if we encounter a symbol type. Because our environment returns a copy of the value we need to remember to delete the input symbol <code>lval</code>.</p>

<pre><code data-language='c'>lval* lval_eval(lenv* e, lval* v) {
  if (v-&gt;type == LVAL_SYM) {
    lval* x = lenv_get(e, v);
    lval_del(v);
    return x;
  }
  if (v-&gt;type == LVAL_SEXPR) { return lval_eval_sexpr(e, v); }
  return v;
}</code></pre>

<p>Because we've added a function type, our evaluation of S-Expressions also needs to change. Instead of checking for a symbol type we want to ensure it is a function type. If this condition holds we can call the <code>fun</code> field of the <code>lval</code> using the same notation as standard function calls.</p>

<pre><code data-language='c'>lval* lval_eval_sexpr(lenv* e, lval* v) {

  for (int i = 0; i &lt; v-&gt;count; i++) {
    v-&gt;cell[i] = lval_eval(e, v-&gt;cell[i]);
  }

  for (int i = 0; i &lt; v-&gt;count; i++) {
    if (v-&gt;cell[i]-&gt;type == LVAL_ERR) { return lval_take(v, i); }
  }

  if (v-&gt;count == 0) { return v; }
  if (v-&gt;count == 1) { return lval_take(v, 0); }

  /* Ensure first element is a function after evaluation */
  lval* f = lval_pop(v, 0);
  if (f-&gt;type != LVAL_FUN) {
    lval_del(v); lval_del(f);
    return lval_err("first element is not a function");
  }

  /* If so call function to get result */
  lval* result = f-&gt;fun(e, v);
  lval_del(f);
  return result;
}</code></pre>


<h2 id='builtins'>Builtins</h2> <hr/>

<p>Now that our evaluation relies on the new function type we need to make sure we can register all of our builtin functions with the environment before we start the interactive prompt. At the moment our builtin functions are not the correct type. We need to change their type signature such that they take in some environment, and where appropriate change them to pass this environment into other calls that require it. I won't post the code for this, so go ahead and change the type signatures of the builtin functions to take an <code>lenv*</code> as their first argument now. If you are confused you can look at the sample code for this chapter.</p>

<p>As an example we can make use of our <code>builtin_op</code> function to define separate builtins for each of the maths functions our language supports.</p>

<pre><code data-language='c'>lval* builtin_add(lenv* e, lval* a) {
  return builtin_op(e, a, "+");
}

lval* builtin_sub(lenv* e, lval* a) {
  return builtin_op(e, a, "-");
}

lval* builtin_mul(lenv* e, lval* a) {
  return builtin_op(e, a, "*");
}

lval* builtin_div(lenv* e, lval* a) {
  return builtin_op(e, a, "/");
}
</code></pre>

<p>Once we've changed the builtins to the correct type we can create a function that registers all of our builtins into an environment.</p>

<p>For each builtin we want to create a function <code>lval</code> and symbol <code>lval</code> with the given name. We then register these with the environment using <code>lenv_put</code>. The environment always takes or returns copies of a values, so we need to remember to delete these two <code>lval</code> after registration as we won't need them any more.</p>

<p>If we split this task into two functions we can neatly register all of our builtins with some environment.</p>

<pre><code data-language='c'>void lenv_add_builtin(lenv* e, char* name, lbuiltin func) {
  lval* k = lval_sym(name);
  lval* v = lval_fun(func);
  lenv_put(e, k, v);
  lval_del(k); lval_del(v);
}

void lenv_add_builtins(lenv* e) {
  /* List Functions */
  lenv_add_builtin(e, "list", builtin_list);
  lenv_add_builtin(e, "head", builtin_head);
  lenv_add_builtin(e, "tail", builtin_tail);
  lenv_add_builtin(e, "eval", builtin_eval);
  lenv_add_builtin(e, "join", builtin_join);

  /* Mathematical Functions */
  lenv_add_builtin(e, "+", builtin_add);
  lenv_add_builtin(e, "-", builtin_sub);
  lenv_add_builtin(e, "*", builtin_mul);
  lenv_add_builtin(e, "/", builtin_div);
}</code></pre>

<p>The final step is to call this function before we create the interactive prompt. We also need to remember to delete the environment once we are finished.</p>

<pre><code data-language='c'>lenv* e = lenv_new();
lenv_add_builtins(e);

while (1) {

  char* input = readline("lispy&gt; ");
  add_history(input);

  mpc_result_t r;
  if (mpc_parse("&lt;stdin&gt;", input, Lispy, &r)) {

    lval* x = lval_eval(e, lval_read(r.output));
    lval_println(x);
    lval_del(x);

    mpc_ast_delete(r.output);
  } else {
    mpc_err_print(r.error);
    mpc_err_delete(r.error);
  }

  free(input);

}

lenv_del(e);
</code></pre>

<p>If everything is working correctly we should have a play around in the prompt and verify that functions are actually a new type of value now, not symbols.</p>

<pre><code data-language='lispy'>lispy&gt; +
&lt;function&gt;
lispy&gt; eval (head {5 10 11 15})
5
lispy&gt; eval (head {+ - + - * /})
&lt;function&gt;
lispy&gt; (eval (head {+ - + - * /})) 10 20
30
lispy&gt; hello
Error: unbound symbol!
lispy&gt;</code></pre>


<h2 id='define_function'>Define Function</h2> <hr/>

<p>We've managed to register our builtins as variables but we still don't have a way for users to define their own variables.</p>

<p>This is actually a bit awkward. We need to get the user to pass in a symbol to name, as well as the value to assign to it. But symbols can't appear on their own. Otherwise the evaluation function will attempt to retrieve a value for them from the environment.</p>

<p>The only way we can pass around symbols without them being evaluated is to put them between <code>{}</code> in a quoted expression. So we're going to use this technique for our define function. It will take as input a list of symbols, and a number of other values. It will then assign each of the values to each of the symbols.</p>

<p>This function should act like any other builtin. It first checks for error conditions and then performs some command and returns a value. In this case it first checks that the input arguments are the correct types. It then iterates over each symbol and value and puts them into the environment. If there is an error we can return it, but on success we will return the empty expression <code>()</code>.</p>

<pre><code data-language='c'>lval* builtin_def(lenv* e, lval* a) {
  LASSERT(a, a-&gt;cell[0]-&gt;type == LVAL_QEXPR,
    "Function 'def' passed incorrect type!");

  /* First argument is symbol list */
  lval* syms = a-&gt;cell[0];

  /* Ensure all elements of first list are symbols */
  for (int i = 0; i &lt; syms-&gt;count; i++) {
    LASSERT(a, syms-&gt;cell[i]-&gt;type == LVAL_SYM,
      "Function 'def' cannot define non-symbol");
  }

  /* Check correct number of symbols and values */
  LASSERT(a, syms-&gt;count == a-&gt;count-1,
    "Function 'def' cannot define incorrect "
    "number of values to symbols");

  /* Assign copies of values to symbols */
  for (int i = 0; i &lt; syms-&gt;count; i++) {
    lenv_put(e, syms-&gt;cell[i], a-&gt;cell[i+1]);
  }

  lval_del(a);
  return lval_sexpr();
}</code></pre>

<p>We need to register this new builtin using our builtin function <code>lenv_add_builtins</code>.</p>

<pre><code data-language='c'>/* Variable Functions */
lenv_add_builtin(e, "def",  builtin_def);</code></pre>

<p>Now we should be able to support user defined variables. Because our <code>def</code> function takes in a list of symbols we can do some cool things storing and manipulating symbols in lists before passing them to be defined. Have a play around in the prompt and ensure everything is working correctly. You should get behaviour as follows. Explore what other complex methods are possible for the definition and evaluation of variables. Once we get to defining functions we'll really see some of the useful things that can be done with this approach.</p>

<pre><code data-language='lispy'>lispy&gt; def {x} 100
()
lispy&gt; def {y} 200
()
lispy&gt; x
100
lispy&gt; y
200
lispy&gt; + x y
300
lispy&gt; def {a b} 5 6
()
lispy&gt; + a b
11
lispy&gt; def {arglist} {a b x y}
()
lispy&gt; arglist
{a b x y}
lispy&gt; def arglist 1 2 3 4
()
lispy&gt; list a b x y
{1 2 3 4}
lispy&gt;</code></pre>


<h2 id='error_reporting'>Error Reporting</h2> <hr/>

<p>So far our error reporting doesn't work so well. We can report when an error occurs, and give a vague notion of what the problem was, but we don't give the user much information about what exactly has gone wrong. For example if there is an unbound symbol we should be able to report exactly which symbol was unbound. This can help the user track down errors, typos, and other trivial problems.</p>

<div class='pull-left alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/eclipses.png" alt="eclipses" class="img-responsive" width="315px" height="246px"/>
  <p><small>Eclipses &bull; Like ellipsis.</small></p>
</div>

<p>Wouldn't it be great if we could write a function that can report errors in a similar way to how <code>printf</code> works. It would be ideal if we could pass in strings, integers, and other data to make our error messages richer.</p>

<p>The <code>printf</code> function is a special function in C because it takes a variable number of arguments. We can create our own <em>variable argument</em> functions, which is what we're going to do to make our error reporting better.</p>

<p>We'll modify <code>lval_err</code> to act in the same way as <code>printf</code>, taking in a format string, and after that a variable number of arguments to match into this string.</p>

<p>To declare that a function takes variable arguments in the type signature you use the special syntax of ellipsis <code>...</code>, which represent the rest of the arguments.</p>

<pre><code data-language='c'>lval* lval_err(char* fmt, ...);</code></pre>

<p>Then, inside the function there are standard library functions we can use to examine what the caller has passed in.</p>

<p>The first step is to create a <code>va_list</code> struct and initialise it with <code>va_start</code>, passing in the last named argument. For other purposes it is possible to examine each argument passed in using <code>va_arg</code>, but we are going to pass our whole variable argument list directly to the <code>vsnprintf</code> function. This function acts like <code>printf</code> but instead writes to a string and takes in a <code>va_list</code>. Once we are done with our variable arguments, we should call <code>va_end</code> to cleanup any resources used.</p>

<p>The <code>vsnprintf</code> function outputs to a string, which we need to allocate first. Because we don't know the size of this string until we've run the function we first allocate a buffer <code>512</code> characters big and then reallocate to a smaller buffer once we've output to it. If an error message is going to be longer than 512 characters it will just get cut off, but hopefully this won't happen.</p>

<p>Putting it all together our new error function looks like this.</p>

<pre><code data-language='c'>lval* lval_err(char* fmt, ...) {
  lval* v = malloc(sizeof(lval));
  v-&gt;type = LVAL_ERR;

  /* Create a va list and initialize it */
  va_list va;
  va_start(va, fmt);

  /* Allocate 512 bytes of space */
  v-&gt;err = malloc(512);

  /* printf the error string with a maximum of 511 characters */
  vsnprintf(v-&gt;err, 511, fmt, va);

  /* Reallocate to number of bytes actually used */
  v-&gt;err = realloc(v-&gt;err, strlen(v-&gt;err)+1);

  /* Cleanup our va list */
  va_end(va);

  return v;
}</code></pre>

<p>Using this we can then start adding in some better error messages to our functions. As an example we can look at <code>lenv_get</code>. When a symbol can't be found, rather than reporting a generic error, we can actually report the name that was not found.</p>

<pre><code data-language='c'>return lval_err("Unbound Symbol '%s'", k-&gt;sym);</code></pre>

<p>We can also adapt our <code>LASSERT</code> macro such that it can take variable arguments too. Because this is a macro and not a standard function the syntax is slightly different. On the left hand side of the definition we use the ellipses notation again, but on the right hand side we use a special variable <code>__VA_ARGS__</code> to paste in the contents of all the other arguments.</p>

<p>We need to prefix this special variable with two hash signs <code>##</code>. This ensures that it is pasted correctly when the macro is passed no extra arguments. In essence what this does is make sure to remove the leading comma <code>,</code> to appear as if no extra arguments were passed in.</p>

<p>Because we might use <code>args</code> in the construction of the error message we need to make sure we don't delete it until we've created the error value.</p>

<pre><code data-language='c'>#define LASSERT(args, cond, fmt, ...) \
  if (!(cond)) { \
    lval* err = lval_err(fmt, ##__VA_ARGS__); \
    lval_del(args); \
    return err; \
  }</code></pre>

<p>Now we can update some of our error messages to make them more informative. For example if the incorrect number of arguments were passed we can specify how many were required and how many were given.</p>

<pre><code data-language='c'>LASSERT(a, a-&gt;count == 1,
  "Function 'head' passed too many arguments. "
  "Got %i, Expected %i.",
  a-&gt;count, 1);</code></pre>

<p>We can also improve our error reporting for type errors. We should attempt to report what type was expected by a function and what type it actually got. Before we can do this it would be useful to have a function that took as input some type enumeration and returned a string representation of that type.</p>

<pre><code data-language='c'>char* ltype_name(int t) {
  switch(t) {
    case LVAL_FUN: return "Function";
    case LVAL_NUM: return "Number";
    case LVAL_ERR: return "Error";
    case LVAL_SYM: return "Symbol";
    case LVAL_SEXPR: return "S-Expression";
    case LVAL_QEXPR: return "Q-Expression";
    default: return "Unknown";
  }
}</code></pre>

<pre><code data-language='c'>LASSERT(a, a-&gt;cell[0]-&gt;type == LVAL_QEXPR,
  "Function 'head' passed incorrect type for argument 0. "
  "Got %s, Expected %s.",
  ltype_name(a-&gt;cell[0]-&gt;type), ltype_name(LVAL_QEXPR));
</code></pre>

<p>Go ahead and use <code>LASSERT</code> to report errors in greater depth throughout the code. This should make debugging many of the next stages much easier as we begin to write complicated code using our new language. See if you can use macros to save on typing and automatically generate code for common methods of error reporting.</p>

<pre><code data-language='lispy'>lispy&gt; + 1 {5 6 7}
Error: Function '+' passed incorrect type for argument 1. Got Q-Expression, Expected Number.
lispy&gt; head {1 2 3} {4 5 6}
Error: Function 'head' passed incorrect number of arguments. Got 2, Expected 1.
lispy&gt;</code></pre>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Create a Macro to aid specifically with reporting type errors.</li>
    <li class="list-group-item">&rsaquo; Create a Macro to aid specifically with reporting argument count errors.</li>
    <li class="list-group-item">&rsaquo; Create a Macro to aid specifically with reporting empty list errors.</li>
    <li class="list-group-item">&rsaquo; Change printing a builtin function so that it prints its name.</li>
    <li class="list-group-item">&rsaquo; Write a function for printing out all the named values in an environment.</li>
    <li class="list-group-item">&rsaquo; Redefine one of the builtin variables to something different.</li>
    <li class="list-group-item">&rsaquo; Change redefinition of one of the builtin variables to something different an error.</li>
    <li class="list-group-item">&rsaquo; Create an <code>exit</code> function for stopping the prompt and exiting.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter10_q_expressions"><h4>&lsaquo; Q-Expressions</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter12_functions"><h4>Functions &rsaquo;</h4></a></td>
  </tr>
</table>