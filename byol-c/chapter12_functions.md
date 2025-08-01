---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter12_functions
---

<h1>Functions <small>&bull; Chapter 12</small></h1>

<h2 id='what_is_a_function'>What is a Function?</h2> <hr/>

<p>Functions are the essence of all programming. In the early days of computer science they represented a naive dream. The idea was that we could reduce computation into these smaller and smaller bits of re-usable code. Given enough time, and a proper structure for libraries, eventually we would have written code required for all computational needs. No longer would people have to write their own functions, and programming would consist of an easy job of stitching together components.</p>

<p>This dream hasn't come true yet, but it persists, no matter how flawed. Each new programming technique or paradigm that comes along shakes up this idea a little. They promise better re-use of code. Better abstractions, and an easier life for all.</p>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/bananas.png" alt="bananas" class="img-responsive" width="369px" height="238px"/>
  <p><small>Bananaphone &bull; Another naive dream.</small></p>
</div>

<p>In reality what each paradigm delivers is simply <em>different</em> abstractions. There has always been a trade-off. For each higher level of thinking about programming, some piece is thrown away. And this means, no matter how well you decide what to keep and what to leave, occasionally someone will need that piece that has been lost. But through all of this, one way or the other, functions have always persisted, and have continually proven to be effective.</p>

<p>We've used functions in C, we know what they <em>look like</em>, but we don't know exactly what they <em>are</em>. Here are a few ways to think about them.</p>

<p>One way to think about functions is as description of some computation you want to be performed later. When you define a function it is like saying "when I use <em>this</em> name I want <em>that</em> sort of thing to happen". This is a very practical idea of a function. It is very intuitive, and metaphorical to language. This is the way you would command a human or animal. Another thing I like about this is that it captures the delayed nature of functions. Functions are defined once, but can be called on repeatedly after.</p>

<p>Another way to think about functions is as a black box that takes some input and produces some output. This idea is subtly different from the former. It is more algebraic, and doesn't talk about <em>computation</em> or <em>commands</em>. This idea is a mathematical concept, and is not tied to some particular machine, or language. In some situations this idea is exceptionally useful. It allows us to think about functions without worrying about their internals, or how they are computed exactly. We can then combine and compose functions together without worry of something subtle going wrong. This is the core idea behind an abstraction, and is what allows layers of complexity to work together with each other rather than conflict. This idea's strength can also be its downfall. Because it does not mention anything about computation it does not deal with a number of real world concerns. <em>"How long will this function take to run?"</em>, <em>"Is this function efficient?"</em>, <em>"Will it modify the state of my program? If so how?"</em>.</p>

<div class='pull-left alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/black_box.png" alt="black_box" class="img-responsive" width="294px" height="293px"/>
  <p><small>Black Box &bull; Your typical function.</small></p>
</div>

<p>A third method is to think of functions as <em>partial computations</em>. Like the Mathematical model they can take some inputs. These values are required before the function can complete the computation. This is why it is called <em>partial</em>. But like the computational model, the body of the function consists of a computation specified in some language of commands. These inputs are called <em>unbound variables</em>, and to finish the computation one simply supplies them. Like fitting a cog into a machine which previously spinning aimlessly, this completes all that is needed for the computation to run, and the machine runs. The output of these <em>partial computations</em> is itself a variable with an unknown value. This output can be placed as input to a new function, and so one function relies on another.</p>

<p>An advantage of this idea over the mathematical model is that we recognize that functions <em>contain computation</em>. We see that when the computation runs, some physical process is going on in the machine. This means we recognise the fact that certain things take time to elapse, or that a function might change the program state, or do anything else we're not sure about.</p>

<p>All these ideas are explored in the study of functions, <em>Lambda calculus</em>. This is a field that combines logic, maths, and computer science. The name comes from the Greek letter Lambda, which is used in the representation of <em>binding variables</em>. Using Lambda calculus gives a way of defining, composing and building <em>functions</em> using a simple mathematical notation.</p>

<p>We are going to use all of the previous ideas to add user defined functions to our language. Lisp is already well suited to this sort of playing around and using these concepts, it won't take much work for us to implement functions.</p>

<p>The first step will be to write a builtin function that can create user defined functions. Here is one idea as to how it can be specified. The first argument could be a list of symbols, just like our <code>def</code> function. These symbols we call the <em>formal arguments</em>, also known as the <em>unbound variables</em>. They act as the inputs to our <em>partial computation</em>. The second argument could be another list. When running the function this is going to be evaluated with our builtin <code>eval</code> function.</p>

<p>This function we'll call just <code>\</code>, (a homage to The Lambda Calculus as the <code>\</code> character looks a little bit like a lambda). To create a function which takes two inputs and adds them together, we would then write something like this.</p>

<pre><code data-language='lispy'>\ {x y} {+ x y}</code></pre>

<p>We can call the function by putting it as the first argument in a normal S-Expression</p>

<pre><code data-language='lispy'>(\ {x y} {+ x y}) 10 20</code></pre>

<p>If we want to name this function we can pass it to our existing builtin <code>def</code> like any other value and store it in the environment.</p>

<pre><code data-language='lispy'>def {add-together} (\ {x y} {+ x y})</code></pre>

<p>Then we can call it by refering to it by name.</p>

<pre><code data-language='lispy'>add-together 10 20</code></pre>


<h2 id='function_type'>Function Type</h2> <hr/>

<p>To store a function as an <code>lval</code> we need to think exactly what it consists of.</p>

<p>Using the previous definition, a function should consists of three parts. First is the list of <em>formal arguments</em>, which we must bind before we can evaluate the function. The second part is a Q-Expression that represents the body of the function. Finally we require a location to store the values assigned to the <em>formal arguments</em>. Luckily we already have a structure for storing variables, an <em>environment</em>.</p>

<p>We will store our builtin functions and user defined functions under the same type <code>LVAL_FUN</code>. This means we need a way internally to differentiate between them. To do this we can check if the <code>lbuiltin</code> function pointer is <code>NULL</code> or not. If it is not <code>NULL</code> we know the <code>lval</code> is some builtin function, otherwise we know it is a user function.</p>

<pre><code data-language='c'>struct lval {
  int type;

  /* Basic */
  long num;
  char* err;
  char* sym;

  /* Function */
  lbuiltin builtin;
  lenv* env;
  lval* formals;
  lval* body;

  /* Expression */
  int count;
  lval** cell;
};</code></pre>

<p>We've renamed the <code>lbuiltin</code> field from <code>fun</code> to <code>builtin</code>. We should make sure to change this in all the places it is used in our code.</p>

<p>We also need to create a constructor for user defined <code>lval</code> functions. Here we build a new environment for the function, and assign the <code>formals</code> and <code>body</code> values to those passed in. </p>

<pre><code data-language='c'>lval* lval_lambda(lval* formals, lval* body) {
  lval* v = malloc(sizeof(lval));
  v-&gt;type = LVAL_FUN;

  /* Set Builtin to Null */
  v-&gt;builtin = NULL;

  /* Build new environment */
  v-&gt;env = lenv_new();

  /* Set Formals and Body */
  v-&gt;formals = formals;
  v-&gt;body = body;
  return v;
}</code></pre>

<p>As with whenever we change our <code>lval</code> type we need to update the functions for <em>deletion</em>, <em>copying</em>, and <em>printing</em> to deal with the changes. For evaluation we'll need to look in greater depth.</p>

<p>For <strong>Deletion</strong>...</p>

<pre><code data-language='c'>case LVAL_FUN:
  if (!v-&gt;builtin) {
    lenv_del(v-&gt;env);
    lval_del(v-&gt;formals);
    lval_del(v-&gt;body);
  }
break;</code></pre>

<p>For <strong>Copying</strong>...</p>

<pre><code data-language='c'>case LVAL_FUN:
  if (v-&gt;builtin) {
    x-&gt;builtin = v-&gt;builtin;
  } else {
    x-&gt;builtin = NULL;
    x-&gt;env = lenv_copy(v-&gt;env);
    x-&gt;formals = lval_copy(v-&gt;formals);
    x-&gt;body = lval_copy(v-&gt;body);
  }
break;</code></pre>

<p>For <strong>Printing</strong>...</p>

<pre><code data-language='c'>case LVAL_FUN:
  if (v-&gt;builtin) {
    printf("&lt;builtin&gt;");
  } else {
    printf("(\\ "); lval_print(v-&gt;formals);
    putchar(' '); lval_print(v-&gt;body); putchar(')');
  }
break;</code></pre>


<h2 id='lambda_function'>Lambda Function</h2> <hr/>

<p>We can now add a builtin for our lambda function. We want it to take as input some list of symbols, and a list that represents the code. After that it should return a function <code>lval</code>. We've defined a few of builtins now, and this one will follow the same format. Like in <code>def</code> we do some error checking to ensure the argument types and count are correct (using some newly defined Macros). Then we just pop the first two arguments from the list and pass them to our previously defined function <code>lval_lambda</code>.</p>

<pre><code data-language='c'>lval* builtin_lambda(lenv* e, lval* a) {
  /* Check Two arguments, each of which are Q-Expressions */
  LASSERT_NUM("\\", a, 2);
  LASSERT_TYPE("\\", a, 0, LVAL_QEXPR);
  LASSERT_TYPE("\\", a, 1, LVAL_QEXPR);

  /* Check first Q-Expression contains only Symbols */
  for (int i = 0; i &lt; a-&gt;cell[0]-&gt;count; i++) {
    LASSERT(a, (a-&gt;cell[0]-&gt;cell[i]-&gt;type == LVAL_SYM),
      "Cannot define non-symbol. Got %s, Expected %s.",
      ltype_name(a-&gt;cell[0]-&gt;cell[i]-&gt;type),ltype_name(LVAL_SYM));
  }

  /* Pop first two arguments and pass them to lval_lambda */
  lval* formals = lval_pop(a, 0);
  lval* body = lval_pop(a, 0);
  lval_del(a);

  return lval_lambda(formals, body);
}</code></pre>

<div class="alert alert-warning">
  <p><strong>Where did <code>LASSERT_NUM</code> and <code>LASSERT_TYPE</code> come from?</strong></p>

  <p>I took the liberty of improving the error reporting macros for this chapter. This task was suggested in the bonus marks of the previous chapter. It makes the code so much cleaner that it was hard to ignore!</p>

  <p>If you were planning on completing this task yourself, now might be a good time to do it. Otherwise you can look at the reference code for this chapter to see what approach I took, and integrate that into your code.</p>
</div>

<p>Let's register this with the other builtins.</p>

<pre><code data-language='c'>lenv_add_builtin(e, "\\", builtin_lambda);</code></pre>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/playgroup.png" alt="playgroup" class="img-responsive" width="274px" height="321px"/>
  <p><small>Playgroup &bull; Your typical parent environment.</small></p>
</div>


<h2 id='parent_environment'>Parent Environment</h2> <hr/>

<p>We've given functions their own environment. In this environment we will place the values that their formal arguments are set to. When we come to evaluate the body of the function we can do it in this  environment and know that those variables will have the correct values.</p>

<p>But ideally we also want these functions to be able to access variables which are in the global environment, such as our builtin functions.</p>

<p>We can solve this problem by changing the definition of our environment to contain a reference to some <em>parent</em> environment. Then, when we want to evaluate a function, we can set this <em>parent</em> environment to our global environment, which has all of our builtins defined within.</p>

<p>When we add this to our <code>lenv</code> struct, conceptually it will be a <em>reference</em> to a parent environment, not some sub-environment or anything like that. Because of this we shouldn't <em>delete</em> it when our <code>lenv</code> gets deleted, or copy it when our <code>lenv</code> gets copied.</p>

<p>The way the <em>parent environment</em> works is simple. If someone calls <code>lenv_get</code> on the environment, and the symbol cannot be found. It will look then in any parent environment to see if the named value exists there, and repeat the process till either the variable is found or there are no more parents. To signify that an environment has no parent we set the reference to <code>NULL</code>.</p>

<p>The constructor function only require basic changes to allow for this.</p>

<pre><code data-language='c'>struct lenv {
  lenv* par;
  int count;
  char** syms;
  lval** vals;
};

lenv* lenv_new(void) {
  lenv* e = malloc(sizeof(lenv));
  e-&gt;par = NULL;
  e-&gt;count = 0;
  e-&gt;syms = NULL;
  e-&gt;vals = NULL;
  return e;
}
</code></pre>

<p>To get a value from an environment we need to add in the search of the parent environment in the case that a symbol is not found.</p>

<pre><code data-language='c'>lval* lenv_get(lenv* e, lval* k) {

  for (int i = 0; i &lt; e-&gt;count; i++) {
    if (strcmp(e-&gt;syms[i], k-&gt;sym) == 0) {
      return lval_copy(e-&gt;vals[i]);
    }
  }

  /* If no symbol check in parent otherwise error */
  if (e-&gt;par) {
    return lenv_get(e-&gt;par, k);
  } else {
    return lval_err("Unbound Symbol '%s'", k-&gt;sym);
  }
}</code></pre>

<p>Because we have a new <code>lval</code> type that has its own environment we need a function for copying environments, to use for when we copy <code>lval</code> structs.</p>

<pre><code data-language='c'>lenv* lenv_copy(lenv* e) {
  lenv* n = malloc(sizeof(lenv));
  n-&gt;par = e-&gt;par;
  n-&gt;count = e-&gt;count;
  n-&gt;syms = malloc(sizeof(char*) * n-&gt;count);
  n-&gt;vals = malloc(sizeof(lval*) * n-&gt;count);
  for (int i = 0; i &lt; e-&gt;count; i++) {
    n-&gt;syms[i] = malloc(strlen(e-&gt;syms[i]) + 1);
    strcpy(n-&gt;syms[i], e-&gt;syms[i]);
    n-&gt;vals[i] = lval_copy(e-&gt;vals[i]);
  }
  return n;
}</code></pre>

<p>Having parent environments also changes our concept of <em>defining</em> a variable.</p>

<p>There are two ways we could define a variable now. Either we could define it in the local, innermost environment, or we could define it in the global, outermost environment. We will add functions to do both. We'll leave the <code>lenv_put</code> method the same. It can be used for definition in the local environment. But we'll add a new function <code>lenv_def</code> for definition in the global environment. This works by simply following the parent chain up before using <code>lenv_put</code> to define locally.</p>

<pre><code data-language='c'>void lenv_def(lenv* e, lval* k, lval* v) {
  /* Iterate till e has no parent */
  while (e-&gt;par) { e = e-&gt;par; }
  /* Put value in e */
  lenv_put(e, k, v);
}</code></pre>

<p>At the moment this distinction may seem useless, but later on we will use it to write partial results of calculations to local variables inside a function. We should add another builtin for <em>local</em> assignment. We'll call this <code>put</code> in C, but give it the <code>=</code> symbol in Lisp. We can adapt our <code>builtin_def</code> function and re-use the common code, just like we do with our mathematical operators.</p>

<p>Then we need to register these as a builtins.</p>

<pre><code data-language='c'>lenv_add_builtin(e, "def", builtin_def);
lenv_add_builtin(e, "=",   builtin_put);</code></pre>

<pre><code data-language='c'>lval* builtin_def(lenv* e, lval* a) {
  return builtin_var(e, a, "def");
}
</code></pre>

<pre><code data-language='c'>lval* builtin_put(lenv* e, lval* a) {
  return builtin_var(e, a, "=");
}</code></pre>

<pre><code data-language='c'>lval* builtin_var(lenv* e, lval* a, char* func) {
  LASSERT_TYPE(func, a, 0, LVAL_QEXPR);

  lval* syms = a-&gt;cell[0];
  for (int i = 0; i &lt; syms->count; i++) {
    LASSERT(a, (syms-&gt;cell[i]-&gt;type == LVAL_SYM),
      "Function '%s' cannot define non-symbol. "
      "Got %s, Expected %s.", func,
      ltype_name(syms-&gt;cell[i]-&gt;type),
      ltype_name(LVAL_SYM));
  }

  LASSERT(a, (syms-&gt;count == a-&gt;count-1),
    "Function '%s' passed too many arguments for symbols. "
    "Got %i, Expected %i.", func, syms-&gt;count, a-&gt;count-1);

  for (int i = 0; i &lt; syms-&gt;count; i++) {
    /* If 'def' define in globally. If 'put' define in locally */
    if (strcmp(func, "def") == 0) {
      lenv_def(e, syms-&gt;cell[i], a-&gt;cell[i+1]);
    }

    if (strcmp(func, "=")   == 0) {
      lenv_put(e, syms-&gt;cell[i], a-&gt;cell[i+1]);
    }
  }

  lval_del(a);
  return lval_sexpr();
}
</code></pre>


<h2 id='function_calling'>Function Calling</h2> <hr/>

<p>We need to write the code that runs when an expression gets evaluated and a function <code>lval</code> is called.</p>

<p>When this function type is a builtin we can call it as before, using the function pointer, but we need to do something separate for our user defined functions. We need to bind each of the arguments passed in, to each of the symbols in the <code>formals</code> field. Once this is done we need to evaluate the <code>body</code> field, using the <code>env</code> field as an environment, and the calling environment as a parent.</p>

<p>A first attempt, without error checking, might look like this:</p>

<pre><code data-language='c'>lval* lval_call(lenv* e, lval* f, lval* a) {

  /* If Builtin then simply call that */
  if (f-&gt;builtin) { return f-&gt;builtin(e, a); }

  /* Assign each argument to each formal in order */
  for (int i = 0; i &lt; a-&gt;count; i++) {
      lenv_put(f-&gt;env, f-&gt;formals-&gt;cell[i], a-&gt;cell[i]);
  }

  lval_del(a);

  /* Set the parent environment */
  f-&gt;env-&gt;par = e;

  /* Evaluate the body */
  return builtin_eval(f-&gt;env,
    lval_add(lval_sexpr(), lval_copy(f-&gt;body)));
}</code></pre>

<p>But this doesn't act correctly when the number of arguments supplied, and the number of formal arguments differ. In this situation it will crash.</p>

<p>Actually this is an interesting case, and leaves us a couple of options. We <em>could</em> just throw an error when the argument count supplied is incorrect, but we can do something that is more fun. When too few arguments are supplied we could instead bind the first few formal arguments of the function and then return it, leaving the rest unbound.</p>

<p>This creates a function that has been <em>partially evaluated</em> and reflects our previous idea of a function being some kind of <em>partial computation</em>. If we start with a function that takes two arguments, and pass in a single argument, we can bind this first argument and return a new function with its first formal argument bound, and its second remaining empty.</p>

<p>This metaphor creates a cute image of how functions work. We can imagine a function at the front of an expression, repeatedly consuming inputs directly to its right. After consuming the first input to its right, if it is full (requires no more inputs), it evaluates and replaces itself with some new value. If instead, it is still it still requires more, it replaces itself with another, more complete function, with one of its variables bound. This process repeats until the final value for the program is created.</p>

<p>So you can imagine functions like a little Pac-Man, not consuming all inputs at once, but iteratively eating inputs to the right, getting bigger and bigger until it is full and explodes to create something new. This isn't actually how we're going to implement it in code, but it is still fun to imagine.</p>

<pre><code data-language='c'>lval* lval_call(lenv* e, lval* f, lval* a) {

  /* If Builtin then simply apply that */
  if (f-&gt;builtin) { return f-&gt;builtin(e, a); }

  /* Record Argument Counts */
  int given = a-&gt;count;
  int total = f-&gt;formals-&gt;count;

  /* While arguments still remain to be processed */
  while (a-&gt;count) {

    /* If we've ran out of formal arguments to bind */
    if (f-&gt;formals-&gt;count == 0) {
      lval_del(a); return lval_err(
        "Function passed too many arguments. "
        "Got %i, Expected %i.", given, total);
    }

    /* Pop the first symbol from the formals */
    lval* sym = lval_pop(f-&gt;formals, 0);

    /* Pop the next argument from the list */
    lval* val = lval_pop(a, 0);

    /* Bind a copy into the function's environment */
    lenv_put(f-&gt;env, sym, val);

    /* Delete symbol and value */
    lval_del(sym); lval_del(val);
  }

  /* Argument list is now bound so can be cleaned up */
  lval_del(a);

  /* If all formals have been bound evaluate */
  if (f-&gt;formals-&gt;count == 0) {

    /* Set environment parent to evaluation environment */
    f-&gt;env-&gt;par = e;

    /* Evaluate and return */
    return builtin_eval(
      f-&gt;env, lval_add(lval_sexpr(), lval_copy(f-&gt;body)));
  } else {
    /* Otherwise return partially evaluated function */
    return lval_copy(f);
  }

}</code></pre>

<p>The above function does exactly as we explained, with correct error handling added in too. First it iterates over the passed in arguments attempting to place each one in the environment. Then it checks if the environment is full, and if so evaluates, otherwise returns a copy of itself with some arguments filled.</p>

<p>If we update our evaluation function <code>lval_eval_sexpr</code> to call <code>lval_call</code>, we can give our new system a spin.</p>

<pre><code data-language='c'>lval* f = lval_pop(v, 0);
if (f->type != LVAL_FUN) {
  lval* err = lval_err(
    "S-Expression starts with incorrect type. "
    "Got %s, Expected %s.",
    ltype_name(f->type), ltype_name(LVAL_FUN));
  lval_del(f); lval_del(v);
  return err;
}

lval* result = lval_call(e, f, v);
</code></pre>

<p>Try defining some functions and test out how partial evaluation works.</p>

<pre><code data-language='lispy'>lispy&gt; def {add-mul} (\ {x y} {+ x (* x y)})
()
lispy&gt; add-mul 10 20
210
lispy&gt; add-mul 10
(\ {y} {+ x (* x y)})
lispy&gt; def {add-mul-ten} (add-mul 10)
()
lispy&gt; add-mul-ten 50
510
lispy&gt;
</code></pre>

<h2 id='variable_arguments'>Variable Arguments</h2> <hr/>

<p>We've defined some of our builtin functions so they can take in a variable number of arguments. Functions like <code>+</code> and <code>join</code> can take any number of arguments, and operate on them logically. We should find a way to let user defined functions work on multiple arguments also.</p>

<p>Unfortunately there isn't an elegant way for us to allow for this, without adding in some special syntax. So we're going to hard-code some system into our language using a special symbol <code>&amp;</code>.</p>

<p>We are going to let users define formal arguments that look like <code>{x &amp; xs}</code>, which means that a function will take in a single argument <code>x</code>, followed by zero or more other arguments, joined together into a list called <code>xs</code>. This is a bit like the ellipsis we used to declare variable arguments in C.</p>

<p>When assigning our formal arguments we're going to look for a <code>&amp;</code> symbol and if it exists take the next formal argument and assign it any remaining supplied arguments we've been passed. It's important we convert this argument list to a Q-Expression. We need to also remember to check that <code>&amp;</code> is followed by a real symbol, and if it isn't we should throw an error.</p>

<p>Just after the first symbol is popped from the formals in the <code>while</code> loop of <code>lval_call</code> we can add this special case.</p>

<pre><code data-language='c'>/* Special Case to deal with '&amp;' */
if (strcmp(sym-&gt;sym, "&amp;") == 0) {

  /* Ensure '&amp;' is followed by another symbol */
  if (f-&gt;formals-&gt;count != 1) {
    lval_del(a);
    return lval_err("Function format invalid. "
      "Symbol '&amp;' not followed by single symbol.");
  }

  /* Next formal should be bound to remaining arguments */
  lval* nsym = lval_pop(f-&gt;formals, 0);
  lenv_put(f-&gt;env, nsym, builtin_list(e, a));
  lval_del(sym); lval_del(nsym);
  break;
}</code></pre>

<p>Suppose when calling the function the user doesn't supply any variable arguments, but only the first named ones. In this case we need to set the symbol following <code>&amp;</code> to the empty list. Just after we delete the argument list, and before we check to see if all the formals have been evaluated, add in this special case.</p>

<pre><code data-language='c'>/* If '&amp;' remains in formal list bind to empty list */
if (f-&gt;formals-&gt;count &gt; 0 &amp;&amp;
  strcmp(f-&gt;formals-&gt;cell[0]-&gt;sym, "&amp;") == 0) {

  /* Check to ensure that &amp; is not passed invalidly. */
  if (f-&gt;formals-&gt;count != 2) {
    return lval_err("Function format invalid. "
      "Symbol '&amp;' not followed by single symbol.");
  }

  /* Pop and delete '&amp;' symbol */
  lval_del(lval_pop(f-&gt;formals, 0));

  /* Pop next symbol and create empty list */
  lval* sym = lval_pop(f-&gt;formals, 0);
  lval* val = lval_qexpr();

  /* Bind to environment and delete */
  lenv_put(f-&gt;env, sym, val);
  lval_del(sym); lval_del(val);
}</code></pre>


<h2 id='interesting_functions'>Interesting Functions</h2> <hr/>

<h3>Function Definition</h3>

<p>Lambdas are clearly a simple and powerful way of defining functions. But the syntax is a little clumsy. There are a lot of brackets and symbols involved. Here is an interesting idea. We can try to write a function that defines a function itself, using some simpler syntax.</p>

<p>Essentially what we want is a function that can perform two steps at once. First it should create a new function, and then it should define it to some name. Here is the trick. We let the user supply the name and the formal arguments altogether in one list, and then separate these out for them, and use them in the definition. Here is a function that does that. It takes as input some arguments and some body. It takes the head of the arguments to be the function name and the rest to be the formal arguments. It passes the body directly to a lambda.</p>

<pre><code data-language='lispy'>\ {args body} {def (head args) (\ (tail args) body)}</code></pre>

<p>We can name this function something like <code>fun</code> by passing it to <code>def</code> as usual.</p>

<pre><code data-language='lispy'>def {fun} (\ {args body} {def (head args) (\ (tail args) body)})</code></pre>

<p>This means that we can now define functions in a much simpler and nicer way. To define our previously mentioned <code>add-together</code> we can do the following. Functions that can define functions. That is certainly something we could never do in C. How cool is that!</p>

<pre><code data-language='lispy'>fun {add-together x y} {+ x y}</code></pre>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/curry.png" alt="curry" class="img-responsive" width="371px" height="236px"/>
  <p><small>Currying &bull; Not as good as it sounds.</small></p>
</div>

<h3>Currying</h3>

<p>At the moment functions like <code>+</code> take a variable number of arguments. In some situations that's great, but what if we had a list of arguments we wished to pass to it. In this situation it is rendered somewhat useless.</p>

<p>Again we can try to create a function to solve this problem. If we can create a list in the format we wish to use for our expression we can use <code>eval</code> to treat it as such. In the situation of <code>+</code> we could append this function to the front of the list and then perform the evaluation.</p>

<p>We can define a function <code>unpack</code> that does this. It takes as input some function and some list and appends the function to the front of the list, before evaluating it.</p>

<pre><code data-language='lispy'>fun {unpack f xs} {eval (join (list f) xs)}</code></pre>

<p>In some situations we might be faced with the opposite dilemma. We may have a function that takes as input some list, but we wish to call it using variable arguments. In this case the solution is even simpler. We use the fact that our <code>&amp;</code> syntax for variable arguments packs up variable arguments into a list for us.</p>

<pre><code data-language='lispy'>fun {pack f &amp; xs} {f xs}</code></pre>

<p>In some languages this is called <em>currying</em> and <em>uncurrying</em> respectively. This is named after <em>Haskell Curry</em> and unfortunately has nothing to do with our favourite spicy food.</p>

<pre><code data-language='lispy'>lispy&gt; def {uncurry} pack
()
lispy&gt; def {curry} unpack
()
lispy&gt; curry + {5 6 7}
18
lispy&gt; uncurry head 5 6 7
{5}
</code></pre>

<p>Because of the way our <em>partial evaluation</em> works we don't need to think of <em>currying</em> with a specific set of arguments. We can think of functions themselves being in <em>curried</em> or <em>uncurried</em> form.</p>

<pre><code data-language='lispy'>lispy&gt; def {add-uncurried} +
()
lispy&gt; def {add-curried} (curry +)
()
lispy&gt; add-curried {5 6 7}
18
lispy&gt; add-uncurried 5 6 7
18
</code></pre>

<p>Have a play around and see what other interesting and powerful functions you can try to come up with. In the next chapter we'll add conditionals which will really start to make our language more complete. But that doesn't mean you won't be able to come up with some other interesting ideas. Our Lisp is getting richer.</p>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Define a Lisp function that returns the first element from a list.</li>
    <li class="list-group-item">&rsaquo; Define a Lisp function that returns the second element from a list.</li>
    <li class="list-group-item">&rsaquo; Define a Lisp function that calls a function with two arguments in reverse order.</li>
    <li class="list-group-item">&rsaquo; Define a Lisp function that calls a function with arguments, then passes the result to another function.</li>
    <li class="list-group-item">&rsaquo; Define a <code>builtin_fun</code> C function that is equivalent to the Lisp <code>fun</code> function.</li>
    <li class="list-group-item">&rsaquo; Change variable arguments so at least one extra argument must be supplied before it is evaluated.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter11_variables"><h4>&lsaquo; Variables</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter13_conditionals"><h4>Conditionals &rsaquo;</h4></a></td>
  </tr>
</table>