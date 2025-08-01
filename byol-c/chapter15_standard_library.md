---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter15_standard_library
---

<h1>Standard Library <small>&bull; Chapter 15</small></h1>

<h2 id='minimalism'>Minimalism</h2> <hr/>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/library.png" alt="library" class="img-responsive" width="299px" height="444px"/>
  <p><small>Library &bull; Built with just leather, paper, wood, and ink.</small></p>
</div>

<p>The Lisp we've built has been purposefully minimal. We've only added the fewest number of core structures and builtins. If we chose these carefully, as we did, then it should allow us to add in everything else required to the language.</p>

<p>The motivation behind minimalism is two-fold. The first advantage is that it makes the core language simple to debug and easy to learn. This is a great benefit to developers and users. Like <a href="http://en.wikipedia.org/wiki/Occam%27s_razor">Occam's Razor</a> it is almost always better to trim away any waste if it results in a equally expressive language. The second reason is that having a small language is also aesthetically nicer. It is clever, interesting and fun to see how small we can make the core of a language, and still get something useful out of the other side. As hackers, which we should be by now, this is something we enjoy.</p>


<h2 id='atoms'>Atoms</h2> <hr/>

<p>When dealing with conditionals we added no new boolean type to our language. Because of this we didn't add <code>true</code> or <code>false</code> either. Instead we just used numbers. Readability is still important though, so we can define some constants to represent these values.</p>

<p>On a similar note, many lisps use the word <code>nil</code> to represent the empty list <code>{}</code>. We can add this in too. These constants are sometimes called <em>atoms</em> because they are fundamental and constant.</p>

<p>The user is not forced to use these named constants, and can use numbers and empty lists instead as they like. This choice empowers users, something we believe in.</p>


<pre><code data-language='lispy'>; Atoms
(def {nil} {})
(def {true} 1)
(def {false} 0)</code></pre>


<h2 id='building_blocks'>Building Blocks</h2> <hr/>

<p>We've already come up with a number of cool functions I've been using in the examples. One of these is our <code>fun</code> function that allows us to declare functions in a neater way. We should definitely include this in our standard library.</p>

<pre><code data-language='lispy'>; Function Definitions
(def {fun} (\ {f b} {
  def (head f) (\ (tail f) b)
}))</code></pre>

<p>We also had our <code>unpack</code> and <code>pack</code> functions. These too are going to be essential for users. We should include these along with their <code>curry</code> and <code>uncurry</code> aliases.</p>


<pre><code data-language='lispy'>; Unpack List for Function
(fun {unpack f l} {
  eval (join (list f) l)
})

; Pack List for Function
(fun {pack f &amp; xs} {f xs})

; Curried and Uncurried calling
(def {curry} unpack)
(def {uncurry} pack)</code></pre>

<p>Say we want to do several things in order. One way we can do this is to put each thing to do as an argument to some function. We know that arguments are evaluated in order from left to right, which is essentially sequencing events. For functions such as <code>print</code> and <code>load</code> we don't care much about what it evaluates to, but do care about the order in which it happens.</p>

<p>Therefore we can create a <code>do</code> function which evaluates a number of expressions in order and returns the last one. This relies on the <code>last</code> function, which returns the final element of a list. We'll define this later.</p>

<pre><code data-language='lispy'>; Perform Several things in Sequence
(fun {do &amp; l} {
  if (== l nil)
    {nil}
    {last l}
})</code></pre>

<p>Sometimes we want to save results to local variables using the <code>=</code> operator. When we're inside a function this will implicitly only save results locally, but sometimes we want to open up an even more local scope. For this we can create a function <code>let</code> which creates an empty function for code to take place in, and evaluates it.</p>

<pre><code data-language='lispy'>; Open new scope
(fun {let b} {
  ((\ {_} b) ())
})</code></pre>

<p>We can use this in conjunction with <code>do</code> to ensure that variables do not leak out of their scope.</p>

<pre><code data-language='lispy'>lispy&gt; let {do (= {x} 100) (x)}
100
lispy&gt; x
Error: Unbound Symbol 'x'
lispy&gt;</code></pre>


<h2 id='logical_operators'>Logical Operators</h2> <hr/>

<p>We didn't define any local operators such as <code>and</code> and <code>or</code> in our language. This might be a good thing to add in later. For now we can use arithmetic operators to emulate them. Think about how these functions work when encountering <code>0</code> or <code>1</code> for their various inputs.</p>

<pre><code data-language='lispy'>; Logical Functions
(fun {not x}   {- 1 x})
(fun {or x y}  {+ x y})
(fun {and x y} {* x y})</code></pre>


<h2 id='miscellaneous_functions'>Miscellaneous Functions</h2> <hr/>

<p>Here are a couple of miscellaneous functions that don't really fit in anywhere. See if you can guess their intended functionality.</p>

<pre><code data-language='lispy'>(fun {flip f a b} {f b a})
(fun {ghost &amp; xs} {eval xs})
(fun {comp f g x} {f (g x)})</code></pre>

<p>The <code>flip</code> function takes a function <code>f</code> and two arguments <code>a</code> and <code>b</code>. It then applies <code>f</code> to <code>a</code> and <code>b</code> in the reversed order. This might be useful when we want a function to be <em>partially evaluated</em>. If we want to partially evaluate a function by only passing it in it's second argument we can use <code>flip</code> to give us a new function that takes the first two arguments in reversed order.</p>

<p>This means if you want to apply the second argument of a function you can just apply the first argument to the <code>flip</code> of this function.</p>

<pre><code data-language='lispy'>lispy&gt; (flip def) 1 {x}
()
lispy&gt; x
1
lispy&gt; def {define-one} ((flip def) 1)
()
lispy&gt; define-one {y}
()
lispy&gt; y
1
lispy>
</code></pre>

<p>I couldn't think of a use for the <code>ghost</code> function, but it seemed interesting. It simply takes in any number of arguments and evaluates them as if they were the expression itself. So it just sits at the front of an expression like a ghost, not interacting with or changing the behaviour of the program at all. If you can think of a use for it I'd love to hear.</p>

<pre><code data-language='lispy'>lispy&gt; ghost + 2 2
4
</code></pre>

<p>The <code>comp</code> function is used to compose two functions. It takes as input <code>f</code>, <code>g</code>, and an argument to <code>g</code>. It then applies this argument to <code>g</code> and applies the result again to <code>f</code>. This can be used to compose two functions together into a new function that applies both of them in series. Like before, we can use this in combination with partial evaluation to build up complex functions from simpler ones.</p>

<p>For example we can compose two functions. One negates a number and another unpacks a list of numbers for multiplying together with <code>*</code>.</p>

<pre><code data-language='lispy'>lispy&gt; (unpack *) {2 2}
4
lispy&gt; - ((unpack *) {2 2})
-4
lispy&gt; comp - (unpack *)
(\ {x} {f (g x)})
lispy&gt; def {mul-neg} (comp - (unpack *))
()
lispy&gt; mul-neg {2 8}
-16
lispy&gt;
</code></pre>


<h2 id='list_functions'>List Functions</h2> <hr/>

<p>The <code>head</code> function is used to get the first element of a list, but what it returns is still wrapped in the list. If we want to actually get the element out of this list we need to extract it somehow.</p>

<p>Single element lists evaluate to just that element, so we can use the <code>eval</code> function to do this extraction. We can also define a couple of helper functions for aid extracting the first, second and third elements of a list. We'll use these function more later.</p>

<pre><code data-language='lispy'>; First, Second, or Third Item in List
(fun {fst l} { eval (head l) })
(fun {snd l} { eval (head (tail l)) })
(fun {trd l} { eval (head (tail (tail l))) })</code></pre>

<p>We looked briefly at some recursive list functions a few chapters ago. Naturally there are many more we can define using this technique.</p>

<p>To find the length of a list we can recursive over it adding <code>1</code> to the length of the tail. To find the <code>nth</code> element of a list we can perform the <code>tail</code> operation and count down until we reach <code>0</code>. To get the last element of a list we can just access the element at the length minus one.</p>

<pre><code data-language='lispy'>; List Length
(fun {len l} {
  if (== l nil)
    {0}
    {+ 1 (len (tail l))}
})</code></pre>

<pre><code data-language='lispy'>; Nth item in List
(fun {nth n l} {
  if (== n 0)
    {fst l}
    {nth (- n 1) (tail l)}
})</code></pre>

<pre><code data-language='lispy'>; Last item in List
(fun {last l} {nth (- (len l) 1) l})</code></pre>

<p>There are lots of other useful functions that follow this same pattern. We can define functions for taking and dropping the first so many elements of a list, or functions for checking if a value is an element of a list.</p>

<pre><code data-language='lispy'>; Take N items
(fun {take n l} {
  if (== n 0)
    {nil}
    {join (head l) (take (- n 1) (tail l))}
})</code></pre>

<pre><code data-language='lispy'>; Drop N items
(fun {drop n l} {
  if (== n 0)
    {l}
    {drop (- n 1) (tail l)}
})</code></pre>

<pre><code data-language='lispy'>; Split at N
(fun {split n l} {list (take n l) (drop n l)})</code></pre>

<pre><code data-language='lispy'>; Element of List
(fun {elem x l} {
  if (== l nil)
    {false}
    {if (== x (fst l)) {true} {elem x (tail l)}}
})
</code></pre>

<p>These functions all follow similar patterns. It would be great if there was some way to extract this pattern so we don't have to type it out every time. For example we may want a way we can perform some function on every element of a list. This is a function we can define called  <code>map</code>. It takes as input some function, and some list. For each item in the list it applies <code>f</code> to that item and appends it back onto the front of the list. It then applies <code>map</code> to the tail of the list.</p>

<pre><code data-language='lispy'>; Apply Function to List
(fun {map f l} {
  if (== l nil)
    {nil}
    {join (list (f (fst l))) (map f (tail l))}
})</code></pre>

<p>With this we can do some neat things that look a bit like looping. In some ways this concept is more powerful than looping. Instead of thinking about performing some function to each element of the list in turn, we can think about acting on all the elements at once. We <em>map the list</em> rather than <em>changing each element</em>.</p>

<pre><code data-language='lispy'>lispy&gt; map - {5 6 7 8 2 22 44}
{-5 -6 -7 -8 -2 -22 -44}
lispy&gt; map (\ {x} {+ x 10}) {5 2 11}
{15 12 21}
lispy&gt; print {"hello" "world"}
{"hello" "world"}
()
lispy&gt; map print {"hello" "world"}
"hello"
"world"
{() ()}
lispy&gt;</code></pre>

<p>An adaptation of this idea is a <code>filter</code> function which, takes in some functional condition, and only includes items of a list which match that condition.</p>

<pre><code data-language='lispy'>; Apply Filter to List
(fun {filter f l} {
  if (== l nil)
    {nil}
    {join (if (f (fst l)) {head l} {nil}) (filter f (tail l))}
})</code></pre>

<p>This is what it looks like in practice.</p>

<pre><code data-language='lispy'>lispy&gt; filter (\ {x} {&gt; x 2}) {5 2 11 -7 8 1}
{5 11 8}</code></pre>

<p>Some loops don't exactly act on a list, but accumulate some total or condense the list into a single value. These are loops such as sums and products. These can be expressed quite similarly to the <code>len</code> function we've already defined.</p>

<p>These are called <em>folds</em> and they work like this. Supplied with a function <code>f</code>, a <em>base value</em> <code>z</code> and a list <code>l</code> they merge each element in the list with the total, starting with the base value.</p>

<pre><code data-language='lispy'>; Fold Left
(fun {foldl f z l} {
  if (== l nil)
    {z}
    {foldl f (f z (fst l)) (tail l)}
})</code></pre>

<p>Using folds we can define the <code>sum</code> and <code>product</code> functions in a very elegant way.</p>

<pre><code data-language='lispy'>(fun {sum l} {foldl + 0 l})
(fun {product l} {foldl * 1 l})</code></pre>


<h2 id='conditional_functions'>Conditional Functions</h2> <hr/>

<p>By defining our <code>fun</code> function we've already shown how powerful our language is in its ability to define functions that look like new syntax. Another example of this is found in emulating the C <code>switch</code> and <code>case</code> statements. In C these are built into the language, but for our language we can define them as part of a library.</p>

<p>We can define a function <code>select</code> that takes in zero or more two-element lists as input. For each two element list in the arguments it first evaluates the first element of the pair. If this is true then it evaluates and returns the second item, otherwise it performs the same thing again on the rest of the list. </p>

<pre><code data-language='lispy'>(fun {select &amp; cs} {
  if (== cs nil)
    {error "No Selection Found"}
    {if (fst (fst cs)) {snd (fst cs)} {unpack select (tail cs)}}
})</code></pre>

<p>We can also define a function <code>otherwise</code> to always evaluate to <code>true</code>. This works a little bit like the <code>default</code> keyword in C.</p>

<pre><code data-language='lispy'>; Default Case
(def {otherwise} true)

; Print Day of Month suffix
(fun {month-day-suffix i} {
  select
    {(== i 0)  "st"}
    {(== i 1)  "nd"}
    {(== i 3)  "rd"}
    {otherwise "th"}
})</code></pre>

<p>This is actually more powerful than the C <code>switch</code> statement. In C rather than passing in conditions the input value is compared only for equality with a number of constant candidates. We can also define this function in our Lisp, where we compare a value to a number of candidates. In this function we take some value <code>x</code> followed by zero or more two-element lists again. If the first element in the two-element list is equal to <code>x</code>, the second element is evaluated, otherwise the process continues down the list.</p>

<pre><code data-language='lispy'>(fun {case x &amp; cs} {
  if (== cs nil)
    {error "No Case Found"}
    {if (== x (fst (fst cs))) {snd (fst cs)} {
      unpack case (join (list x) (tail cs))}}
})</code></pre>

<p>The syntax for this function becomes really nice and simple. Try to see if you can think up any other control structures or useful functions that you'd like to implement using these sorts of methods.</p>

<pre><code data-language='lispy'>(fun {day-name x} {
  case x
    {0 "Monday"}
    {1 "Tuesday"}
    {2 "Wednesday"}
    {3 "Thursday"}
    {4 "Friday"}
    {5 "Saturday"}
    {6 "Sunday"}
})</code></pre>


<h2 id='fibonacci'>Fibonacci</h2> <hr/>

<p>No standard library would be complete without an obligatory definition of the Fibonacci function. Using all of the above things we've defined  we can write a cute little <code>fib</code> function that is really quite readable, and clear semantically.</p>

<pre><code data-language='lispy'>; Fibonacci
(fun {fib n} {
  select
    { (== n 0) 0 }
    { (== n 1) 1 }
    { otherwise (+ (fib (- n 1)) (fib (- n 2))) }
})</code></pre>

<p>This is the end of the standard library I've written. Building up a standard library is a fun part of language design, because you get to be creative and opinionated on what goes in and stays out. Try to come up with something you are happy with. Exploring what is possible to define and do can be very interesting.</p>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Rewrite the <code>len</code> function using <code>foldl</code>.</li>
    <li class="list-group-item">&rsaquo; Rewrite the <code>elem</code> function using <code>foldl</code>.</li>
    <li class="list-group-item">&rsaquo; Incorporate your standard library directly into the language. Make it load at start-up.</li>
    <li class="list-group-item">&rsaquo; Write some documentation for your standard library, explaining what each of the functions do.</li>
    <li class="list-group-item">&rsaquo; Write some example programs using your standard library, for users to learn from.</li>
    <li class="list-group-item">&rsaquo; Write some test cases for each of the functions in your standard library.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter14_strings"><h4>&lsaquo; Strings</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter16_bonus_projects"><h4>Bonus Projects &rsaquo;</h4></a></td>
  </tr>
</table>