---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter2_installation/
---

<h1>Installation <small>&bull; Chapter 2</small></h1>


<h2 id='setup'>Setup</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/cattop.png" alt="capttop" class="img-responsive" width="297px" height="461px"/>
  <p><small>Cat &bull; Install at own risk.</small></p>
</div>

<p>Before we can start programming in C we'll need to install a couple of things, and set up our environment so that we have everything we need. Because C is such a universal language this should hopefully be fairly simple. Essentially we need to install two main things. A <em>text editor</em> and a <em>compiler</em>.</p>


<h2 id='text_editor'>Text Editor</h2> <hr/>

<p>A text editor is a program that allows you to edit text files in a way suitable for programming.</p>

<p>On <strong>Linux</strong> the text editor I recommend is <a href="http://projects.gnome.org/gedit/">gedit</a>. Whatever other basic text editor comes installed with your distribution will also work well. If you are a Vim or Emacs user these are fine to use. Please don't use an IDE. It isn't required for such a small project and won't help in understanding what is going on.</p>

<p>On <strong>Mac</strong> a simple text editor that can be used is <a href="http://www.barebones.com/products/textwrangler/">TextWrangler</a>. If you have a different preference this is fine, but please don't use XCode for text editing. This is a small project and using an IDE won't help you understand what is going on.</p>

<p>On <strong>Windows</strong> my text editor of choice is <a href="http://notepad-plus-plus.org/">Notepad++</a>. If you have another preference this is fine. Please <em>don't</em> use <em>Visual Studio</em> as it does not have proper support for C programming. If you attempt to use it you will run into many problems.</p>


<h2 id='compiler'>Compiler</h2> <hr/>

<p>The compiler is a program that transforms the C source code into a program your computer can run. The installation process for these is different depending on what operating system you are running.</p>

<p>Compiling and running C programs is also going to require really basic usage of the command line. This I will not cover, so I am going to assume you have at least some familiarity with using the command line. If you are are worried about this then search for <a href="http://cli.learncodethehardway.org/book/">online tutorials</a> on using it, relevant to your operating system.</p>

<p>On <strong>Linux</strong> you can install a compiler by downloading some packages. If you are running Ubuntu or Debian you can install everything you need with the following command <code>sudo apt-get install build-essential</code>. If you are running Fedora or a similar Linux variant you can use this command <code>su -c "yum groupinstall development-tools"</code>.</p>

<p>On <strong>Mac</strong> you can install a compiler by downloading and installing the latest version of XCode from Apple. If you are unsure of how to do this you can search online for "installing xcode" and follow any advice shown. You will then need to install the <em>Command Line Tools</em>. On Mac OS X 10.9 this can be done by running the command <code>xcode-select --install</code> from the command line. On versions of Mac OS X prior to 10.9 this can be done by going to XCode Preferences, Downloads, and selecting <em>Command Line Tools</em> for Installation.</p>

<p>On <strong>Windows</strong> you can install a compiler by downloading and installing <a href="https://www.mingw-w64.org/">MinGW</a>. Once installed you need to add the compiler and other programs to your system <code>PATH</code> variable. To do this follow <a href="http://www.computerhope.com/issues/ch000549.htm">these instructions</a> appending the value <code>;C:\MinGW\bin</code> to the variable called <code>PATH</code>. You can create this variable if it doesn't exist. You may need to restart <code>cmd.exe</code> for the changes to take effect. This will allow you to run a compiler from the command line <code>cmd.exe</code>. It will also install other programs which make <code>cmd.exe</code> act like a Unix command line.</p>


<h3 id='testing_the_compiler'>Testing the Compiler</h3>

<p>To test if your C compiler is installed correctly type the following into the command line.</p>

<pre><code>cc --version</code></pre>

<p>If you get some information about the compiler version echoed back then it should be installed correctly. You are ready to go! If you get any sort of error message about an unrecognised or not found command, then it is not ready. You may need to restart the command line or your computer for changes to take effect.</p>

<div class="alert alert-warning">
  <p><strong>Different compiler commands.</strong></p>

  <p>On some systems (such as Windows) the compiler command might have a different name such as <code>gcc</code>. Try this if the system cannot find the <code>cc</code> command.</p>
</div>

<h2 id='hello_world'>Hello World</h2> <hr/>

<p>Now that your environment is set up, start by opening your text editor and inputting the following program. Create a directory where you are going to put your work for this book, and save this file as <code>hello_world.c</code>. This is your first C program!</p>

<pre><code data-language='c'>#include &lt;stdio.h&gt;

int main(int argc, char** argv) {
  puts("Hello, world!");
  return 0;
}</code></pre>

<!--
<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/toast.png" alt="toast"/>
  <p><small>Toast &bull; A typical toast</small></p>
</div>
-->

<p>This may initially make very little sense. I'll try to explain it step by step.</p>

<p>In the first line we <em>include</em> what is called a <em>header</em>. This statement allows us to use the functions from <code>stdio.h</code>, the standard input and output library which comes included with C. One of the functions from this library is the <code>puts</code> function you see later on in the program.</p>

<p>Next we <em>declare</em> a function called <code>main</code>. This function is declared to output an <code>int</code>, and take as input an <code>int</code> called <code>argc</code> and a <code>char**</code> called <code>argv</code>. All C programs must contain this function. All programs start running from this function.</p>

<p>Inside <code>main</code> the <code>puts</code> function is <em>called</em> with the argument <code>"Hello, world!"</code>. This outputs the message <code>Hello, world!</code> to the command line. The function <code>puts</code> is short for <em>put string</em>. The second statement inside the function is <code>return 0;</code>. This tells the <code>main</code> function to finish and return <code>0</code>. When a C program returns <code>0</code> this indicates there have been no errors running the program.</p>


<h2 id='compilation'>Compilation</h2> <hr/>

<p>Before we can run this program we need to compile it. This will produce the actual <em>executable</em> we can run on our computer. Open up the command line and browse to the directory that <code>hello_world.c</code> is saved in. You can then compile your program using the following command.</p>

<pre><code>cc -std=c99 -Wall hello_world.c -o hello_world</code></pre>

<p>This compiles the code in <code>hello_world.c</code>, reporting any warnings, and outputs the program to a new file called <code>hello_world</code>. We use the <code>-std=c99</code> flag to tell the compiler which <em>version</em> or <em>standard</em> of C we are programming with. This lets the compiler ensure our code is standardised, so that people with different operating systems or compilers will be able to use our code.</p>

<p>If successful you should see the output file in the current directory. This can be run by typing <code>./hello_world</code> (or just <code>hello_world</code> on Windows). If everything is correct you should see a friendly <code>Hello, world!</code> message appear.</p>

<p><strong>Congratulations!</strong> You've just compiled and run your first C program.</p>


<h2 id='errors'>Errors</h2> <hr/>

<p>If there are some problems with your C program the compilation process may fail. These issues can range from simple syntax errors, to other complicated problems that are harder to understand.</p>

<p>Sometimes the error message from the compiler will make sense, but if you are having trouble understanding it try searching online for it. You should see if you can find a concise explanation of what it means, and work out how to correct it. Remember this: there are many people before you who have struggled with exactly the same problems.</p>

<div class='pull-left alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/smash.png" alt="smash" class="img-responsive" width="281px" height="220px"/>
  <p><small>Rage &bull; A poor debugging technique</small></p>
</div>

<p>Sometimes there will be many compiler errors stemming from one source. Always go through compiler errors from first to last.</p>

<p>Sometimes the compiler will compile a program, but when you run it it will crash. Debugging C programs in this situation is hard. It can be an art far beyond the scope of this book.</p>

<p>If you are a beginner, the first port of call for debugging a crashing C program would be to print out lots of information as the program is running. Using this method you should try to isolate exactly what part of the code is incorrect and what, if anything, is going wrong. It is a debugging technique which is <em>active</em>. This is the important thing. As long as you are doing <em>something</em>, and not just staring at the code, the process is less painful and the temptation to give up is lessened.</p>

<p>For people feeling more confident a program called <code>gdb</code> can be used to debug your C programs. This can be difficult and complicated to use, but it is also very powerful and can give you extremely valuable information and what went wrong and where. Information on how to use <code>gdb</code> can be found <a href="http://web.archive.org/web/20140910051410/http://www.dirac.org/linux/gdb/">online</a>.</p>

<p>On <strong>Mac</strong> the most recent versions of OS X don't come with <code>gdb</code>. Instead you can use <code>lldb</code> which does largely the same job.</p>

<p>On <strong>Linux</strong> or <strong>Mac</strong> <code>valgrind</code> can be used to aid the debugging of memory leaks and other more nasty errors. Valgrind is a tool that can save you hours, or even days, of debugging. It does not take much to get proficient at it, so investigating it is highly recommended. Information on how to use it can be found <a href="http://www.cprogramming.com/debugging/valgrind.html">online</a>.</p>


<h2 id='documentation'>Documentation</h2> <hr/>

<p>Through this book you may come across a function in some example code that you don't recognise. You might wonder what it does. In this case you will want to look at the <a href="http://en.cppreference.com/w/c">online documentation</a> of the standard library. This will explain all the functions included in the standard library, what they do, and how to use them.</p>


<h2>Reference</h2> <hr/>

<div class="alert alert-warning">
  <p><strong>What is this section for?</strong></p>

  <p>In this section I'll link to the code I've written for this particular chapter of the book. When finishing with a chapter your code should probably look similar to mine. This code can be used for reference if the explanation has been unclear.</p>

  <p>If you encounter a bug please do not copy and paste my code into your project. Try to track down the bug yourself and use my code as a reference to highlight what may be wrong, or where the error may lie.</p>
</div>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <p><strong>What is this section for?</strong></p>

  <p>In this section I'll list some things to try for fun, and learning.</p>

  <p>It is good if you can attempt to do some of these challenges. Some will be difficult and some will be much easier. For this reason don't worry if you can't figure them all out. Some might not even be possible!</p>

  <p>Many will require some research on the internet. This is an integral part of learning a new language so should not be avoided. The ability to teach yourself things is one of the most valuable skills in programming.</p>
</div>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Change the <code>Hello World!</code> greeting given by your program to something different.</li>
    <li class="list-group-item">&rsaquo; What happens when no <code>main</code> function is given?</li>
    <li class="list-group-item">&rsaquo; Use the online documentation to lookup the <code>puts</code> function.</li>
    <li class="list-group-item">&rsaquo; Look up how to use <code>gdb</code> and run it with your program.</li>
  </ul>
</div>

<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter1_introduction"><h4>&lsaquo; Introduction</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter3_basics"><h4>Basics &rsaquo;</h4></a></td>
  </tr>
</table>