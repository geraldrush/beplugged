/* COS1511 curriculum.
   Follows the lesson order of the UNISA study guide (Ken Halland, School of
   Computing), so a student can work top to bottom from never having written a
   line of code to sitting the exam.

   Each item is either a LESSON (teach, then a task to write) or an EXAM
   question taken from a past paper. Lessons still to be written are marked
   pending, so the path ahead is visible rather than hidden. */

const CURRICULUM = [
  /* ================= SETUP ================= */
  {
    id: "setup",
    part: "Start here",
    title: "Set up the compiler",
    setup: true,
    teach: [
      { type: "p", text: "This page runs a real C++ compiler inside your browser. Nothing is sent to a server: your code is compiled on your own machine, which means it keeps working offline and costs nothing to use." },
      { type: "p", text: "The trade is that the compiler has to be downloaded once, and it is not small." },
      { type: "list", items: [
        "About 100MB, downloaded once and then kept on this device",
        "Use a computer if you can, and wifi rather than mobile data",
        "It takes a few minutes on a normal connection",
        "After this, everything is instant and works with no connection at all",
      ] },
      { type: "note", text: "Do this once, now, on wifi. If you wait and press Run in the middle of a lesson, you will be sitting through the download then instead." },
      { type: "p", text: "Press the button below and leave the tab open. You can read Lesson 1 while it works." },
    ],
    starter:
`// Nothing to write here yet.
//
// Press "Download the compiler" on the right.
// When it finishes, open Lesson 1 and start writing C++.
`,
  },

  /* ================= PART I ================= */
  {
    id: "l1-first",
    part: "Part I · Starting to program",
    lesson: 1,
    title: "Your first program",
    teach: [
      { type: "p", text: "Every C++ program you write in this module has the same skeleton. Learn it once and you never think about it again." },
      { type: "code", label: "The skeleton", text:
"#include <iostream>\nusing namespace std;\n\nint main()\n{\n    // your statements go here\n    return 0;\n}" },
      { type: "list", items: [
        "#include <iostream> brings in the ability to read and print.",
        "using namespace std; lets you write cout instead of std::cout.",
        "int main() is where the computer starts. Every program has exactly one.",
        "return 0; tells the operating system the program finished successfully.",
        "Every statement ends with a semicolon. Missing one is the most common error you will make.",
      ] },
      { type: "p", text: "cout sends things to the screen. The << is a stream operator, and you can chain as many as you like. endl ends the line." },
      { type: "code", label: "Printing", text:
'cout << "Hello" << endl;\ncout << "Two" << " parts" << endl;' },
    ],
    task: "Print your own name on one line, then the words I am learning C++ on a second line.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    // Print your name, then a second line

    return 0;
}
`,
  },

  {
    id: "l2-integers",
    part: "Part I · Starting to program",
    lesson: 2,
    title: "Integers and arithmetic",
    teach: [
      { type: "p", text: "An int holds a whole number: 7, 0, -25. It cannot hold 3.5." },
      { type: "code", label: "The operators", text:
"+   add\n-   subtract\n*   multiply\n/   divide\n%   remainder (modulus)" },
      { type: "p", text: "Two things about integer arithmetic catch everybody out, and both are examined." },
      { type: "note", text: "7 / 2 is 3, not 3.5. When both sides are integers, C++ throws the fraction away." },
      { type: "note", text: "% gives what is left over. 19 % 5 is 4. This is how you test whether a number is even: n % 2 == 0." },
      { type: "p", text: "Watch out with negatives: in C++ -9 % 2 is -1, not 1. That matters in one of the exam questions later." },
    ],
    task: "Read two whole numbers. Print their sum, their difference, their product, the result of dividing the first by the second, and the remainder.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int a, b;

    cout << "Enter two whole numbers: ";
    cin >> a >> b;

    // Print sum, difference, product, quotient and remainder

    return 0;
}
`,
    sampleInput: "19 5\n",
  },

  {
    id: "l3-variables",
    part: "Part I · Starting to program",
    lesson: 3,
    title: "Variables",
    teach: [
      { type: "p", text: "A variable is a named box in memory. You must declare it, saying what type it holds, before you can use it." },
      { type: "code", label: "Declaring", text:
"int count;              // declared, value is rubbish\nint total = 0;          // declared and initialised\nint x, y, z;            // three at once\nconst int LIMIT = 10;   // cannot be changed later" },
      { type: "note", text: "A variable you declare but never give a value to contains whatever junk was in that memory. Reading it gives an unpredictable answer. One of the exam questions tests exactly this." },
      { type: "p", text: "Names must start with a letter, and cannot be a C++ reserved word. Choose names that say what the thing is: totalMarks beats t." },
      { type: "p", text: "cin reads from the keyboard into a variable. The >> points the other way to cout's <<, because the data flows the other way." },
      { type: "code", label: "Reading", text:
'int age;\ncout << "Enter your age: ";\ncin >> age;' },
    ],
    task: "Ask for a person's age in years. Work out roughly how many months and how many days that is, and print all three.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int years;

    // Ask for the age and read it

    // Work out months and days, then print all three

    return 0;
}
`,
    sampleInput: "21\n",
  },

  {
    id: "l4-assignment",
    part: "Part I · Starting to program",
    lesson: 4,
    title: "Assignment statements",
    teach: [
      { type: "p", text: "The = sign does not mean equals. It means work out the right hand side, then put the answer in the box on the left." },
      { type: "code", label: "Read it right to left", text:
"total = 0;          // put 0 in total\ntotal = total + 5;  // work out total + 5, put the answer back in total\ncount++;            // shorthand for count = count + 1\ntotal += 5;         // shorthand for total = total + 5" },
      { type: "note", text: "total = total + 5 is nonsense as mathematics but perfectly ordinary as an instruction. This is the single biggest mental leap in Lesson 4." },
      { type: "p", text: "Because it is an instruction and not a statement of fact, the order matters. Doing them in a different order gives a different answer." },
    ],
    task: "Start with a total of 0. Read three marks, adding each one to the total as you read it. Then print the total and the average.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int total = 0;
    int mark;

    // Read three marks, adding each to total

    // Print the total, then the average

    return 0;
}
`,
    sampleInput: "60\n75\n48\n",
  },

  {
    id: "l5-tracing",
    part: "Part I · Starting to program",
    lesson: 5,
    title: "Tracing what a program does",
    teach: [
      { type: "p", text: "Before running a program, you should be able to say what it will print. The exam asks this directly: it shows you code and asks for the output." },
      { type: "p", text: "The method is to keep a table of every variable and update it one line at a time, in order, exactly as the computer would." },
      { type: "code", label: "Trace this by hand first", text:
"int x, y, z;\ny = 10;\nz = 3;\nx = y * z - 3;" },
      { type: "p", text: "Line by line: y becomes 10. z becomes 3. Then y * z is 30, minus 3 is 27, so x becomes 27." },
      { type: "note", text: "Do the tracing on paper before you press Run. If your answer and the program's answer differ, you have learned something. If you run it first, you have learned nothing." },
    ],
    task: "Type the fragment above into a program, predict the output on paper, then print x and check whether you were right.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int x, y, z;
    y = 10;
    z = 3;
    x = y * z - 3;

    // Predict the value first, then print it

    return 0;
}
`,
    expectedOutput: "27",
  },

  {
    id: "l6-floats",
    part: "Part I · Starting to program",
    lesson: 6,
    title: "Floating point numbers",
    teach: [
      { type: "p", text: "A float or a double holds a number with a fractional part: 3.5, 0.14, -27.9. Use double unless told otherwise; it is more accurate." },
      { type: "p", text: "Mixing types changes the answer. If either side of a division is floating point, the fraction is kept." },
      { type: "code", label: "The difference", text:
"int a = 7, b = 2;\ncout << a / b;               // 3\n\ndouble c = 7.0, d = 2.0;\ncout << c / d;               // 3.5\n\ncout << 7 / 2.0;             // 3.5, because one side is a double" },
      { type: "p", text: "By default C++ prints as few decimals as it can. To force a fixed number, which the exam asks for, you need <iomanip>." },
      { type: "code", label: "Two decimal places", text:
"#include <iomanip>\n\ncout << fixed << setprecision(2);\ncout << 3.14159 << endl;     // 3.14" },
      { type: "note", text: "fixed and setprecision stay switched on until you change them, so you usually set them once before printing." },
    ],
    task: "Read a price and a tax percentage. Print the tax amount and the total, both to exactly two decimal places.",
    starter:
`#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    double price, taxPercent;

    cout << "Enter the price: ";
    cin >> price;
    cout << "Enter the tax percentage: ";
    cin >> taxPercent;

    // Set two decimal places, then work out and print the tax and the total

    return 0;
}
`,
    sampleInput: "249.99\n15\n",
  },

  {
    id: "l7-strings",
    part: "Part I · Starting to program",
    lesson: 7,
    title: "Strings and characters",
    teach: [
      { type: "p", text: "A char holds exactly one character in single quotes: 'A', '7', '?'. A string holds any number of them in double quotes." },
      { type: "code", label: "Both types", text:
'#include <string>\n\nchar grade = \'A\';\nstring name = "Thandi";' },
      { type: "note", text: "cin >> name stops at the first space, so it reads Thandi out of Thandi Nkosi and leaves the rest behind. To read a whole line including spaces, use getline." },
      { type: "code", label: "Reading a full line", text:
'string fullName;\ngetline(cin, fullName);' },
      { type: "p", text: "Strings can be joined with + and measured with .size(). There are more member functions, and Lesson 27 covers them properly." },
      { type: "p", text: "Some characters cannot be typed directly, so they are written with a backslash." },
      { type: "code", label: "Escape characters", text:
'\\n   new line\n\\t   tab\n\\"   a double quote\n\\\\   a single backslash' },
    ],
    task: "Read a full name including the space. Print a greeting using it, and say how many characters long it is.",
    starter:
`#include <iostream>
#include <string>
using namespace std;

int main()
{
    string fullName;

    cout << "Enter your full name: ";
    // Read the whole line, spaces included

    // Greet them, then print how many characters the name has

    return 0;
}
`,
    sampleInput: "Thandi Nkosi\n",
  },

  /* ============ THE PATH AHEAD ============ */
  { part: "Part II · Conditional execution", lesson: 8, title: "If statements", pending: true },
  { part: "Part II · Conditional execution", lesson: 9, title: "While loops", pending: true },
  { part: "Part II · Conditional execution", lesson: 10, title: "Program debugging", pending: true },
  { part: "Part II · Conditional execution", lesson: 11, title: "Boolean values", pending: true },
  { part: "Part II · Conditional execution", lesson: 12, title: "Nested if statements", pending: true },
  { part: "Part II · Conditional execution", lesson: 13, title: "Switch statements", pending: true },
  { part: "Part II · Conditional execution", lesson: 14, title: "More while loops", pending: true },
  { part: "Part II · Conditional execution", lesson: 15, title: "For loops", pending: true },
  { part: "Part II · Conditional execution", lesson: 16, title: "Nested loops", pending: true },

  { part: "Part III · Functions", lesson: 17, title: "Using functions", pending: true },
  { part: "Part III · Functions", lesson: 18, title: "Writing functions", pending: true },
  { part: "Part III · Functions", lesson: 19, title: "Local and global variables", pending: true },
  { part: "Part III · Functions", lesson: 20, title: "Void functions", pending: true },
  { part: "Part III · Functions", lesson: 21, title: "Reference parameters, part 1", pending: true },
  { part: "Part III · Functions", lesson: 22, title: "Reference parameters, part 2", pending: true },
  { part: "Part III · Functions", lesson: 23, title: "Variable diagrams again", pending: true },

  { part: "Part IV · Data structures", lesson: 24, title: "One-dimensional arrays", pending: true },
  { part: "Part IV · Data structures", lesson: 25, title: "Arrays as parameters", pending: true },
  { part: "Part IV · Data structures", lesson: 26, title: "Two-dimensional arrays", pending: true },
  { part: "Part IV · Data structures", lesson: 27, title: "String manipulation", pending: true },
  { part: "Part IV · Data structures", lesson: 28, title: "Structs", pending: true },
  { part: "Part IV · Data structures", lesson: 29, title: "Arrays of structs", pending: true },
  { part: "Part IV · Data structures", lesson: 30, title: "Classes", pending: true },
];

/* Past paper questions, kept as the last stage: once the lessons are done,
   these are what the exam actually looks like. */
const EXAM_PART = "Exam practice · past papers";
