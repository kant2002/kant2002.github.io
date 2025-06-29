---
layout: page
title: Побудуй свій Лісп на С
permalink: /byol-c/chapter7_evaluation/
---

<h1>Evaluation <small>&bull; Chapter 7</small></h1>


<h2 id='trees'>Trees</h2> <hr/>

<p>Now we can read input, and we have it structured internally, but we are still unable to evaluate it. In this chapter we add the code that evaluates this structure and actually performs the computations encoded within.</p>

<p>This internal structure is what we saw printed out by the program in the previous chapter. It is called an <em>Abstract Syntax Tree</em>, and it represents the structure of the program based on the input entered by the user. At the leaves of this tree are numbers and operators - the actual data to be processed. At the branches are the rules used to produce this part of the tree - the information on how to traverse and evaluate it.</p>

<div class='pull-left alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/tree.png" alt="tree" class="img-responsive" width="303px" height="512px"/>
  <p><small>Abstract Christmas Tree &bull; A seasonal variation</small></p>
</div>

<p>Before working out exactly how we are going to do this traversal, let's see exactly how this structure is defined internally. If we peek inside <code>mpc.h</code> we can have a look at the definition of <code>mpc_ast_t</code>, which is the data structure we got from the parse.</p>

<pre style='margin-left: 375px;'><code data-language='c'>typedef struct mpc_ast_t {
  char* tag;
  char* contents;
  mpc_state_t state;
  int children_num;
  struct mpc_ast_t** children;
} mpc_ast_t;</code></pre>

<p>This struct has a number of fields we can access. Let's take a look at them one by one.</p>

<p>The first field is <code>tag</code>. When we printed out the tree this was the information that preceded the contents of the node. It was a string containing a list of all the rules used to parse that particular item. For example <code>expr|number|regex</code>.</p>

<p>This <code>tag</code> field is going to be important as it lets us see what parse rules have been used to create the node.</p>

<p>The second field is <code>contents</code>. This will contain the actual contents of the node such as <code>'*'</code>, <code>'('</code> or <code>'5'</code>. You'll notice for branches this is empty, but for leaves we can use it to find the operator or number to use.</p>

<p>The next field is <code>state</code>. This contains information about what state the parser was in when it found this node, such as the line and column number. We won't make use of this in our program.</p>

<p>Finally we see two fields that are going to help us traverse the tree. These are <code>children_num</code> and <code>children</code>. The first field tells us how many children a node has, and the second is an array of these children.</p>

<p>The type of the <code>children</code> field is <code>mpc_ast_t**</code>. This is a double pointer type. It isn't as scary as it looks and will be explained in greater detail in later chapters. For now you can think of it as a list of the child nodes of this tree.</p>

<p>We can access a child node by accessing this field using array notation. This is done by writing the field name <code>children</code> and suffixing it with square brackets containing the index of the child to access. For example to access the first child of the node we can use <code>children[0]</code>. Notice that C counts its array indices from <code>0</code>.</p>

<p>Because the type <code>mpc_ast_t*</code> is a <em>pointer</em> to a struct, there is a slightly different syntax to access its fields. We need to use an arrow <code>-></code> instead of a dot <code>.</code>. There is no fundamental reason for this switch in operators, so for now just remember that field access of pointer types uses an arrow.</p>

<pre><code data-language='c'>/* Load AST from output */
mpc_ast_t* a = r.output;
printf("Tag: %s\n", a-&gt;tag);
printf("Contents: %s\n", a-&gt;contents);
printf("Number of children: %i\n", a-&gt;children_num);

/* Get First Child */
mpc_ast_t* c0 = a-&gt;children[0];
printf("First Child Tag: %s\n", c0-&gt;tag);
printf("First Child Contents: %s\n", c0-&gt;contents);
printf("First Child Number of children: %i\n",
  c0-&gt;children_num);
</code></pre>


<h2 id='recursion'>Recursion</h2> <hr/>

<p>There is an odd thing about this tree structure. It refers to itself. Each of its children are themselves trees again, and the children of those children are trees yet again. Just like our languages and re-write rules, data in this structure contains repeated substructures that resemble their parents.</p>

<div class='pull-right alert alert-warning' style="margin: 15px; text-align: center;">
  <img src="/byol-c/static/img/recursion.png" alt="recursion" class="img-responsive" width="302px" height="371px"/>
  <p><small>Recursion &bull; Dangerous in a fire.</small></p>
</div>

<p>This pattern of repeated substructures could go on and on. Clearly if we want a function which can work on all possible trees we can't look just a couple of nodes down, we have to define it to work on trees of any depth.</p>

<p>Luckily we can do this, by exploiting the nature of how these substructures repeat and using a technique called <em>recursion</em>.</p>

<p>Put simply a <em>recursive function</em> is one that calls itself as some part of its calculation.</p>

<p>It sounds weird for a function to be defined in terms of itself. But consider that functions can give different outputs when supplied with different inputs. If we give changed, or different inputs to a recursive call to the same function, and provide a way for this function to not call itself again under certain conditions, we can be more confident this <em>recursive function</em> is doing something useful.</p>

<p>As an example we can write a recursive function which will count the number of nodes in our tree structure.</p>

<p>To begin we work out how it will act in the most simple case - if the input tree has no children. In this case we know the result is simply one. Now we can go on to define the more complex case - if the tree has one or more children. In this case the result will be one (for the node itself), plus the number of nodes in all of those children.</p>

<p>But how do we find the number of nodes in all of the children? Well we can use the function we are in the process of defining! <em>Yeah, Recursion.</em></p>

<p>In C we might write it something like this.</p>

<pre><code data-language='C'>int number_of_nodes(mpc_ast_t* t) {
  if (t-&gt;children_num == 0) { return 1; }
  if (t-&gt;children_num &gt;= 1) {
    int total = 1;
    for (int i = 0; i < t->children_num; i++) {
      total = total + number_of_nodes(t-&gt;children[i]);
    }
    return total;
  }
  return 0;
}</code></pre>

<p>Recursive functions are weird because they require an odd leap of faith. First we have to assume we have a function which does something correctly already, and then we have to go about using this function, to write the initial function we assumed we had!</p>

<p>Like most things, recursive functions almost always end up following a similar pattern. First a <em>base case</em> is defined. This is the case that ends the recursion, such as <code>t->children_num == 0</code> in our previous example. After this the <em>recursive case</em> is defined, such as <code>t->children_num >= 1</code> in our previous example, which breaks down a computation into smaller parts, and calls itself recursively to compute those parts, before combining them together.</p>

<p>Recursive functions can take some thought, so pause now and ensure you understand them before continuing onto other chapters because we'll be making good use of them in the rest of the book. If you are still uncertain, you can attempt some of the bonus marks for this chapter.</p>


<h2 id='evaluation'>Evaluation</h2> <hr/>

<p>To evaluate the parse tree we are going to write a recursive function. But before we get started, let us try and see what observations we can make about the structure of the tree we get as input. Try printing out some expressions using your program from the previous chapter. What do you notice?</p>

<pre><code data-language='lispy'>lispy&gt; * 10 (+ 1 51)
&gt;
  regex
  operator|char:1:1 '*'
  expr|number|regex:1:3 '10'
  expr|&gt;
    char:1:6 '('
    operator|char:1:7 '+'
    expr|number|regex:1:9 '1'
    expr|number|regex:1:11 '51'
    char:1:13 ')'
  regex
</code></pre>

<p>One observation is that if a node is tagged with <code>number</code> it is always a number, has no children, and we can just convert the contents to an integer. This will act as the <em>base case</em> in our recursion.</p>

<p>If a node is tagged with <code>expr</code>, and is <em>not</em> a <code>number</code>, we need to look at its second child (the first child is always <code>'('</code>) and see which operator it is. Then we need to apply this operator to the <em>evaluation</em> of the remaining children, excluding the final child which is always <code>')'</code>. This is our <em>recursive case</em>. This also needs to be done for the root node.</p>

<p>When we evaluate our tree, just like when counting the nodes, we'll need to accumulate the result. To represent this result we'll use the C type <code>long</code> which means a <em>long</em> <em>integer</em>.</p>

<p>To detect the tag of a node, or to get a number from a node, we will need to make use of the <code>tag</code> and <code>contents</code> fields. These are <em>string</em> fields, so we are going to have to learn a couple of string functions first.</p>

<table class='table'>
  <tr><td><code>atoi</code></td><td>Converts a <code>char*</code> to a <code>int</code>.</td></tr>
  <tr><td><code>strcmp</code></td><td>Takes as input two <code>char*</code> and if they are equal it returns <code>0</code>.</td></tr>
  <tr><td><code>strstr</code></td><td>Takes as input two <code>char*</code> and returns a pointer to the location of the second in the first, or <code>0</code> if the second is not a sub-string of the first.</td></tr>
</table>

<p>We can use <code>strcmp</code> to check which operator to use, and <code>strstr</code> to check if a tag contains some substring. Altogether our recursive evaluation function looks like this.</p>

<pre><code data-language='c'>long eval(mpc_ast_t* t) {

  /* If tagged as number return it directly. */
  if (strstr(t-&gt;tag, "number")) {
    return atoi(t-&gt;contents);
  }

  /* The operator is always second child. */
  char* op = t-&gt;children[1]-&gt;contents;

  /* We store the third child in `x` */
  long x = eval(t-&gt;children[2]);

  /* Iterate the remaining children and combining. */
  int i = 3;
  while (strstr(t-&gt;children[i]-&gt;tag, "expr")) {
    x = eval_op(x, op, eval(t-&gt;children[i]));
    i++;
  }

  return x;
}</code></pre>

<p>We can define the <code>eval_op</code> function as follows. It takes in a number, an operator string, and another number. It tests for which operator is passed in, and performs the corresponding C operation on the inputs.</p>

<pre><code data-language='c'>/* Use operator string to see which operation to perform */
long eval_op(long x, char* op, long y) {
  if (strcmp(op, "+") == 0) { return x + y; }
  if (strcmp(op, "-") == 0) { return x - y; }
  if (strcmp(op, "*") == 0) { return x * y; }
  if (strcmp(op, "/") == 0) { return x / y; }
  return 0;
}</code></pre>


<h2 id='printing'>Printing</h2> <hr/>

<p>Instead of printing the tree, we now want to print the result of the evaluation. Therefore we need to pass the tree into our <code>eval</code> function, and print the result we get using <code>printf</code> and the specifier <code>%li</code>, which is used for <code>long</code> type.</p>

<p>We also need to remember to delete the output tree after we are done evaluating it.</p>

<pre><code data-language='c'>long result = eval(r.output);
printf("%li\n", result);
mpc_ast_delete(r.output);</code></pre>

<p>If all of this is successful we should be able to do some basic maths with our new programming language!</p>

<pre><code data-language='lispy'>Lispy Version 0.0.0.0.3
Press Ctrl+c to Exit

lispy&gt; + 5 6
11
lispy&gt; - (* 10 10) (+ 1 1 1)
97</code></pre>


<h2>Reference</h2> <hr/>

<references />

<h2>Bonus Marks</h2> <hr/>

<div class="alert alert-warning">
  <ul class="list-group">
    <li class="list-group-item">&rsaquo; Write a recursive function to compute the number of leaves of a tree.</li>
    <li class="list-group-item">&rsaquo; Write a recursive function to compute the number of branches of a tree.</li>
    <li class="list-group-item">&rsaquo; Write a recursive function to compute the most number of children spanning from one branch of a tree.</li>
    <li class="list-group-item">&rsaquo; How would you use <code>strstr</code> to see if a node was tagged as an <code>expr</code>?</li>
    <li class="list-group-item">&rsaquo; How would you use <code>strcmp</code> to see if a node had the contents <code>'('</code> or <code>')'</code>?</li>
    <li class="list-group-item">&rsaquo; Add the operator <code>%</code>, which returns the remainder of division. For example <code>% 10 6</code> is <code>4</code>.</li>
    <li class="list-group-item">&rsaquo; Add the operator <code>^</code>, which raises one number to another. For example <code>^ 4 2</code> is <code>16</code>.</li>
    <li class="list-group-item">&rsaquo; Add the function <code>min</code>, which returns the smallest number. For example <code>min 1 5 3</code> is <code>1</code>.</li>
    <li class="list-group-item">&rsaquo; Add the function <code>max</code>, which returns the biggest number. For example <code>max 1 5 3</code> is <code>5</code>.</li>
    <li class="list-group-item">&rsaquo; Change the minus operator <code>-</code> so that when it receives one argument it negates it.</li>
  </ul>
</div>


<h2>Navigation</h2>

<table class="table" style='table-layout: fixed;'>
  <tr>
    <td class="text-left"><a href="../chapter6_parsing"><h4>&lsaquo; Parsing</h4></a></td>
    <td class="text-center"><a href="../"><h4>&bull; Contents &bull;</h4></a></td>
    <td class="text-right"><a href="../chapter8_error_handling"><h4>Error Handling &rsaquo;</h4></a></td>
  </tr>
</table>