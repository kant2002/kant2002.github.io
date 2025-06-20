---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter8_error_handling/
---

<h1>Error Handling <small>&bull; Chapter 8</small></h1>


<h2 id='crashes'>Crashes</h2> <hr/>

<p>Some of you may have noticed a problem with the previous chapter's program. Try entering this into the prompt and see what happens.</p>

<pre><code data-language='lispy'>Lispy Version 0.0.0.0.3
Press Ctrl+c to Exit

lispy&gt; / 10 0</code></pre>

<p>Ouch. The program crashed upon trying to divide by zero. It's okay if a program crashes during development, but our final program would hopefully never crash, and should always explain to the user what went wrong.</p>

<div class='pull-left alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/walterwhite.png" alt="walterwhite" class="img-responsive" width="166px" height="219px"/>
  <p><small>Walter White &bull; Heisenberg</small></p>
</div>

<p>At the moment our program can produce syntax errors but it still has no functionality for reporting errors in the evaluation of expressions. We need to build in some kind of error handling functionality to do this. It can be awkward in C, but if we start off on the right track, it will pay off later on when our system gets more complicated.</p>

<p>C programs crashing is a fact of life. If anything goes wrong the operating system kicks them out. Programs can crash for many different reasons, and in many different ways. You will see at least one <a href="http://en.wikipedia.org/wiki/Heisenbug">Heisenbug</a>.</p>

<p>But there is no magic in how C programs work. If you face a really troublesome bug don't give up or sit and stare at the screen till your eyes bleed. Take this chance to properly learn how to use <code>gdb</code> and <code>valgrind</code>. These will be more weapons in your tool-kit, and after the initial investment, save you a lot of time and pain.</p>

<h2 id='lisp_value'>Lisp Value</h2> <hr/>

<p>There are several ways to deal with errors in C, but in this context my preferred method is to make errors a possible result of evaluating an expression. Then we can say that, in Lispy, an expression will evaluate to <em>either</em> a <em>number</em>, or an <em>error</em>. For example <code>+ 1 2</code> will evaluate to a number, but <code>/ 10 0</code> will evaluate to an error.</p>

<p>For this we need a data structure that can act as either one thing or anything. For simplicity sake we are just going to use a <code>struct</code> with fields specific to each thing that can be represented, and a special field <code>type</code> to tell us exactly what fields are meaningful to access.</p>

<p>This we are going to call an <code>lval</code>, which stands for <em>Lisp Value</em>.</p>

<pre><code data-language='c'>/* Declare New lval Struct */
typedef struct {
  int type;
  long num;
  int err;
} lval;</code></pre>


<h2 id='enumerations'>Enumerations</h2> <hr/>

<p>You'll notice the type of the fields <code>type</code>, and <code>err</code>, is <code>int</code>. This means they are represented by a single integer number.</p>

<p>The reason we pick <code>int</code> is because we will assign meaning to each integer value, to encode what we require. For example we can make a rule <em>"If <code>type</code> is <code>0</code> then the structure is a Number."</em>, or <em>"If <code>type</code> is <code>1</code> then the structure is an Error."</em> This is a simple and effective way of doing things.</p>

<p>But if we litter our code with stray <code>0</code> and <code>1</code> then it is going to become increasingly unclear as to what is happening. Instead we can use named constants that have been assigned these integer values. This gives the reader an indication as to <em>why</em> one might be comparing a number to <code>0</code> or <code>1</code> and <em>what</em> is meant in this context.</p>

<p>In C this is supported using an <code>enum</code>.</p>

<pre><code data-language='c'>/* Create Enumeration of Possible lval Types */
enum { LVAL_NUM, LVAL_ERR };</code></pre>

<p>An <code>enum</code> is a declaration of variables which under the hood are automatically assigned integer constant values. Above describes how we would declare some enumerated values for the <code>type</code> field.</p>

<p>We also want to declare an enumeration for the <em>error</em> field. We have three error cases in our particular program. There is division by zero, an unknown operator, or being passed a number that is too large to be represented internally using a <code>long</code>. These can be enumerated as follows.</p>

<pre><code data-language='c'>/* Create Enumeration of Possible Error Types */
enum { LERR_DIV_ZERO, LERR_BAD_OP, LERR_BAD_NUM };</code></pre>


<h2 id='lisp_value_functions'>Lisp Value Functions</h2> <hr/>

<p>Our <code>lval</code> type is almost ready to go. Unlike the previous <code>long</code> type we have no current method for creating new instances of it. To do this we can declare two functions that construct an <code>lval</code> of either an <em>error</em> type or a <em>number</em> type.</p>

<pre><code data-language='c'>/* Create a new number type lval */
lval lval_num(long x) {
  lval v;
  v.type = LVAL_NUM;
  v.num = x;
  return v;
}

/* Create a new error type lval */
lval lval_err(int x) {
  lval v;
  v.type = LVAL_ERR;
  v.err = x;
  return v;
}</code></pre>

<p>These functions first create an <code>lval</code> called <code>v</code>, and assign the fields before returning it.</p>

<p>Because our <code>lval</code> function can now be one of two things we can no longer just use <code>printf</code> to output it. We will want to behave differently depending upon the type of the <code>lval</code> that is given. There is a concise way to do this in C using the <code>switch</code> statement. This takes some value as input and compares it to other known values, known as <em>cases</em>. When the values are equal it executes the code that follows up until the next <code>break</code> statement.</p>

<p>Using this we can build a function that can print an <code>lval</code> of any type like this.</p>

<pre><code data-language='c'>/* Print an "lval" */
void lval_print(lval v) {
  switch (v.type) {
    /* In the case the type is a number print it */
    /* Then 'break' out of the switch. */
    case LVAL_NUM: printf("%li", v.num); break;

    /* In the case the type is an error */
    case LVAL_ERR:
      /* Check what type of error it is and print it */
      if (v.err == LERR_DIV_ZERO) {
        printf("Error: Division By Zero!");
      }
      if (v.err == LERR_BAD_OP)   {
        printf("Error: Invalid Operator!");
      }
      if (v.err == LERR_BAD_NUM)  {
        printf("Error: Invalid Number!");
      }
    break;
  }
}

/* Print an "lval" followed by a newline */
void lval_println(lval v) { lval_print(v); putchar('\n'); }</code></pre>


<h2 id='evaluating_errors'>Evaluating Errors</h2> <hr/>

<p>Now that we know how to work with the <code>lval</code> type, we need to change our evaluation functions to use it instead of <code>long</code>.</p>

<p>As well as changing the type signatures we need to change the functions such that they work correctly upon encountering either an <em>error</em> as input, or a <em>number</em> as input.</p>

<p>In our <code>eval_op</code> function, if we encounter an error we should return it right away, and only do computation if both the arguments are numbers. We should modify our code to return an error rather than attempt to divide by zero. This will fix the crash described at the beginning of this chapter.</p>

<pre><code data-language='c'>lval eval_op(lval x, char* op, lval y) {

  /* If either value is an error return it */
  if (x.type == LVAL_ERR) { return x; }
  if (y.type == LVAL_ERR) { return y; }

  /* Otherwise do maths on the number values */
  if (strcmp(op, "+") == 0) { return lval_num(x.num + y.num); }
  if (strcmp(op, "-") == 0) { return lval_num(x.num - y.num); }
  if (strcmp(op, "*") == 0) { return lval_num(x.num * y.num); }
  if (strcmp(op, "/") == 0) {
    /* If second operand is zero return error */
    return y.num == 0
      ? lval_err(LERR_DIV_ZERO)
      : lval_num(x.num / y.num);
  }

  return lval_err(LERR_BAD_OP);
}</code></pre>

<div class="alert alert-warning">
  <p><strong>What is that <code>?</code> doing there?</strong></p>

  <p>You'll notice that for division to check if the second argument is zero we use a question mark symbol <code>?</code>, followed by a colon <code>:</code>. This is called the <em>ternary operator</em>, and it allows you to write conditional expressions on one line.</p>

  <p>It works something like this. <code>&lt;condition&gt; ? &lt;then&gt; : &lt;else&gt;</code>. In other words, if the condition is true it returns what follows the <code>?</code>, otherwise it returns what follows <code>:</code>.</p>

  <p>Some people dislike this operator because they believe it makes code unclear. If you are unfamiliar with the ternary operator, you may initially find it awkward to use; but once you get to know it there are rarely problems.</p>
</div>

<p>We need to give a similar treatment to our <code>eval</code> function. In this case because we've defined <code>eval_op</code> to robustly handle errors we just need to add the error conditions to our number conversion function.</p>

<p>In this case we use the <code>strtol</code> function to convert from string to <code>long</code>. This allows us to check a special variable <code>errno</code> to ensure the conversion goes correctly. This is a more robust way to convert numbers than our previous method using <code>atoi</code>.</p>

<pre><code data-language='c'>lval eval(mpc_ast_t* t) {

  if (strstr(t-&gt;tag, "number")) {
    /* Check if there is some error in conversion */
    errno = 0;
    long x = strtol(t-&gt;contents, NULL, 10);
    return errno != ERANGE ? lval_num(x) : lval_err(LERR_BAD_NUM);
  }

  char* op = t-&gt;children[1]-&gt;contents;
  lval x = eval(t-&gt;children[2]);

  int i = 3;
  while (strstr(t-&gt;children[i]-&gt;tag, "expr")) {
    x = eval_op(x, op, eval(t-&gt;children[i]));
    i++;
  }

  return x;
}</code></pre>

<p>The final small step is to change how we print the result found by our evaluation to use our newly defined printing function which can print any type of <code>lval</code>.</p>

<pre><code data-language='c'>lval result = eval(r.output);
lval_println(result);
mpc_ast_delete(r.output);</code></pre>

<p>And we are done! Try running this new program and make sure there are no crashes when dividing by zero.</p>

<pre><code data-language='lispy'>lispy&gt; / 10 0
Error: Division By Zero!
lispy&gt; / 10 2
5</code></pre>


<h2 id='plumbing'>Plumbing</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/plumbing.png" alt="plumbing" class="img-responsive" width="368px" height="302px"/>
  <p><small>Plumbing &bull; Harder than you think</small></p>
</div>

<p>Some of you who have gotten this far in the book may feel uncomfortable with how it is progressing. You may feel you've managed to follow instructions well enough, but don't have a clear understanding of all of the underlying mechanisms going on behind the scenes.</p>

<p>If this is the case I want to reassure you that you are doing well. If you don't understand the internals it's because I may not have explained everything in sufficient depth. This is okay.</p>

<p>To be able to progress and get code to work under these conditions is a great skill in programming, and if you've made it this far it shows you have it.</p>

<p>In programming we call this <em>plumbing</em>. Roughly speaking this is following instructions to try to tie together a bunch of libraries or components, without fully understanding how they work internally.</p>

<p>It requires <em>faith</em> and <em>intuition</em>. <em>Faith</em> is required to believe that if the stars align, and every incantation is correctly performed for this magical machine, the right thing will really happen. And <em>intuition</em> is required to work out what has gone wrong, and how to fix things when they don't go as planned.</p>

<p>Unfortunately these can't be taught directly, so if you've made it this far then you've made it over a difficult hump, and in the following chapters I promise we'll finish up with the plumbing, and actually start programming that feels fresh and wholesome.</p>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Run the previous chapter's code through <code>gdb</code> and crash it. See what happens.</li>
    <li class="list-group-item">&rsaquo; How do you give an <code>enum</code> a name?</li>
    <li class="list-group-item">&rsaquo; What are <code>union</code> data types and how do they work?</li>
    <li class="list-group-item">&rsaquo; What are the advantages over using a <code>union</code> instead of <code>struct</code>?</li>
    <li class="list-group-item">&rsaquo; Can you use a <code>union</code> in the definition of <code>lval</code>?</li>
    <li class="list-group-item">&rsaquo; Extend parsing and evaluation to support the remainder operator <code>%</code>.</li>
    <li class="list-group-item">&rsaquo; Extend parsing and evaluation to support decimal types using a <code>double</code> field.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter7_evaluation"><h4>&lsaquo; Evaluation</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter9_s_expressions"><h4>S-Expressions &rsaquo;</h4></a></td>
  </tr>
</table>