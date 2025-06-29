---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter3_basics/
---

<h1>Basics <small>&bull; Chapter 3</small></h1>


<h2 id='overview'>Overview</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/programs.png" alt="programs" class="img-responsive" width="251px" height="410px"/>
  <p><small>Programs &bull; Useful for the theatre.</small></p>
</div>

<p>In this chapter I've prepared a quick overview of the basic features of C. There are very few <em>features</em> in C, and the syntax is relatively simple. But this doesn't mean it is easy. All the depth hides below the surface. Because of this we're going to cover the <em>features</em> and <em>syntax</em> fairly quickly now, and see them in greater depth as we continue.</p>

<p>The goal of this chapter is to get everyone on the same page. People totally new to C should therefore take some time over it, while those with some existing experience may find it easier to skim and return to later as required.</p>


<h2 id='programs'>Programs</h2> <hr/>

<p>A program in C consists of only <em>function definitions</em> and <em>structure definitions</em>.</p>

<p>Therefore a source file is simply a list of <em>functions</em> and <em>types</em>. These functions can call each other or themselves, and can use any data types that have been declared or are built into the language.</p>

<p>It is possible to call functions in other libraries, or to use their data types. This is how layers of complexity are accumulated in C programming.</p>

<p>As we saw in the previous chapter, the execution of a C program always starts in the function called <code>main</code>. From here it calls more and more functions, to perform all the actions it requires.</p>


<h2 id='variables'>Variables</h2> <hr/>

<p>Functions in C consist of manipulating <em>variables</em>. These are items of data which we give a name to.</p>

<p>Every variable in C has an explicit <em>type</em>. These types are declared by ourselves or built into the language. We can declare a new variable by writing the name of its type, followed by its name, and optionally setting it to some value using <code>=</code>. This declaration is a <em>statement</em>, and we terminate all <em>statements</em> in C with a semicolon <code>;</code>.</p>

<p>To create a new <code>int</code> called <code>count</code> we could write the following...</p>

<pre><code data-language='c'>int count;</code></pre>

<p>Or to declare it and set the value...</p>

<pre><code data-language='c'>int count = 10;</code></pre>

<p>Here are some descriptions and examples of some of the built in types.</p>

<table class="table">
  <tr><td><code>void</code></td>  <td>Empty Type</td>                         <td></td></tr>
  <tr><td><code>char</code></td>  <td>Single Character/Byte</td>              <td><code>char last_initial = 'H';</code></td></tr>
  <tr><td><code>int</code></td>   <td>Integer</td>                            <td><code>int age = 23;</code></td></tr>
  <tr><td><code>long</code></td>  <td>Integer that can hold larger values</td><td><code>long age_of_universe = 13798000000;</code></td></tr>
  <tr><td><code>float</code></td> <td>Decimal Number</td>                     <td><code>float liters_per_pint = 0.568f;</code></td></tr>
  <tr><td><code>double</code></td><td>Decimal Number with more precision</td> <td><code>double speed_of_swallow = 0.01072896;</code></td></tr>
</table>


<h2 id='function_declarations'>Function Declarations</h2> <hr/>

<p>A function is a computation that manipulates variables, and optionally changes the state of the program. It takes as input some variables and returns some single variable as output.</p>

<p>To declare a function we write the type of the variable it returns, the name of the function, and then in parenthesis a list of the variables it takes as input, separated by commas. The contents of the function are put inside curly brackets <code>{}</code>, and lists all of the statements the function executes, terminated by semicolons <code>;</code>. A <code>return</code> statement is used to let the function finish and output a variable.</p>

<p>For example a function that takes two <code>int</code> variables called <code>x</code> and <code>y</code> and adds them together could look like this.</p>

<pre><code data-language='c'>int add_together(int x, int y) {
  int result = x + y;
  return result;
}</code></pre>

<p>We call functions by writing their name and putting the arguments to the function in parentheses, separated by commas. For example to call the above function and store the result in a variable <code>added</code> we would write the following.</p>

<pre><code data-language='c'>int added = add_together(10, 18);</code></pre>


<h2 id='structure_declarations'>Structure Declarations</h2> <hr/>

<p>Structures are used to declare new <em>types</em>. Structures are several variables bundled together into a single package.</p>

<p>We can use structure to represent more complex data types. For example to represent a point in 2D space we could create a structure called <code>point</code> that packs together two <code>float</code> (decimal) values called <code>x</code> and <code>y</code>. To declare structures we can use the <code>struct</code> keyword in conjunction with the <code>typedef</code> keyword. Our declaration would look like this.</p>

<pre><code data-language='c'>typedef struct {
  float x;
  float y;
} point;</code></pre>

<p>We should place this definition above any functions that wish to use it. This type is no different to the built in types, and we can use it in all the same ways. To access an individual field we use a dot <code>.</code>, followed by the name of the field, such as <code>x</code>.</p>

<pre><code data-language='c'>point p;
p.x = 0.1;
p.y = 10.0;

float length = sqrt(p.x * p.x + p.y * p.y);
</code></pre>




<h2 id='pointers'>Pointers</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/pointer.png" alt="pointer" class="img-responsive" width="251px" height="384px"/>
  <p><small>Pointer &bull; A short haired one</small></p>
</div>

<p>A pointer is a variation on a normal type where the type name is suffixed with an asterisk. For example we could declare a <em>pointer to an integer</em> by writing <code>int*</code>. We already saw a pointer type <code>char** argv</code>. This is a <em>pointer to pointers to characters</em>, and is used as input to <code>main</code> function.</p>

<p>Pointers are used for a whole number of different things such as for strings or lists. These are a difficult part of C and will be explained in much greater detail in later chapters. We won't make use of them for a while, so for now it is good to simply know they exist, and how to spot them. Don't let them scare you off!</p>


<h2 id='strings'>Strings</h2> <hr/>

<p>In C strings are represented by the pointer type <code>char*</code>. Under the hood they are stored as a list of characters, where the final character is a special character called the <em>null terminator</em>. Strings are a complicated and important part of C, which we'll learn to use effectively in the next few chapters.</p>

<p>Strings can also be declared literally by putting text between quotation marks. We used this in the previous chapter with our string <code>"Hello, World!"</code>. For now, remember that if you see <code>char*</code>, you can read it as a <em>string</em>.</p>


<h2 id='conditionals'>Conditionals</h2> <hr/>

<p>Conditional statements let the program perform some code only if certain conditions are met.</p>

<p>To perform code under some condition we use the <code>if</code> statement. This is written as <code>if</code> followed by some condition in parentheses, followed by the code to execute in curly brackets. An <code>if</code> statement can be followed by an optional <code>else</code> statement, followed by other statements in curly brackets. The code in these brackets will be performed in the case the conditional is false.</p>

<p>We can test for multiple conditions using the logical operators <code>||</code> for <em>or</em>, and <code>&&</code> for <em>and</em>.</p>

<p>Inside a conditional statement's parentheses any value that is not <code>0</code> will evaluate to true. This is important to remember as many conditions use this to check things implicitly.</p>

<p>If we wished to check if an <code>int</code> called <code>x</code> was greater than <code>10</code> and less than <code>100</code>, we would write the following.</p>

<pre><code data-language='c'>if (x > 10 && x < 100) {
  puts("x is greater than 10 and less than 100!");
} else {
  puts("x is less than 11 or greater than 99!");
}</code></pre>


<h2 id='loops'>Loops</h2> <hr/>

<p>Loops allow for some code to be repeated until some condition becomes false, or some counter elapses.</p>

<p>There are two main loops in C. The first is a <code>while</code> loop. This loop repeatedly executes a block of code until some condition becomes false. It is written as <code>while</code> followed by some condition in parentheses, followed by the code to execute in curly brackets. For example a loop that counts downward from <code>10</code> to <code>1</code> could be written as follows.</p>

<pre><code data-language='c'>int i = 10;
while (i > 0) {
  puts("Loop Iteration");
  i = i - 1;
}</code></pre>

<p>The second kind of loop is a <code>for</code> loop. Rather than a condition, this loop requires three expressions separated by semicolons <code>;</code>. These are an <em>initialiser</em>, a <em>condition</em> and an <em>incrementer</em>. The <em>initialiser</em> is performed before the loop starts. The <em>condition</em> is checked before each iteration of the loop. If it is false, the loop is exited. The <em>incrementer</em> is performed at the end of each iteration of the loop. These loops are often used for counting as they are more compact than the <code>while</code> loop.</p>

<p>For example to write a loop that counts up from <code>0</code> to <code>9</code> we might write the following. In this case the <code>++</code> operator increments the variable <code>i</code>.</p>

<pre><code data-language='c'>for (int i = 0; i < 10; i++) {
  puts("Loop Iteration");
}</code></pre>


<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Use a <code>for</code> loop to print out <code>Hello World!</code> five times.</li>
    <li class="list-group-item">&rsaquo; Use a <code>while</code> loop to print out <code>Hello World!</code> five times.</li>
    <li class="list-group-item">&rsaquo; Declare a function that outputs <code>Hello World!</code> <code>n</code> number of times. Call this from <code>main</code>.</li>
    <li class="list-group-item">&rsaquo; What built in types are there other than the ones listed?</li>
    <li class="list-group-item">&rsaquo; What other conditional operators are there other than <em>greater than</em> <code>&gt;</code>, and <em>less than</em> <code>&lt;</code>?</li>
    <li class="list-group-item">&rsaquo; What other mathematical operators are there other than <em>add</em> <code>+</code>, and <em>subtract</em> <code>-</code>?</li>
    <li class="list-group-item">&rsaquo; What is the <code>+=</code> operator, and how does it work?</li>
    <li class="list-group-item">&rsaquo; What is the <code>do</code> loop, and how does it work?</li>
    <li class="list-group-item">&rsaquo; What is the <code>switch</code> statement and how does it work?</li>
    <li class="list-group-item">&rsaquo; What is the <code>break</code> keyword and what does it do?</li>
    <li class="list-group-item">&rsaquo; What is the <code>continue</code> keyword and what does it do?</li>
    <li class="list-group-item">&rsaquo; What does the <code>typedef</code> keyword do exactly?</li>
  </ul>
</div>

<h2>Navigation</h2>


<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter2_installation"><h4>&lsaquo; Installation</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter4_interactive_prompt"><h4>An Interactive Prompt &rsaquo;</h4></a></td>
  </tr>
</table>