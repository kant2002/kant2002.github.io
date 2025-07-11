---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter4_interactive_prompt/
---

<h1>An Interactive Prompt <small>&bull; Chapter 4</small></h1>


<h2 id='read_evaluate_print'>Read, Evaluate, Print</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/reptile.png" alt="reptile" class="img-responsive" width="187px" height="273px"/>
  <p><small>Reptile &bull; Sort of like REPL</small></p>
</div>

<p>As we build our programming language we'll need some way to interact with it. C uses a compiler, where you can change the program, recompile and run it. It'd be good if we could do something better, and interact with the language dynamically. Then we test its behaviour under a number of conditions very quickly. For this we can build something called an <em>interactive prompt</em>.</p>

<p>This is a program that prompts the user for some input, and when supplied with it, replies back with some message. Using this will be the easiest way to test our programming language and see how it acts. This system is also called a <em>REPL</em>, which stands for <em>read</em>-<em>evaluate</em>-<em>print</em> <em>loop</em>. It is a common way of interacting with a programming language which you may have used before in languages such as <em>Python</em>.</p>

<p>Before building a full <em>REPL</em> we'll start with something simpler. We are going to make a system that prompts the user, and echoes any input straight back. If we make this we can later extend it to parse the user input and evaluate it, as if it were an actual Lisp program.</p>


<h2 id='an_interactive_prompt'>An Interactive Prompt</h2> <hr/>

<p>For the basic setup we want to write a loop which repeatedly writes out a message, and then waits for some input. To get user input we can use a function called <code>fgets</code>, which reads any input up until a new line. We need somewhere to store this user input. For this we can declare a constantly sized input buffer.</p>

<p>Once we have this user input stored we can then print it back to the user using a function called <code>printf</code>.</p>

<pre><code data-language='c'>#include &lt;stdio.h&gt;

/* Declare a buffer for user input of size 2048 */
static char input[2048];

int main(int argc, char** argv) {

  /* Print Version and Exit Information */
  puts("Lispy Version 0.0.0.0.1");
  puts("Press Ctrl+c to Exit\n");

  /* In a never ending loop */
  while (1) {

    /* Output our prompt */
    fputs("lispy&gt; ", stdout);

    /* Read a line of user input of maximum size 2048 */
    fgets(input, 2048, stdin);

    /* Echo input back to user */
    printf("No you're a %s", input);
  }

  return 0;
}</code></pre>

<div class="alert alert-warning">
  <p><strong>What is that text in light green?</strong></p>

  <p>The above code contains <em>comments</em>. These are sections of the code between <code>/*</code> <code>*/</code> symbols, which are ignored by the compiler, but are used to inform the person reading what is going on. Take notice of them!</p>
</div>

<p>Let's go over this program in a little more depth.</p>

<p>The line <code>static char input[2048];</code> declares a global array of 2048 characters. This is a reserved block of data we can access anywhere from our program. In it we are going to store the user input which is typed into the command line. The <code>static</code> keyword makes this variable local to this file, and the <code>[2048]</code> section is what declares the size.</p>

<p>We write an infinite loop using <code>while (1)</code>. In a conditional block <code>1</code> always evaluates to true. Therefore commands inside this loop will run forever.</p>

<p>To output our prompt we use the function <code>fputs</code>. This is a slight variation on <code>puts</code> which does not append a newline character. We use the <code>fgets</code> function for getting user input from the command line. Both of these functions require some file to write to, or read from. For this we supply the special variables <code>stdin</code> and <code>stdout</code>. These are declared in <code>&lt;stdio.h&gt;</code> and are special file variables representing input to, and output from, the command line. When passed this variable the <code>fgets</code> function will wait for a user to input a line of text, and when it has it will store it into the <code>input</code> buffer, including the newline character. So that <code>fgets</code> does not read in too much data we also must also supply the size of the buffer <code>2048</code>.</p>

<p>To echo the message back to the user we use the function <code>printf</code>. This is a function that provides a way of printing messages consisting of several elements. It matches arguments to patterns in the given string. For example in our case we can see the <code>%s</code> pattern in the given string. This means that it will be replaced by whatever argument is passed in next, interpreted as a string.</p>

<p>For more information on these different patterns please see the <a href="http://en.cppreference.com/w/c/io/printf">documentation</a> on <code>printf</code>.</p>

<div class="alert alert-warning">
  <p><strong>How am I meant to know about functions like <code>fgets</code> and <code>printf</code>?</strong></p>

  <p>It isn't immediately obvious how to know about these standard functions, and when to use them. When faced with a problem it takes experience to know when it has been solved for you by library functions.</p>

  <p>Luckily C has a very small standard library and almost all of it can be learnt in practice. If you want to do something that seems quite basic, or fundamental, it is worth looking at the <a href="http://en.cppreference.com/w/c">reference documentation</a> for the standard library and checking if there are any functions included that do what you want.</p>
</div>


<h2 id='compilation'>Compilation</h2> <hr/>

<p>You can compile this with the same command as was used in the second chapter.</p>

<pre><code>cc -std=c99 -Wall prompt.c -o prompt</code></pre>

<p>After compiling this you should try to run it. You can use <code>Ctrl+c</code> to quit the program when you are done. If everything is correct your program should run something like this.</p>

<pre><code data-language='lispy'>Lispy Version 0.0.0.0.1
Press Ctrl+c to Exit

lispy&gt; hello
No you're a hello
lispy&gt; my name is Dan
No you're a my name is Dan
lispy&gt; Stop being so rude!
No you're a Stop being so rude!
lispy&gt;</code></pre>


<h2 id='editing_input'>Editing input</h2> <hr/>

<p>If you're working on Linux or Mac you'll notice some weird behaviour when you use the arrow keys to attempt to edit your input.</p>

<pre><code data-language='lispy'>Lispy Version 0.0.0.0.3
Press Ctrl+c to Exit

lispy> hel^[[D^[[C
</code></pre>

<p>Using the arrow keys is creating these weird characters <code>^[[D</code> or <code>^[[C</code>, rather than moving the cursor around in the input. What we really want is to be able to move around on the line, deleting and editing the input in case we make a mistake.</p>

<p>On Windows this behaviour is the default. On Linux and Mac it is provided by a library called <code>editline</code>. On Linux and Mac we need to replace our calls to <code>fputs</code> and <code>fgets</code> with calls to functions this library provides.</p>

<p>If you're developing on Windows and just want to get going, feel free to skip to the end of this chapter as the next few sections may not be relevant.</p>

<h3>Using Editline</h3>

<p>The library <code>editline</code> provides two functions we are going to use called <code>readline</code> and <code>add_history</code>. This first function, <code>readline</code> is used to read input from some prompt, while allowing for editing of that input. The second function <code>add_history</code> lets us record the history of inputs so that they can be retrieved with the up and down arrows.</p>

<p>We replace <code>fputs</code> and <code>fgets</code> with calls to these functions to get the following.</p>

<pre><code data-language='c'>#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;

#include &lt;editline/readline.h&gt;
#include &lt;editline/history.h&gt;

int main(int argc, char** argv) {

  /* Print Version and Exit Information */
  puts("Lispy Version 0.0.0.0.1");
  puts("Press Ctrl+c to Exit\n");

  /* In a never ending loop */
  while (1) {

    /* Output our prompt and get input */
    char* input = readline("lispy&gt; ");

    /* Add input to history */
    add_history(input);

    /* Echo input back to user */
    printf("No you're a %s\n", input);

    /* Free retrieved input */
    free(input);

  }

  return 0;
}</code></pre>

<p>We have <em>included</em> a few new <em>headers</em>. There is <code>#include &lt;stdlib.h&gt;</code>, which gives us access to the <code>free</code> function used later on in the code. We have also added <code>#include &lt;editline/readline.h&gt;</code> and <code>#include &lt;editline/history.h&gt;</code> which give us access to the <code>editline</code> functions, <code>readline</code> and <code>add_history</code>.</p>

<p>Instead of prompting, and getting input with <code>fgets</code>, we do it in one go using <code>readline</code>. The result of this we pass to <code>add_history</code> to record it. Finally we print it out as before using <code>printf</code>.</p>

<p>Unlike <code>fgets</code>, the <code>readline</code> function strips the trailing newline character from the input, so we need to add this to our <code>printf</code> function. We also need to delete the input given to us by the <code>readline</code> function using <code>free</code>. This is because unlike <code>fgets</code>, which writes to some existing buffer, the <code>readline</code> function allocates new memory when it is called. When to free memory is something we cover in depth in later chapters.</p>

<h3>Compiling with Editline</h3>

<p>If you try to compile this right away with the previous command you'll get an error. This is because you first need to install the <code>editline</code> library on your computer.</p>

<pre><code>fatal error: editline/readline.h: No such file or directory #include &lt;editline/readline.h&gt;</code></pre>

<p>On <strong>Mac</strong> the <code>editline</code> library comes with <em>Command Line Tools</em>. Instructions for installing these can be found in <a href="http://www.buildyourownlisp.com/chapter2_installation">Chapter 2</a>. You may still get an error about the history header not being found. In this case remove the line <code>#include &lt;editline/history.h&gt;</code>, as this header may not be required.</p>

<p>On <strong>Linux</strong> you can install <em>editline</em> with <code>sudo apt-get install libedit-dev</code>. On Fedora you can use the command <code>su -c "yum install libedit-dev*"</code></p>

<p>Once you have installed <em>editline</em> you can try to compile it again. This time you'll get a different error.</p>

<pre><code>undefined reference to `readline'
undefined reference to `add_history'
</code></pre>

<p>This means that you haven't <em>linked</em> your program to <code>editline</code>. This <em>linking</em> process allows the compiler to directly embed calls to <code>editline</code> in your program. You can make it link by adding the flag <code>-ledit</code> to your compile command, just before the output flag.</p>

<pre><code>cc -std=c99 -Wall prompt.c -ledit -o prompt</code></pre>

<p>Run it and check that now you can edit inputs as you type them in.</p>

<div class="alert alert-warning">
  <p><strong>It's still not working!</strong></p>
  
  <p>Some systems might have slight variations on how to install, include, and link to <code>editline</code>. For example on Arch linux the editline history header is <code>histedit.h</code>. If you are having trouble search online and see if you can find distribution specific instructions on how to install and use the <code>editline</code> library. If that fails search for instructions on the <code>readline</code> library. This is a drop-in replacement for editline. On Mac it can be installed using HomeBrew or MacPorts.</p>
</div>


<h2 id='the_c_preprocessor'>The C Preprocessor</h2> <hr/>

<p>For such a small project it might be okay that we have to program differently depending on what operating system we are using, but if I want to send my source code to a friend on a different operating system to give me a hand with the programming, it is going to cause problems. In an ideal world I'd wish for my source code to be able to compile no matter where, or on what computer, it is being compiled. This is a general problem in C, and it is called <em>portability</em>. There is not always an easy or correct solution.</p>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/octopus.png" alt="octopus" class="img-responsive" width="266px" height="268px"/>
  <p><small>Octopus &bull; Sort of like Octothorpe</small></p>
</div>

<p>But C does provide a mechanism to help, called <em>the preprocessor</em>.</p>

<p>The preprocessor is a program that runs before the compiler. It has a number of purposes, and we've been actually using it already without knowing. Any line that starts with a octothorpe <code>#</code> character (hash to you and me) is a preprocessor command. We've been using it to <em>include</em> header files, giving us access to functions from the standard library and others.</p>

<p>Another use of the preprocessor is to detect which operating system the code is being compiled on, and to use this to emit different code.</p>

<p>This is exactly how we are going to use it. If we are running Windows we're going to let the preprocessor emit code with some fake <code>readline</code> and <code>add_history</code> functions I've prepared, otherwise we are going to include the headers from <code>editline</code> and use these.</p>

<p>To declare what code the compiler should emit we can wrap it in <code>#ifdef</code>, <code>#else</code>, and <code>#endif</code> preprocessor statements. These are like an <code>if</code> function that happens before the code is compiled. All the contents of the file from the first <code>#ifdef</code> to the next <code>#else</code> are used if the condition is true, otherwise all the contents from the <code>#else</code> to the final <code>#endif</code> are used instead. By putting these around our fake functions, and our editline headers, the code that is emitted should compile on Windows, Linux or Mac.</p>

<pre><code data-language='c'>#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;

/* If we are compiling on Windows compile these functions */
#ifdef _WIN32
#include &lt;string.h&gt;

static char buffer[2048];

/* Fake readline function */
char* readline(char* prompt) {
  fputs(prompt, stdout);
  fgets(buffer, 2048, stdin);
  char* cpy = malloc(strlen(buffer)+1);
  strcpy(cpy, buffer);
  cpy[strlen(cpy)-1] = '\0';
  return cpy;
}

/* Fake add_history function */
void add_history(char* unused) {}

/* Otherwise include the editline headers */
#else
#include &lt;editline/readline.h&gt;
#include &lt;editline/history.h&gt;
#endif

int main(int argc, char** argv) {

  puts("Lispy Version 0.0.0.0.1");
  puts("Press Ctrl+c to Exit\n");

  while (1) {

    /* Now in either case readline will be correctly defined */
    char* input = readline("lispy&gt; ");
    add_history(input);

    printf("No you're a %s\n", input);
    free(input);

  }

  return 0;
}</code></pre>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
<ul class="list-group">
  <li class="list-group-item">&rsaquo; Change the prompt from <code>lispy&gt;</code> to something of your choice.</li>
  <li class="list-group-item">&rsaquo; Change what is echoed back to the user.</li>
  <li class="list-group-item">&rsaquo; Add an extra message to the <em>Version</em> and <em>Exit</em> Information.</li>
  <li class="list-group-item">&rsaquo; What does the <code>\n</code> mean in those strings?</li>
  <li class="list-group-item">&rsaquo; What other patterns can be used with <code>printf</code>?</li>
  <li class="list-group-item">&rsaquo; What happens when you pass <code>printf</code> a variable that does not match the pattern?</li>
  <li class="list-group-item">&rsaquo; What does the preprocessor command <code>#ifndef</code> do?</li>
  <li class="list-group-item">&rsaquo; What does the preprocessor command <code>#define</code> do?</li>
  <li class="list-group-item">&rsaquo; If <code>_WIN32</code> is defined on windows, what is defined for Linux or Mac?</li>
</ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter3_basics"><h4>&lsaquo; Basics</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter5_languages"><h4>Languages &rsaquo;</h4></a></td>
  </tr>
</table>