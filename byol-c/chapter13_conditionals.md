---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter13_conditionals
---

<h1>Conditionals <small>&bull; Chapter 13</small></h1>

<h2 id='doing_it_yourself'>Doing it yourself</h2> <hr/>

<p>We've come quite far now. Your knowledge of C should be good enough for you to stand on your own feet a little more. If you're feeling confident, this chapter is a perfect opportunity to stretch your wings out and attempt something on your own. It is a fairly short chapter and essentially consists of adding a couple of new builtin functions to deal with comparison and ordering.</p>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/pug.png" alt="pug" class="img-responsive" width="219px" height="329px"/>
  <p><small>Pug &bull; <strong>if</strong> pug is asleep <strong>then</strong> pug is cute.</small></p>
</div>

<p>If you're feeling positive, go ahead and try to implement comparison and ordering into your language now. Define some new builtin functions for <em>greater than</em>, <em>less than</em>, <em>equal to</em>, and all the other comparison operators we use in C. Try to define an <code>if</code> function that tests for some condition and then either evaluate some code, or some other code, depending on the result. Once you've finished come back and compare your work to mine. Observe the differences and decide which parts you prefer.</p>

<p>If you still feel uncertain don't worry. Follow along and I'll explain my approach.</p>


<h2 id='ordering'>Ordering</h2> <hr/>

<p>For simplicity's sake I'm going to re-use our number data type to represent the result of comparisons. I'll make a rule similar to C, to say that any number that isn't <code>0</code> evaluates to true in an <code>if</code> statement, while <code>0</code> always evaluates to false.</p>

<p>Therefore our ordering functions are a little like a simplified version of our arithmetic functions. They'll only work on numbers, and we only want them to work on two arguments.</p>

<p>If these error conditions are met the maths is simple. We want to return a number <code>lval</code> either <code>0</code> or <code>1</code> depending on the equality comparison between the two input <code>lval</code>. We can use C's comparison operators to do this. Like our arithmetic functions we'll make use of a single function to do all of the comparisons.</p>

<p>First we check the error conditions, then we compare the numbers in each of the arguments to get some result. Finally we return this result as a number value.</p>

<pre><code data-language='c'>lval* builtin_gt(lenv* e, lval* a) {
  return builtin_ord(e, a, "&gt;");
}
</code></pre>

<pre><code data-language='c'>lval* builtin_lt(lenv* e, lval* a) {
  return builtin_ord(e, a, "&lt;");
}
</code></pre>

<pre><code data-language='c'>lval* builtin_ge(lenv* e, lval* a) {
  return builtin_ord(e, a, "&gt;=");
}
</code></pre>

<pre><code data-language='c'>lval* builtin_le(lenv* e, lval* a) {
  return builtin_ord(e, a, "&lt;=");
}
</code></pre>

<pre><code data-language='c'>lval* builtin_ord(lenv* e, lval* a, char* op) {
  LASSERT_NUM(op, a, 2);
  LASSERT_TYPE(op, a, 0, LVAL_NUM);
  LASSERT_TYPE(op, a, 1, LVAL_NUM);

  int r;
  if (strcmp(op, "&gt;")  == 0) {
    r = (a-&gt;cell[0]-&gt;num &gt;  a-&gt;cell[1]-&gt;num);
  }
  if (strcmp(op, "&lt;")  == 0) {
    r = (a-&gt;cell[0]-&gt;num &lt;  a-&gt;cell[1]-&gt;num);
  }
  if (strcmp(op, "&gt;=") == 0) {
    r = (a-&gt;cell[0]-&gt;num &gt;= a-&gt;cell[1]-&gt;num);
  }
  if (strcmp(op, "&lt;=") == 0) {
    r = (a-&gt;cell[0]-&gt;num &lt;= a-&gt;cell[1]-&gt;num);
  }
  lval_del(a);
  return lval_num(r);
}
</code></pre>


<h2 id='equality'>Equality</h2> <hr/>

<p>Equality is going to be different to ordering because we want it to work on more than number types. It will be useful to see if an input is equal to an empty list, or to see if two functions passed in are the same. Therefore we need to define a function which can test for equality between two different types of <code>lval</code>.</p>

<p>This function essentially checks that all the fields which make up the data for a particular <code>lval</code> type are equal. If all the fields are equal, the whole thing is considered equal. Otherwise if there are any differences the whole thing is considered unequal.</p>

<pre><code data-language='c'>int lval_eq(lval* x, lval* y) {

  /* Different Types are always unequal */
  if (x-&gt;type != y-&gt;type) { return 0; }

  /* Compare Based upon type */
  switch (x-&gt;type) {
    /* Compare Number Value */
    case LVAL_NUM: return (x-&gt;num == y-&gt;num);

    /* Compare String Values */
    case LVAL_ERR: return (strcmp(x-&gt;err, y-&gt;err) == 0);
    case LVAL_SYM: return (strcmp(x-&gt;sym, y-&gt;sym) == 0);

    /* If builtin compare, otherwise compare formals and body */
    case LVAL_FUN:
      if (x-&gt;builtin || y-&gt;builtin) {
        return x-&gt;builtin == y-&gt;builtin;
      } else {
        return lval_eq(x-&gt;formals, y-&gt;formals)
          &amp;&amp; lval_eq(x-&gt;body, y-&gt;body);
      }

    /* If list compare every individual element */
    case LVAL_QEXPR:
    case LVAL_SEXPR:
      if (x-&gt;count != y-&gt;count) { return 0; }
      for (int i = 0; i &lt; x-&gt;count; i++) {
        /* If any element not equal then whole list not equal */
        if (!lval_eq(x-&gt;cell[i], y-&gt;cell[i])) { return 0; }
      }
      /* Otherwise lists must be equal */
      return 1;
    break;
  }
  return 0;
}</code></pre>

<p>Using this function the new builtin function for equality comparison is very simple to add. We simply ensure two arguments are input, and that they are equal. We store the result of the comparison into a new <code>lval</code> and return it.</p>

<pre><code data-language='c'>lval* builtin_cmp(lenv* e, lval* a, char* op) {
  LASSERT_NUM(op, a, 2);
  int r;
  if (strcmp(op, "==") == 0) {
    r =  lval_eq(a-&gt;cell[0], a-&gt;cell[1]);
  }
  if (strcmp(op, "!=") == 0) {
    r = !lval_eq(a-&gt;cell[0], a-&gt;cell[1]);
  }
  lval_del(a);
  return lval_num(r);
}

lval* builtin_eq(lenv* e, lval* a) {
  return builtin_cmp(e, a, "==");
}

lval* builtin_ne(lenv* e, lval* a) {
  return builtin_cmp(e, a, "!=");
}</code></pre>


<h2 id='if_function'>If Function</h2> <hr/>

<p>To make our comparison operators useful we'll need an <code>if</code> function. This function is a little like the ternary operation in C. Upon some condition being true it evaluates to one thing, and if the condition is false, it evaluates to another.</p>

<p>We can again make use of Q-Expressions to encode a computation. First we get the user to pass in the result of a comparison, then we get the user to pass in two Q-Expressions representing the code to be evaluated upon a condition being either true or false.</p>

<pre><code data-language='c'>lval* builtin_if(lenv* e, lval* a) {
  LASSERT_NUM("if", a, 3);
  LASSERT_TYPE("if", a, 0, LVAL_NUM);
  LASSERT_TYPE("if", a, 1, LVAL_QEXPR);
  LASSERT_TYPE("if", a, 2, LVAL_QEXPR);

  /* Mark Both Expressions as evaluable */
  lval* x;
  a-&gt;cell[1]-&gt;type = LVAL_SEXPR;
  a-&gt;cell[2]-&gt;type = LVAL_SEXPR;

  if (a-&gt;cell[0]-&gt;num) {
    /* If condition is true evaluate first expression */
    x = lval_eval(e, lval_pop(a, 1));
  } else {
    /* Otherwise evaluate second expression */
    x = lval_eval(e, lval_pop(a, 2));
  }

  /* Delete argument list and return */
  lval_del(a);
  return x;
}</code></pre>

<p>All that remains is for us to register all of these new builtins and we are again ready to go.</p>

<pre><code data-language='c'>/* Comparison Functions */
lenv_add_builtin(e, "if", builtin_if);
lenv_add_builtin(e, "==", builtin_eq);
lenv_add_builtin(e, "!=", builtin_ne);
lenv_add_builtin(e, "&gt;",  builtin_gt);
lenv_add_builtin(e, "&lt;",  builtin_lt);
lenv_add_builtin(e, "&gt;=", builtin_ge);
lenv_add_builtin(e, "&lt;=", builtin_le);
</code></pre>

<p>Have a quick mess around to check that everything is working correctly.</p>

<pre><code data-language='lispy'>lispy&gt; &gt; 10 5
1
lispy&gt; &lt;= 88 5
0
lispy&gt; == 5 6
0
lispy&gt; == 5 {}
0
lispy&gt; == 1 1
1
lispy&gt; != {} 56
1
lispy&gt; == {1 2 3 {5 6}} {1   2  3   {5 6}}
1
lispy&gt; def {x y} 100 200
()
lispy&gt; if (== x y) {+ x y} {- x y}
-100
</code></pre>


<h2 id='recursive_functions'>Recursive Functions</h2> <hr/>

<p>By introducing conditionals we've actually made our language a lot more powerful. This is because they effectively let us implement recursive functions.</p>

<p>Recursive functions are those which call themselves. We've used these already in C to perform reading in and evaluation of expressions. The reason we require conditionals for these is because they let us test for the situation where we wish to terminate the recursion.</p>

<p>For example we can use conditionals to implement a function <code>len</code> which tells us the number of items in a list. If we encounter the empty list we just return <code>0</code>. Otherwise we return the length of the <code>tail</code> of the input list, plus <code>1</code>. Think about why this works. It repeatedly uses the <code>len</code> function until it reaches the empty list. At this point it returns <code>0</code> and adds all the other partial results together.</p>

<pre><code data-language='lispy'>(fun {len l} {
  if (== l {})
    {0}
    {+ 1 (len (tail l))}
})</code></pre>

<p>Just as in C, there is a pleasant symmetry to this sort of recursive function. First we do something for the empty list (<em>the base case</em>). Then if we get something bigger, we take off a chunk such as the head of the list, and do something to it, before combining it with the rest of the thing to which the function has been already applied.</p>

<p>Here is another function for reversing a list. As before it checks for the empty list, but this time it returns the empty list back. This makes sense. The reverse of the empty list is just the empty list. But if it gets something bigger than the empty list, it reverses the tail, and sticks this in front of the head.</p>

<pre><code data-language='lispy'>(fun {reverse l} {
  if (== l {})
    {{}}
    {join (reverse (tail l)) (head l)}
})</code></pre>

<p>We're going to use this technique to build many functions. This is because it is going to be the primary way to achieve looping in our language.</p>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Create builtin logical operators <em>or</em> <code>||</code>, <em>and</em> <code>&&</code> and <em>not</em> <code>!</code> and add them to the language.</li>
    <li class="list-group-item">&rsaquo; Define a recursive Lisp function that returns the <code>nth</code> item of that list.</li>
    <li class="list-group-item">&rsaquo; Define a recursive Lisp function that returns <code>1</code> if an element is a member of a list, otherwise <code>0</code>.</li>
    <li class="list-group-item">&rsaquo; Define a Lisp function that returns the last element of a list.</li>
    <li class="list-group-item">&rsaquo; Define in Lisp logical operator functions such as <code>or</code>, <code>and</code> and <code>not</code>.</li>
    <li class="list-group-item">&rsaquo; Add a specific boolean type to the language with the builtin variables <code>true</code> and <code>false</code>.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter12_functions"><h4>&lsaquo; Functions</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter14_strings"><h4>Strings &rsaquo;</h4></a></td>
  </tr>
</table>