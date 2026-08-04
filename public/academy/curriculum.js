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
    title: "How this page works",
    teach: [
      { type: "p", text: "There is nothing to install and nothing to download. Write C++ in the editor on the right, press Run, and a real compiler builds and runs it. It works on a laptop or a phone." },
      { type: "list", items: [
        "The compiler is g++, the same one your assignments are marked against",
        "Errors are shown exactly as the compiler reports them, so you learn to read them",
        "If a question asks the program to read values, type them into the input box below the editor, one per line",
        "Where a past paper prints its expected output, your output is checked against it",
      ] },
      { type: "note", text: "You need a connection for Run to work, because the compiling happens on the server rather than on your device." },
      { type: "p", text: "Try it now — the program below is already written. Press Run, then open Lesson 1." },
    ],
    expectedOutput: "Ready to start.",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    cout << "Ready to start." << endl;
    return 0;
}
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
    theory: [
      {
        id: "1.1",
        ask: [
          { type: "p", text: "Every program in this module has the same three parts. In the skeleton above, which part is the descriptive comment? Which is the standard header file, and which is the statement sequence?" },
        ],
        answer: [
          { type: "list", items: [
            "The descriptive comment is the // line at the top saying what the program does. It is for the reader; the compiler ignores it entirely.",
            "The standard header file is #include <iostream>, which brings in the ability to read and print.",
            "The statement sequence is everything between the braces of main — the lines that actually run, in the order they are written.",
          ] },
          { type: "note", text: "using namespace std; is not one of the three, but without it you would have to write std::cout instead of cout every time." },
        ],
      },
      {
        id: "1.2",
        ask: [
          { type: "p", text: "Write a program to display the following poem on the screen." },
          { type: "code", text:
'Twinkle, twinkle, little bat!\nHow I wonder what you’re at?\nUp above the world you fly,\nLike a tea-tray in the sky.' },
          { type: "p", text: "It is from Alice's Adventures in Wonderland by Lewis Carroll." },
        ],
        answer: [
          { type: "code", text:
'//Displays a verse from Alice\'s Adventures in Wonderland\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    cout << "Twinkle, twinkle, little bat!" << endl;\n    cout << "How I wonder what you\'re at?" << endl;\n    cout << "Up above the world you fly," << endl;\n    cout << "Like a tea-tray in the sky." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The apostrophe in you're sits inside double quotes, so it needs no special treatment. A double quote inside the text would, and is written \\\" — Lesson 7 covers that." },
        ],
      },
    ],
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
    theory: [
      {
        id: "2.1",
        ask: [
          { type: "p", text: "Add round brackets to these expressions to show the order in which the operators are evaluated, then give the value of each one." },
          { type: "code", text:
'(i)   80 / 5 + 70 / 6\n(ii)  -5 + -4 - -3\n(iii) 6 * 7 / 8 * 9\n(iv)  1 - 2 + 3 / 4 * 5\n(v)   -1 + 23 / -4 + 56' },
        ],
        answer: [
          { type: "code", text:
'(i)   (80 / 5) + (70 / 6)        = 16 + 11  = 27\n(ii)  ((-5) + (-4)) - (-3)       = -9 + 3   = -6\n(iii) ((6 * 7) / 8) * 9          = 5 * 9    = 45\n(iv)  (1 - 2) + ((3 / 4) * 5)    = -1 + 0   = -1\n(v)   ((-1) + (23 / (-4))) + 56  = -1 - 5 + 56 = 50' },
          { type: "note", text: "Every surprise here comes from integer division throwing the remainder away. 70 / 6 is 11, not 11.67. 3 / 4 is 0, which is why (iv) collapses to -1. And 23 / -4 is -5, because the division truncates towards zero rather than rounding down." },
        ],
      },
      {
        id: "2.2",
        ask: [
          { type: "p", text: "Write a program that produces this output, calculating the numbers in place of XXX, YYY and ZZZ." },
          { type: "code", text:
'There are 60 seconds in a minute.\nThere are XXX seconds in an hour.\nThere are YYY seconds in a day.\nThere are ZZZ seconds in a year.' },
        ],
        answer: [
          { type: "code", text:
'//Displays the number of seconds in various periods\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    const int SECONDS_PER_MINUTE = 60;\n    const int MINUTES_PER_HOUR = 60;\n    const int HOURS_PER_DAY = 24;\n    const int DAYS_PER_YEAR = 365;\n\n    int perHour = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;\n    int perDay = perHour * HOURS_PER_DAY;\n    long perYear = long(perDay) * DAYS_PER_YEAR;\n\n    cout << "There are " << SECONDS_PER_MINUTE << " seconds in a minute." << endl;\n    cout << "There are " << perHour << " seconds in an hour." << endl;\n    cout << "There are " << perDay << " seconds in a day." << endl;\n    cout << "There are " << perYear << " seconds in a year." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The answers are 3 600, 86 400 and 31 536 000. That last one is the reason for long: an int is only guaranteed to hold about 32 000, and although it is usually far larger in practice, a year of seconds is close enough to the edge to be worth being deliberate about." },
        ],
      },
      {
        id: "2.3",
        ask: [
          { type: "p", text: "Write a program to calculate the remainder of 234 divided by 13, remembering that / throws the remainder away. Hint: divide 234 by 13, multiply the result by 13 again, and the difference between that and 234 is the remainder." },
        ],
        answer: [
          { type: "code", text:
'//Works out a remainder the long way round\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int number = 234;\n    int divisor = 13;\n    int quotient = number / divisor;\n    int remainder = number - quotient * divisor;\n\n    cout << "The remainder is " << remainder << endl;\n\n    return 0;\n}' },
          { type: "note", text: "234 / 13 is 18, and 18 * 13 is 234, so the remainder is 0 — 13 divides 234 exactly. C++ has an operator that does this in one step, %, and 234 % 13 gives the same answer. The exercise makes you do it the long way so you can see what % is actually doing." },
        ],
      },
    ],
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
    theory: [
      {
        id: "3.1",
        ask: [{ type: "p", text: "Write a program that inputs three values and displays them on a single line in reverse order." }],
        answer: [
          { type: "code", text:
'//Displays three values in reverse order\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int first, second, third;\n\n    cout << "Enter three values: ";\n    cin >> first >> second >> third;\n\n    cout << third << " " << second << " " << first << endl;\n\n    return 0;\n}' },
          { type: "note", text: "Nothing is reversed here in the sense of being rearranged in memory. The values sit exactly where they were put; only the order of the printing changed." },
        ],
      },
      {
        id: "3.2",
        ask: [
          { type: "p", text: "Answer these without typing the program in and running it." },
          { type: "code", text:
'#include <iostream>\nusing namespace std;\n\nint main( )\n{\n   int x, y, z;\n\n   cout << "Enter values for variables x, y and z:" << endl;\n   cin >> x >> y >> z;\n\n   cout << "x + y / z is " << x + y / z << endl;\n   cout << "x % z is " << x % z << endl;\n   cout << "y * z / x + 2 is " << y * z / x + 2 << endl;\n\n   return 0;\n}' },
          { type: "list", items: [
            "(i) What is the output if the user enters 2, 6 and 4?",
            "(ii) What is the output if the user enters 5, 1 and 3?",
            "(iii) If the last statement becomes y * (z / x + 2), what does it give for each of those two sets of values?",
          ] },
        ],
        answer: [
          { type: "code", label: "(i) x=2, y=6, z=4", text:
'x + y / z is 3        because 6 / 4 is 1, then 2 + 1\nx % z is 2            because 2 divided by 4 leaves 2\ny * z / x + 2 is 14   because 6 * 4 is 24, / 2 is 12, + 2' },
          { type: "code", label: "(ii) x=5, y=1, z=3", text:
'x + y / z is 5        because 1 / 3 is 0, then 5 + 0\nx % z is 2            because 5 divided by 3 leaves 2\ny * z / x + 2 is 2    because 1 * 3 is 3, / 5 is 0, + 2' },
          { type: "code", label: "(iii) with the brackets", text:
'for (i):  6 * (4 / 2 + 2) = 6 * 4 = 24\nfor (ii): 1 * (3 / 5 + 2) = 1 * 2 = 2' },
          { type: "note", text: "The brackets change the answer in (i) from 14 to 24 and leave (ii) at 2. Working through cases like this by hand is exactly what the exam asks for, and integer division is where the marks are lost." },
        ],
      },
      {
        id: "3.3",
        ask: [
          { type: "p", text: "Lorraine inherited her grandmother's cookbook, but every oven temperature is in Fahrenheit and her oven is only marked in Celsius. Write a program to help her. The formula is C = 5(F − 32) / 9." },
        ],
        answer: [
          { type: "code", text:
'//Converts a Fahrenheit oven temperature to Celsius\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    float fahrenheit;\n\n    cout << "Enter the temperature in Fahrenheit: ";\n    cin >> fahrenheit;\n\n    cout << "That is " << 5 * (fahrenheit - 32) / 9\n         << " degrees Celsius" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "fahrenheit must be a float. With an int, 350 degrees comes out as 176 rather than 176.667 — and worse, writing the formula as 5 / 9 * (fahrenheit - 32) gives 0 every time, because 5 / 9 is worked out first and integer division makes it 0." },
        ],
      },
    ],
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
    theory: [
      {
        id: "4.1",
        ask: [{ type: "p", text: "Redo Exercise 3.3, but store the result of the calculation in a variable instead of doing the calculation inside the output statement." }],
        answer: [
          { type: "code", text:
'//Converts a Fahrenheit oven temperature to Celsius\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    float fahrenheit, celsius;\n\n    cout << "Enter the temperature in Fahrenheit: ";\n    cin >> fahrenheit;\n\n    celsius = 5 * (fahrenheit - 32) / 9;\n\n    cout << "That is " << celsius << " degrees Celsius" << endl;\n\n    return 0;\n}' },
          { type: "p", text: "The output is identical. What changes is that the answer now has a name, so it can be used again, checked, or printed differently without recalculating it." },
        ],
      },
      {
        id: "4.2",
        ask: [
          { type: "p", text: "Sam runs a packaging business. Clients bring him a number of identical items and he packs as many as will fit into each box, then works out how many boxes he needs and how many items are left over." },
          { type: "p", text: "Write a program that inputs the number of items and the number that fit in a box, then calculates how many boxes are needed and how many items are left over." },
        ],
        answer: [
          { type: "code", text:
'//Works out boxes needed and items left over\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int items, perBox, boxes, leftOver;\n\n    cout << "How many items? ";\n    cin >> items;\n    cout << "How many fit in a box? ";\n    cin >> perBox;\n\n    boxes = items / perBox;\n    leftOver = items % perBox;\n\n    cout << "Boxes needed: " << boxes << endl;\n    cout << "Items left over: " << leftOver << endl;\n\n    return 0;\n}' },
          { type: "note", text: "This is what / and % are for, and why integer division throwing the remainder away is a feature rather than a nuisance. With 47 items and 10 per box you get 4 full boxes and 7 left over." },
        ],
      },
      {
        id: "4.3",
        ask: [
          { type: "p", text: "What will the value of n be after this series of statements?" },
          { type: "code", text:
'int n = 10;\nn += 3;\nn /= 2;\nn++;\nn %= 4;\nn -= 5;' },
        ],
        answer: [
          { type: "code", label: "Step by step", text:
'int n = 10;    n is 10\nn += 3;        n is 13     (10 + 3)\nn /= 2;        n is 6      (13 / 2, remainder thrown away)\nn++;           n is 7      (6 + 1)\nn %= 4;        n is 3      (7 divided by 4 leaves 3)\nn -= 5;        n is -2     (3 - 5)' },
          { type: "note", text: "The answer is -2. The step that catches people is n /= 2 — 13 / 2 is 6, not 6.5, because n is an int and there is nowhere to keep the half." },
        ],
      },
    ],
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
    theory: [
      {
        id: "5.1",
        ask: [
          { type: "p", text: "Draw variable diagrams showing the value of each variable after each statement, and give the exact output of this program." },
          { type: "code", text:
' 1 //Tracing practice\n 2 #include <iostream>\n 3 using namespace std;\n 4\n 5 int main( )\n 6 {\n 7    int j, k, m, n;\n 8    j = 3;\n 9    k = 2;\n10    m = (j * j - 6) / k;\n11    n = j * j - 6 / k;\n12    cout << j << " " << k << " " << m << " " << n << endl;\n13    j = m / 2 + 3 * j;\n14    k = j - m * n;\n15    cout << j << " " << k << " " << m << " " << n << endl;\n16\n17    return 0;\n18 }' },
        ],
        answer: [
          { type: "code", label: "Tracing it line by line", text:
'line       j     k     m     n\n 7         ?     ?     ?     ?     declared, no values yet\n 8         3     ?     ?     ?\n 9         3     2     ?     ?\n10         3     2     1     ?     (3*3 - 6) / 2  =  3 / 2  =  1\n11         3     2     1     6     3*3 - 6/2      =  9 - 3  =  6\n12   prints "3 2 1 6"\n13         9     2     1     6     1/2 + 3*3      =  0 + 9  =  9\n14         9     3     1     6     9 - 1*6                  =  3\n15   prints "9 3 1 6"' },
          { type: "code", label: "The exact output", text: '3 2 1 6\n9 3 1 6' },
          { type: "note", text: "Lines 10 and 11 look almost the same and give completely different answers, which is the whole point of the exercise. In line 10 the brackets force the subtraction first; in line 11 the division happens before the subtraction. Line 13 has the other trap: m / 2 is 1 / 2, which is 0." },
        ],
      },
    ],
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
    theory: [
      {
        id: "6.1",
        ask: [{ type: "p", text: "Write a program that asks for and reads the length and width of a room in metres, then calculates and displays the area with a suitable heading. The output must be in fixed-point notation with three digits after the decimal point." }],
        answer: [
          { type: "code", text:
'//Works out the area of a room\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    float length, width, area;\n\n    cout << "Enter the length of the room in metres: ";\n    cin >> length;\n    cout << "Enter the width of the room in metres: ";\n    cin >> width;\n\n    area = length * width;\n\n    cout << fixed << setprecision(3);\n    cout << "Area of the room: " << area << " square metres" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "fixed and setprecision come from <iomanip>, and setprecision means decimal places only once fixed is in force. Without fixed it means significant digits instead, which is the trap in Exercise 6.4." },
        ],
      },
      {
        id: "6.2",
        ask: [{ type: "p", text: "Change the program from Exercise 6.1 so that it also calculates the total price of a wall-to-wall carpet for the room, at R59.50 per square metre." }],
        answer: [
          { type: "code", text:
'//Works out the area of a room and the cost of carpeting it\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    const float PRICE_PER_SQUARE_METRE = 59.50;\n    float length, width, area, cost;\n\n    cout << "Enter the length of the room in metres: ";\n    cin >> length;\n    cout << "Enter the width of the room in metres: ";\n    cin >> width;\n\n    area = length * width;\n    cost = area * PRICE_PER_SQUARE_METRE;\n\n    cout << fixed << setprecision(3);\n    cout << "Area of the room: " << area << " square metres" << endl;\n    cout << setprecision(2);\n    cout << "Cost of the carpet: R" << cost << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The price drops to two decimals because it is money. setprecision stays in force until it is changed again, so it has to be set a second time rather than once at the top." },
        ],
      },
      {
        id: "6.3",
        ask: [
          { type: "p", text: "This program does nothing meaningful; it only illustrates integer and floating point numbers." },
          { type: "code", text:
' 7    int w, x;\n 8    float y, result, answer;\n 9\n10    cout << "Enter two integers: " << endl;\n11    cin >> w >> x;\n12\n13    y = w / x;\n14    result = w - y;\n15    y = float(w + x);\n16    answer = int(y / x);' },
          { type: "list", items: [
            "(i) Where do implicit and explicit type conversions take place?",
            "(ii) What are the values of result and answer at the end if 13 and 5 are entered for w and x?",
          ] },
        ],
        answer: [
          { type: "code", label: "(i) the conversions", text:
'line 13   implicit   w / x is worked out as ints (13 / 5 = 2),\n                     then the 2 is converted to float on assignment\nline 14   implicit   w is converted to float so it can be subtracted from y\nline 15   explicit   float(w + x) — you asked for it, with float(...)\nline 16   explicit   int(y / x) — you asked for it, with int(...)\nline 16   implicit   x is converted to float for the division, and the\n                     int result is converted back to float on assignment' },
          { type: "code", label: "(ii) the values", text:
'y      = 13 / 5     = 2      (integer division, then stored as 2.0)\nresult = 13 - 2.0   = 11.0\ny      = float(18)  = 18.0\nanswer = int(18.0 / 5) = int(3.6) = 3   (stored as 3.0)\n\nresult is 11 and answer is 3' },
          { type: "note", text: "Line 13 is the one that costs marks. w and x are both ints, so the division is done in integer arithmetic and the 0.6 is gone before the float ever sees it. Declaring y as a float does not rescue a calculation that was already finished." },
        ],
      },
      {
        id: "6.4",
        ask: [
          { type: "p", text: "What is the exact output of this program, including spaces?" },
          { type: "code", text:
'float a, b, c;\n\ncout << "Enter three floating point numbers:" << endl;\ncin >> a >> b >> c;\n\ncout.precision(5);\ncout << a << " " << b << " " << c << endl;\n\ncout << "Enter two more floating point numbers:" << endl;\ncin >> b >> a;\n\ncout.setf(ios::fixed);\ncout.precision(3);\ncout << a << " " << b << " " << c << endl;' },
          { type: "code", label: "The input", text: '14.0   1.123   64.9999\n73.46  27.2727' },
        ],
        answer: [
          { type: "code", label: "The output", text:
'Enter three floating point numbers:\n14 1.123 65\nEnter two more floating point numbers:\n27.273 73.460 65.000' },
          { type: "p", text: "The first line has precision(5) but not fixed, so 5 means significant digits. 14.0 prints as 14 because trailing zeros are dropped, and 64.9999 rounds to 65." },
          { type: "p", text: "Then b and a are read again, in that order, so b becomes 73.46 and a becomes 27.2727. c is never read again and keeps 64.9999." },
          { type: "p", text: "The second line has fixed in force, so precision(3) now means three decimal places and nothing is dropped: 27.273, 73.460 and 65.000." },
          { type: "note", text: "Two things to take from this. Reading into b then a is not a mistake in the question — it really does swap which value lands where. And the same precision(3) means something different before and after setf(ios::fixed)." },
        ],
      },
    ],
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
    theory: [
      {
        id: "7.1",
        ask: [
          { type: "p", text: "Consider this program." },
          { type: "code", text:
'int x, y, z;\n\ncout << "Enter two numbers for variables x and y: ";\ncin >> x >> y;\n\nz = x + y;\ncout << "x + y is " << z << endl;' },
          { type: "list", items: [
            "(i) What is the output if the user enters 123 and 456?",
            "(ii) What if x, y and z are declared as string instead, with #include <string> added?",
            "(iii) What if they are declared as char?",
          ] },
        ],
        answer: [
          { type: "code", text:
'(i)   x + y is 579\n(ii)  x + y is 123456\n(iii) x + y is c' },
          { type: "p", text: "In (i) they are numbers, so + adds them. In (ii) they are text, so + joins them end to end — 123 followed by 456, not five hundred and seventy nine." },
          { type: "p", text: "In (iii) a char holds one character, so cin takes only the 1 from 123 and only the 4 from 456... except that whitespace is skipped, so x gets '1' and y gets the next non-space character, '2'. Their ASCII codes are 49 and 50, which add to 99, and 99 is the code for the letter c." },
          { type: "note", text: "The same + does three different jobs depending on what it is given. This is worth remembering when a program prints something bizarre — check the types before you check the arithmetic." },
        ],
      },
      {
        id: "7.2",
        ask: [
          { type: "p", text: "Write a program that works out which letter of the alphabet a given upper case letter is." },
          { type: "code", label: "The interface", text: 'Enter an upper case letter: E\nE is in position 5 in the alphabet' },
        ],
        answer: [
          { type: "code", text:
'//Works out an upper case letter\'s position in the alphabet\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    char letter;\n\n    cout << "Enter an upper case letter: ";\n    cin >> letter;\n\n    cout << letter << " is in position " << letter - \'A\' + 1\n         << " in the alphabet" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The letters have consecutive ASCII codes, so subtracting 'A' gives the distance from the start of the alphabet: 'E' is 69 and 'A' is 65, so the difference is 4. Add 1 because A is position 1 rather than position 0." },
        ],
      },
      {
        id: "7.3",
        ask: [{ type: "p", text: "Write a program that performs a spoonerism, where the first letters of two words are swapped. The spoonerism of Cold Blue is Bold Clue. The program must input two words and output their spoonerism." }],
        answer: [
          { type: "code", text:
'//Swaps the first letters of two words\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main()\n{\n    string first, second;\n    char swap;\n\n    cout << "Enter two words: ";\n    cin >> first >> second;\n\n    swap = first[0];\n    first[0] = second[0];\n    second[0] = swap;\n\n    cout << first << " " << second << endl;\n\n    return 0;\n}' },
          { type: "note", text: "first[0] is the first character of the string, counting from 0. The third variable is needed because the moment you overwrite first[0] the original letter is gone, so it has to be put somewhere safe before the swap starts." },
        ],
      },
      {
        id: "7.4",
        ask: [
          { type: "p", text: "Write a program to allow the following interaction." },
          { type: "code", text:
'Enter a person\'s name: Peter\nEnter another person\'s name: Mary\nEnter a colour: purple\nEnter a number: 13\nEnter a noun: fish\nEnter an adjective: sweet\n\nDialogue\n========\nPeter: "Couldn\'t you see that the traffic light was purple?"\nMary:   "But I had 13 people and a fish in the car with me."\nPeter: "That is so sweet! You could have had them all killed."' },
        ],
        answer: [
          { type: "code", text:
'//Builds a small dialogue out of words supplied by the user\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main()\n{\n    string nameOne, nameTwo, colour, noun, adjective;\n    int number;\n\n    cout << "Enter a person\'s name: ";\n    cin >> nameOne;\n    cout << "Enter another person\'s name: ";\n    cin >> nameTwo;\n    cout << "Enter a colour: ";\n    cin >> colour;\n    cout << "Enter a number: ";\n    cin >> number;\n    cout << "Enter a noun: ";\n    cin >> noun;\n    cout << "Enter an adjective: ";\n    cin >> adjective;\n\n    cout << endl;\n    cout << "Dialogue" << endl;\n    cout << "========" << endl;\n    cout << nameOne << ": \\"Couldn\'t you see that the traffic light was "\n         << colour << "?\\"" << endl;\n    cout << nameTwo << ":   \\"But I had " << number << " people and a "\n         << noun << " in the car with me.\\"" << endl;\n    cout << nameOne << ": \\"That is so " << adjective\n         << "! You could have had them all killed.\\"" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The double quotes inside the dialogue have to be written \\\" so the compiler knows they are part of the text rather than the end of it. That is the escape character from this lesson doing real work." },
        ],
      },
      {
        id: "7.5",
        ask: [
          { type: "p", text: "Write a program to perform this interaction, displaying the message as many times as the user asks for." },
          { type: "code", text:
'Computer punishment\n-------------------\n\nRepetitions? 10000\nMessage? I will not drive humans crazy again!\n\nI will not drive humans crazy again!\nI will not drive humans crazy again!\nI will not drive humans crazy again!\n:\nI will not drive humans crazy again!' },
        ],
        answer: [
          { type: "note", text: "You cannot write this one yet, and that is deliberate — repeating something a given number of times needs a loop, which arrives in Lesson 9. Come back to it then. It is worth reading the question now so you know what you are working towards." },
          { type: "code", label: "Once you have done Lesson 9", text:
'//Displays a message a given number of times\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main()\n{\n    int repetitions, count = 0;\n    string message;\n\n    cout << "Computer punishment" << endl;\n    cout << "-------------------" << endl << endl;\n\n    cout << "Repetitions? ";\n    cin >> repetitions;\n    cin.ignore();\n    cout << "Message? ";\n    getline(cin, message);\n\n    cout << endl;\n\n    while (count < repetitions)\n    {\n       cout << message << endl;\n       count++;\n    }\n\n    return 0;\n}' },
          { type: "note", text: "cin.ignore() is there because cin >> repetitions leaves the Enter key sitting in the input, and getline would otherwise read that empty remainder instead of waiting for the message." },
        ],
      },
    ],
  },

  /* ================= PART II ================= */
  {
    id: "l8-if",
    part: "Part II · Conditional execution",
    lesson: 8,
    title: "If statements",
    teach: [
      { type: "p", text: "Everything so far has run straight through, top to bottom, doing the same thing every time. An if statement lets a program choose, and do different things under different conditions." },
      { type: "code", label: "The shape of it", text:
'if (Condition)\n   Statement1;\nelse\n   Statement2;' },
      { type: "p", text: "Condition is either true or false. If it is true, Statement1 runs. If it is false, Statement2 runs. Never both." },
      { type: "p", text: "Conditions are usually built with a relational operator, which compares two values." },
      { type: "list", items: [
        "<   is less than",
        "<=  is less than or equal to",
        ">   is greater than",
        ">=  is greater than or equal to",
        "==  is equal to",
        "!=  is not equal to",
      ] },
      { type: "note", text: "= assigns, == compares. Writing if (x = 5) instead of if (x == 5) is the single most common mistake in this module. It compiles, so nothing warns you, and the program quietly does the wrong thing." },
      { type: "p", text: "To run more than one statement, put them between braces. A group of statements in braces is called a compound statement." },
      { type: "code", label: "More than one statement", text:
'if (mark >= 50)\n{\n   cout << "Pass" << endl;\n   passed++;\n}\nelse\n{\n   cout << "Fail" << endl;\n   failed++;\n}' },
      { type: "p", text: "The else part can be left out when there is nothing to do in the false case." },
      { type: "note", text: "Without braces, only the one statement directly after the if belongs to it. Anything after that runs every time, whatever the condition said. Indenting it does not change this — the compiler does not read indentation." },
    ],
    task: "Ask for an employee's yearly salary, then work out and display the income tax payable. If the salary is more than R70 000.00 the tax rate is 40%, otherwise it is 30%.",
    starter:
`//Calculates tax on a salary
#include <iostream>
using namespace std;

int main()
{
    float salary, tax;

    cout << "Enter the employee's salary: ";
    cin >> salary;

    // Work out the tax: 40% if the salary is over 70000, otherwise 30%

    // Display the salary and the tax payable

    return 0;
}
`,
    sampleInput: "85000\n",
    theory: [
      {
        id: "8.1",
        ask: [
          { type: "p", text: "In which of the following pieces of code is Statement1 executed?" },
          { type: "code", text:
'(i)    if (absoluteZero == absoluteZero)\n          Statement1;\n       else\n          Statement2;\n\n(ii)   if (absoluteZero < absoluteZero)\n          Statement1;\n       else\n          Statement2;\n\n(iii)  if (absoluteZero != absoluteZero)\n          Statement1;\n       Statement2;\n\n(iv)   if (-1.0 < 0.0) Statement1; Statement2;' },
        ],
        answer: [
          { type: "list", items: [
            "(i) Yes. A value always equals itself, so the condition is true.",
            "(ii) No. Nothing is less than itself, so the condition is false and Statement2 runs.",
            "(iii) No. The condition is false, so Statement1 is skipped.",
            "(iv) Yes. -1.0 is less than 0.0, so the condition is true.",
          ] },
          { type: "note", text: "Look at (iii) and (iv) again. In both, Statement2 runs no matter what the condition says, because there are no braces and only the statement directly after the if belongs to it. In (iii) the indentation makes it look otherwise, and in (iv) putting it all on one line hides it completely." },
        ],
      },
      {
        id: "8.2",
        ask: [
          { type: "p", text: "Simplify the following if statements by taking out the code that is common to both branches." },
          { type: "code", text:
'(i)   if (colour == "red")\n      {\n         cout << "Correct" << endl;\n         cout << "What is the colour of the sky? ";\n         cin >> colour;\n      }\n      else\n      {\n         cout << "No, blood is red." << endl;\n         cout << "What is the colour of the sky? ";\n         cin >> colour;\n      }' },
          { type: "code", text:
'(ii)  if (age < 13)\n      {\n         cout << "Enter salary: ";\n         cin >> parentSalary;\n         pocketMoney += parentSalary / 20;\n      }\n      else\n      {\n         cout << "Enter salary: ";\n         cin >> parentSalary;\n         pocketMoney += parentSalary / 10;\n      }' },
          { type: "code", text:
'(iii) if (mark < 50)\n      {\n         failed++;\n         total += mark;\n      }\n      else\n         total += mark;' },
        ],
        answer: [
          { type: "code", label: "(i) the question is asked either way, so move it out", text:
'if (colour == "red")\n   cout << "Correct" << endl;\nelse\n   cout << "No, blood is red." << endl;\n\ncout << "What is the colour of the sky? ";\ncin >> colour;' },
          { type: "code", label: "(ii) the salary is read either way, so read it first", text:
'cout << "Enter salary: ";\ncin >> parentSalary;\n\nif (age < 13)\n   pocketMoney += parentSalary / 20;\nelse\n   pocketMoney += parentSalary / 10;' },
          { type: "code", label: "(iii) the mark is always added, so only the count is conditional", text:
'if (mark < 50)\n   failed++;\n\ntotal += mark;' },
          { type: "p", text: "Each version says the same thing in fewer lines. More importantly, the thing that actually differs between the two cases is now the only thing inside the if, so a reader can see the decision at a glance." },
        ],
      },
      {
        id: "8.3",
        ask: [
          { type: "p", text: "Write an if statement for this: if balance is greater than or equal to zero, display the word Credit on the screen; otherwise display the word Debit." },
        ],
        answer: [
          { type: "code", text:
'if (balance >= 0)\n   cout << "Credit" << endl;\nelse\n   cout << "Debit" << endl;' },
        ],
      },
      {
        id: "8.4",
        ask: [
          { type: "p", text: "Design an if statement that tells the user whether a floating point variable x contains a value equal to the one in another floating point variable y." },
        ],
        answer: [
          { type: "code", text:
'if (x == y)\n   cout << "x and y are equal" << endl;\nelse\n   cout << "x and y are not equal" << endl;' },
          { type: "note", text: "That is the answer the question wants, but be careful with == on floating point values in real programs. 0.1 + 0.2 does not store as exactly 0.3, so two numbers that should match can compare as different. The usual fix is to test whether the difference between them is tiny rather than whether they are equal." },
        ],
      },
      {
        id: "8.5",
        ask: [
          { type: "p", text: "Rewrite this code using meaningful variable names, a comment and indentation, so that it can be read." },
          { type: "code", text:
'int jd; const int BANANA_FISH = 1945; const float SILLY = 20.0;\ncout << "When were you born? "; cin >> jd;\n\nif (jd < BANANA_FISH) cout << "Free entry";\nelse cout << "Entrance fee R" << SILLY; cout << endl;' },
        ],
        answer: [
          { type: "code", text:
'//Works out the entrance fee from the year the visitor was born\nint yearOfBirth;\nconst int FREE_ENTRY_BEFORE = 1945;\nconst float ENTRANCE_FEE = 20.0;\n\ncout << "When were you born? ";\ncin >> yearOfBirth;\n\nif (yearOfBirth < FREE_ENTRY_BEFORE)\n   cout << "Free entry";\nelse\n   cout << "Entrance fee R" << ENTRANCE_FEE;\n\ncout << endl;' },
          { type: "note", text: "Notice what the original layout hid: the final cout << endl; is not part of the else. It sits on the same line, but it runs every time. Cramming statements onto one line is how that kind of thing goes unnoticed." },
        ],
      },
      {
        id: "8.6",
        ask: [
          { type: "p", text: "Write a program that inputs the length and width of a room, then checks whether 100 square metres of carpet is enough to cover the floor. If it is enough, say so; otherwise display the size of the area that will not be covered." },
        ],
        answer: [
          { type: "code", text:
'//Checks whether 100 square metres of carpet will cover a room\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    const float CARPET = 100.0;\n    float length, width, area;\n\n    cout << "Enter the length of the room: ";\n    cin >> length;\n    cout << "Enter the width of the room: ";\n    cin >> width;\n\n    area = length * width;\n\n    if (area <= CARPET)\n       cout << "The carpet is enough." << endl;\n    else\n       cout << "Not covered: " << area - CARPET\n            << " square metres" << endl;\n\n    return 0;\n}' },
          { type: "p", text: "Try it in the editor with 12 and 9, then with 5 and 8, so you see both branches run." },
        ],
      },
    ],
  },

  {
    id: "l9-while",
    part: "Part II · Conditional execution",
    lesson: 9,
    title: "While loops",
    teach: [
      { type: "p", text: "An if statement decides whether to do something once. A while loop keeps doing something for as long as a condition stays true." },
      { type: "code", label: "The shape of it", text:
'while (Condition)\n   Statement;' },
      { type: "p", text: "Statement is the body of the loop. It runs over and over, as long as Condition is true. As with if, use braces when the body is more than one statement." },
      { type: "code", label: "Counting to five", text:
'int count = 1;\n\nwhile (count <= 5)\n{\n   cout << count << endl;\n   count++;\n}' },
      { type: "p", text: "The variables in the condition are called the control variables. They control how many times the loop repeats, and there are three things you must get right about them." },
      { type: "list", items: [
        "Initialise them correctly before the loop starts.",
        "Test them in the condition, so the loop knows when to keep going.",
        "Change them inside the body, so the condition eventually becomes false.",
      ] },
      { type: "note", text: "Miss the third one and the loop never ends. On this page that shows up as the program being stopped for running too long. In Code::Blocks it shows up as a window that will not close." },
      { type: "p", text: "The condition is tested before the body runs, so if it is false at the start, the body never runs at all — not even once." },
    ],
    task: "When Bongi's baby Sipho was born she opened a savings account with R1000.00. On each birthday, starting with the first, the bank adds interest of 4.5% of the balance and Bongi adds another R500.00. Use a loop to work out how much is in the account on Sipho's 18th birthday.",
    starter:
`//Works out a savings balance after 18 years
#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    const float INTEREST = 0.045;
    const float DEPOSIT = 500.00;
    float balance = 1000.00;
    int birthday = 1;

    // Repeat until the 18th birthday has been done:
    //   add the interest, then add the deposit

    cout << fixed << setprecision(2);
    // Display the balance

    return 0;
}
`,
    theory: [
      {
        id: "9.1",
        ask: [{ type: "p", text: "What is the least number of times the body of a while loop can be executed?" }],
        answer: [
          { type: "p", text: "None. The condition is tested before the first pass, so if it is already false the body is skipped entirely." },
          { type: "code", label: "This prints nothing", text:
'int count = 10;\n\nwhile (count < 5)\n{\n   cout << count << endl;\n   count++;\n}' },
        ],
      },
      {
        id: "9.2",
        ask: [
          { type: "p", text: "What is wrong with the following program segment? Check what the output would be for various inputs." },
          { type: "code", text:
'total = 0.0;\ncout << "Enter number of values: ";\ncin >> num;\ncount = 0;\nwhile (count < num)\n{\n   cout << "Enter a value : ";\n   cin >> value;\n   last = value;\n}\ncout << "The last value entered was " << last << endl;' },
        ],
        answer: [
          { type: "p", text: "count is never changed inside the loop. It is set to 0 before the loop and stays 0, so count < num stays true forever and the loop keeps asking for values without end." },
          { type: "code", label: "The fix", text:
'while (count < num)\n{\n   cout << "Enter a value : ";\n   cin >> value;\n   last = value;\n   count++;\n}' },
          { type: "note", text: "This is the third rule from the lesson: the body must change the control variable. Also note total is set to 0.0 and never used — a sign that the segment was meant to add the values up as well." },
        ],
      },
      {
        id: "9.4",
        ask: [
          { type: "p", text: "The maximum mass of luggage allowed on a certain aeroplane is 10 000.00 kg. Write a program that inputs the mass of each item of luggage and decides whether the total exceeds the maximum. Use 0 as the final value to signal the end of the input, and an if statement after the loop to report the finding." },
        ],
        answer: [
          { type: "code", text:
'//Adds up luggage masses and checks against the limit\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    const float MAXIMUM = 10000.00;\n    float mass, total = 0.0;\n\n    cout << "Enter the mass of an item (0 to end): ";\n    cin >> mass;\n\n    while (mass != 0)\n    {\n       total = total + mass;\n       cout << "Enter the mass of an item (0 to end): ";\n       cin >> mass;\n    }\n\n    if (total > MAXIMUM)\n       cout << "Too heavy by " << total - MAXIMUM << " kg" << endl;\n    else\n       cout << "The load is within the limit." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The pattern of reading one value before the loop and the next at the end of the body is worth learning by heart. It is the standard way to handle input that ends with a signal value, and it comes up in the exam." },
        ],
      },
    ],
  },

  {
    id: "l10-debugging",
    part: "Part II · Conditional execution",
    lesson: 10,
    title: "Program debugging",
    teach: [
      { type: "p", text: "There are three kinds of error, and only two of them get pointed out to you." },
      { type: "list", items: [
        "Syntax errors — the code is not valid C++. The compiler refuses to build it and tells you the line.",
        "Run-time errors — the program builds but then fails while running, for example by dividing by zero.",
        "Logical errors — the program builds, runs, and gives the wrong answer. Nothing is reported, because nothing is broken as far as the computer is concerned.",
      ] },
      { type: "note", text: "Logical errors are yours to find. The compiler cannot help, because the program you wrote is a perfectly valid program — it just is not the one you meant to write." },
      { type: "p", text: "Test with a variety of data, not one value that happens to work. Pick values that land on each side of every condition, and on the boundary itself. If a rule changes at 70 000, try 69 999, 70 000 and 70 001." },
      { type: "p", text: "When a program gives a wrong answer, there are three ways to track it down." },
      { type: "list", items: [
        "Read it carefully and work out by hand what it does with your test values.",
        "Draw a variable diagram, writing down how each variable changes step by step.",
        "Add temporary cout statements that print the values as the program runs, then take them out once it works.",
      ] },
      { type: "p", text: "Work out on paper what the program should do before you type it. Sketch the steps first. It is far quicker than fixing a program you never really planned." },
      { type: "note", text: "Three things worth accepting early: there is almost always more than one correct solution; you should be ready to throw away an idea that is not working; and almost nobody gets a program right the first time." },
    ],
    task: "The program in the editor counts how many students passed and how many failed, reading marks until -1 is typed. It compiles, it runs, it finishes — and the counts are wrong. The sample input has four marks in it: 60, 45, 50 and 80. Work out on paper what the answer should be, run it to see what you actually get, then find and fix the two logical errors.",
    starter:
`//Counts passes and failures - HAS TWO BUGS
#include <iostream>
using namespace std;

int main()
{
    int mark, passed = 0, failed = 0;

    cout << "Enter a mark (-1 to end): ";
    cin >> mark;

    while (mark != -1)
    {
        if (mark > 50)
            passed++;
        else
            passed++;

        cout << "Enter a mark (-1 to end): ";
        cin >> mark;
    }

    cout << "Passed: " << passed << endl;
    cout << "Failed: " << failed << endl;

    return 0;
}
`,
    sampleInput: "60\n45\n50\n80\n-1\n",
    theory: [
      {
        id: "10.1",
        ask: [{ type: "p", text: "Before you run it: what should the two counts be for the marks 60, 45, 50 and 80, if a pass is 50 or more? What does the program actually print, and why?" }],
        answer: [
          { type: "p", text: "It should print Passed: 3 and Failed: 1. The 45 is the only fail, because 50 is a pass." },
          { type: "p", text: "It actually prints Passed: 4 and Failed: 0, and there are two separate reasons for that." },
          { type: "list", items: [
            "if (mark > 50) leaves out the mark of exactly 50. A pass is 50 or more, so the test should be mark >= 50. This is an off-by-one error, and boundary values are exactly where they hide.",
            "The else branch increments passed instead of failed, so failed is never touched and every mark counts as a pass.",
          ] },
          { type: "note", text: "Neither is a syntax error and neither is a run-time error. The compiler has nothing to complain about — this is a valid program that does the wrong thing. That is what a logical error is, and why testing with a value that lands exactly on a boundary matters." },
        ],
      },
    ],
  },

  {
    id: "l11-boolean",
    part: "Part II · Conditional execution",
    lesson: 11,
    title: "Boolean values",
    teach: [
      { type: "p", text: "C++ has a type for things that are either true or false. It is called bool, and the two values are written true and false." },
      { type: "code", label: "Boolean variables", text:
'bool passed = true;\nbool raining = false;\n\nif (passed)\n   cout << "Well done" << endl;' },
      { type: "p", text: "Every comparison you have written so far produces one of these. mark >= 50 is not a special kind of thing that only fits inside an if — it is a bool, and you can store it." },
      { type: "code", label: "Storing a comparison", text:
'bool passed = mark >= 50;' },
      { type: "p", text: "Three operators combine boolean values." },
      { type: "list", items: [
        "&&  AND — true only when both sides are true",
        "||  OR — true when either side is true",
        "!   NOT — turns true into false and false into true",
      ] },
      { type: "code", label: "Combining conditions", text:
'if (age >= 13 && age <= 19)\n   cout << "Teenager" << endl;\n\nif (day == "Saturday" || day == "Sunday")\n   cout << "Weekend" << endl;' },
      { type: "p", text: "C++ stops evaluating as soon as it knows the answer. This is called short-circuit evaluation: if the left side of && is false, the right side is never looked at, and if the left side of || is true, the right side is never looked at." },
      { type: "note", text: "Internally true is 1 and false is 0, and C++ will accept any non-zero number where a condition is expected. Do not rely on that. if (count) instead of if (count != 0) is poor style and the module marks it as such." },
      { type: "p", text: "An if..else that only assigns true or false to a variable should always be written as a single assignment instead." },
      { type: "code", label: "Do this", text:
'nonNegative = x >= 0;' },
      { type: "code", label: "Not this", text:
'if (x >= 0)\n   nonNegative = true;\nelse\n   nonNegative = false;' },
    ],
    task: "A playschool accepts a toddler only if all of these are true: the child is 3, 4 or 5 years old; the parent is single; the parent's annual income is less than R60 000; and the parent is 30 or younger. Write a program that assesses whether the criteria are met. Use a single if statement whose condition is made of boolean variables only.",
    starter:
`//Decides whether a toddler is accepted at the playschool
#include <iostream>
using namespace std;

int main()
{
    int childAge, parentAge;
    float income;
    char single;

    cout << "Child's age: ";
    cin >> childAge;
    cout << "Is the parent single (y/n)? ";
    cin >> single;
    cout << "Parent's annual income: ";
    cin >> income;
    cout << "Parent's age: ";
    cin >> parentAge;

    // Work out one bool for each of the four criteria

    // A single if statement using only those bools

    return 0;
}
`,
    sampleInput: "4\ny\n45000\n28\n",
    theory: [
      {
        id: "11.1",
        ask: [
          { type: "p", text: "A municipality needs a program to calculate the amount payable for water. The rate depends on the number of units used." },
          { type: "list", items: [
            "The first 20 units are free.",
            "A fixed rate of R10 per unit is payable for the additional units if 40 units or less are used.",
            "If more than 40 units but not more than 100 units are used, the cost is 1.5 times the fixed rate for the additional units.",
            "If more than 100 units are used, the cost is 2 times the fixed rate for the additional units.",
          ] },
          { type: "p", text: "Write a program to input the units used as a floating point number, and output the amount payable." },
        ],
        answer: [
          { type: "code", text:
'//Works out a water bill from the units used\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    const float FREE_UNITS = 20.0;\n    const float RATE = 10.0;\n    float units, extra, amount;\n\n    cout << "Enter the units used: ";\n    cin >> units;\n\n    extra = units - FREE_UNITS;\n\n    if (units <= FREE_UNITS)\n       amount = 0.0;\n    else if (units <= 40)\n       amount = extra * RATE;\n    else if (units <= 100)\n       amount = extra * RATE * 1.5;\n    else\n       amount = extra * RATE * 2;\n\n    cout << fixed << setprecision(2);\n    cout << "Amount payable: R" << amount << endl;\n\n    return 0;\n}' },
          { type: "note", text: "Each condition only has to rule out what is above it, because the else if chain is read from the top and stops at the first true one. That is why the second test is just units <= 40 and not units > 20 && units <= 40." },
        ],
      },
      {
        id: "11.3",
        ask: [
          { type: "p", text: "Rewrite the following if statements as single assignment statements." },
          { type: "code", text:
'(i)   if (grade > 7)\n         highSchool = true;\n      else\n         highSchool = false;\n\n(ii)  if (age < 13 || age > 19)\n         teenager = false;\n      else\n         teenager = true;\n\n(iii) if (x < 0)\n         found = false;\n      else if (x % 4 == 0)\n         found = true;\n      else\n         found = false;' },
        ],
        answer: [
          { type: "code", text:
'(i)   highSchool = grade > 7;\n\n(ii)  teenager = !(age < 13 || age > 19);\n\n(iii) found = x >= 0 && x % 4 == 0;' },
          { type: "note", text: "In (ii) the condition assigns false, so the answer is its opposite — hence the !. You could also write it as age >= 13 && age <= 19, which says the same thing and reads better. In (iii), found is true only in the middle branch, so both of its conditions have to hold." },
        ],
      },
      {
        id: "11.4",
        ask: [
          { type: "p", text: "Write a program that gives the user 10 chances to guess a number between 1 and 100. If they get it in 10 tries or fewer, display: Well done! You got the number in 7 guesses. Otherwise display: Tough luck! Your 10 chances are over." },
          { type: "p", text: "The program must use a constant called SECRET holding the number to be guessed, and a boolean variable called found which is set to true as soon as the guess is correct." },
        ],
        answer: [
          { type: "code", text:
'//Ten chances to guess the secret number\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    const int SECRET = 23;\n    const int CHANCES = 10;\n    int guess, tries = 0;\n    bool found = false;\n\n    while (!found && tries < CHANCES)\n    {\n       cout << "Guess the number: ";\n       cin >> guess;\n       tries++;\n\n       if (guess == SECRET)\n          found = true;\n    }\n\n    if (found)\n       cout << "Well done! You got the number in "\n            << tries << " guesses." << endl;\n    else\n       cout << "Tough luck! Your " << CHANCES\n            << " chances are over." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The loop has two reasons to stop, so the condition has two parts. found starts false and !found is therefore true, which is what lets the loop begin at all." },
        ],
      },
    ],
  },

  {
    id: "l12-nested-if",
    part: "Part II · Conditional execution",
    lesson: 12,
    title: "Nested if statements",
    teach: [
      { type: "p", text: "An if statement can contain another if statement. That is called nesting, and it is how a program chooses between more than two things." },
      { type: "code", label: "An if inside an if", text:
'if (Condition1)\n   if (Condition2)\n      Statement1;\n   else\n      Statement2;\nelse\n   Statement3;' },
      { type: "p", text: "When there are more ifs than elses, there is a question about which if an else belongs to. C++ has one rule for this." },
      { type: "note", text: "An else belongs to the nearest if before it that does not already have an else of its own. Indentation has no effect on this whatsoever — if you indent an else to line up with the outer if, the compiler still attaches it to the inner one." },
      { type: "p", text: "To attach an else to the outer if, put the inner if in braces." },
      { type: "code", label: "Braces force the issue", text:
'if (Condition1)\n{\n   if (Condition2)\n      Statement1;\n}\nelse\n   Statement2;' },
      { type: "p", text: "When each else is followed by another if, the whole thing is better written as a multiple alternative decision. The conditions are tested from the top until one is true; that statement runs and the rest are skipped." },
      { type: "code", label: "Multiple alternatives", text:
'if (mark >= 75)\n   symbol = \'A\';\nelse if (mark >= 70)\n   symbol = \'B\';\nelse if (mark >= 60)\n   symbol = \'C\';\nelse if (mark >= 50)\n   symbol = \'D\';\nelse\n   symbol = \'F\';' },
      { type: "note", text: "This is the one place where you do not indent each level further. Line the else ifs up under one another — it reads as one decision with several outcomes, which is what it is." },
      { type: "p", text: "Ifs nested only to reach one statement can usually be collapsed with &&." },
      { type: "code", label: "These are the same", text:
'if (Condition1)\n   if (Condition2)\n      if (Condition3)\n         Statement;\n\nif (Condition1 && Condition2 && Condition3)\n   Statement;' },
    ],
    task: "A supermarket gives a discount on breakfast cereals based on how much a customer spends: less than R50 gets 10%, R50 to just under R70 gets 20%, R70 to just under R100 gets 30%, and R100 to just under R200 gets 40%. Ask for the amount spent, then display the discount percentage and the amount payable.",
    starter:
`//Works out the discount on a cereal purchase
#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    float amount, discount, payable;

    cout << "Enter the amount spent: ";
    cin >> amount;

    // Choose the discount rate with a multiple alternative decision

    // Work out what is payable and display both

    cout << fixed << setprecision(2);

    return 0;
}
`,
    sampleInput: "85\n",
    theory: [
      {
        id: "12.1",
        ask: [{ type: "p", text: "Write a program that reads in three numbers and determines whether the sum of any two of them is equal to the remaining number." }],
        answer: [
          { type: "code", text:
'//Checks whether two of three numbers add up to the third\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    float a, b, c;\n\n    cout << "Enter three numbers: ";\n    cin >> a >> b >> c;\n\n    if (a + b == c || a + c == b || b + c == a)\n       cout << "Yes, two of them add up to the third." << endl;\n    else\n       cout << "No, they do not." << endl;\n\n    return 0;\n}' },
          { type: "p", text: "There are three pairs to check, so there are three conditions joined by ||. Written as nested ifs this would take a dozen lines and be far harder to read." },
        ],
      },
      {
        id: "12.2",
        ask: [{ type: "p", text: "Write a program that reads two numbers representing the throw of a pair of dice. If the total is 7 or 11 display “You win!”. If the total is 2 display “Snake eyes!”, if it is 12 display “Good shot!”, otherwise display “Try again.”" }],
        answer: [
          { type: "code", text:
'//Reports the result of a throw of two dice\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int first, second, total;\n\n    cout << "Enter the two dice: ";\n    cin >> first >> second;\n\n    total = first + second;\n\n    if (total == 7 || total == 11)\n       cout << "You win!" << endl;\n    else if (total == 2)\n       cout << "Snake eyes!" << endl;\n    else if (total == 12)\n       cout << "Good shot!" << endl;\n    else\n       cout << "Try again." << endl;\n\n    return 0;\n}' },
        ],
      },
      {
        id: "12.3",
        ask: [{ type: "p", text: "Write a program that determines whether a year is a leap year. A leap year is a year divisible by 4, and if it is divisible by 100 it must also be divisible by 400." }],
        answer: [
          { type: "code", text:
'//Decides whether a year is a leap year\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int year;\n    bool leap;\n\n    cout << "Enter a year: ";\n    cin >> year;\n\n    if (year % 4 != 0)\n       leap = false;\n    else if (year % 100 != 0)\n       leap = true;\n    else\n       leap = year % 400 == 0;\n\n    if (leap)\n       cout << year << " is a leap year." << endl;\n    else\n       cout << year << " is not a leap year." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "Test it with 2024 (leap), 1900 (not, because it is divisible by 100 but not 400) and 2000 (leap, because it is divisible by 400). 1900 is the case that catches a wrong answer out." },
        ],
      },
    ],
  },

  /* ============ THE PATH AHEAD ============ */
  {
    id: "l13-switch",
    part: "Part II · Conditional execution",
    lesson: 13,
    title: "Switch statements",
    teach: [
      { type: "p", text: "When a program has to pick exactly one of several routes, and the choice depends on the value of a single variable, a switch statement says it more clearly than a stack of else ifs." },
      { type: "code", label: "The shape of it", text:
'switch (Selector)\n{\n   case Label1:\n      Statements1;\n      break;\n   case Label2:\n      Statements2;\n      break;\n   default:\n      StatementsD;\n}' },
      { type: "p", text: "The selector must be an ordinal type — an int or a char. It cannot be a float and it cannot be a string. The labels must be values of that same type, and no value may appear on more than one label." },
      { type: "note", text: "Once a label matches, execution carries on through every case below it until a break is reached. This is called falling through, and forgetting break is the classic switch bug: the right case runs, and then all the wrong ones do too." },
      { type: "p", text: "Falling through on purpose is how several values share one outcome." },
      { type: "code", label: "Deliberate fall-through", text:
'switch (day)\n{\n   case 6:\n   case 7:\n      cout << "Weekend" << endl;\n      break;\n   default:\n      cout << "Weekday" << endl;\n}' },
      { type: "p", text: "The default part is optional. It catches everything the labels did not, and runs unless a break was hit first. The statements under a label do not need braces, however many of them there are." },
      { type: "note", text: "A switch only works when every alternative turns on the same ordinal variable. If the choices depend on different variables, or on a floating point value, you need nested ifs. Any switch can be rewritten as ifs; the reverse is not always true." },
      { type: "p", text: "Put the cases that come up most often at the top, so the common ones are found with the least testing." },
    ],
    task: "Write a program for the cashier at a parkade. Ask whether the vehicle is a motorcar or a truck, then read how many hours it was parked — any part of an hour counts as a whole one. The charges are R2 for the first hour, R3 for 2 hours, R5 for 3 to 5 hours and R10 for more than 5 hours, with an extra R1 for trucks. Assume nothing is parked for longer than 24 hours. Use a switch statement.",
    starter:
`//Works out what is owed at a parkade
#include <iostream>
using namespace std;

int main()
{
    char vehicle;
    int hours;
    float charge;

    cout << "Motorcar or truck (c/t)? ";
    cin >> vehicle;
    cout << "How many hours? ";
    cin >> hours;

    // A switch on hours to set the charge
    // Remember 3, 4 and 5 all cost the same

    // Add R1 if it is a truck, then display the charge

    return 0;
}
`,
    sampleInput: "t\n4\n",
    theory: [
      {
        id: "13.1",
        ask: [
          { type: "p", text: "Your daughter wants to go to university and you set out the terms: 90% or higher and she may go anywhere and gets a car. 75% to 89% and she earns more than R5 000 over the December holidays, same again. More than 74% but without earning enough, she may still choose her university but gets no car. Less than 75% but more than 59%, she must attend the nearest university. Below 60%, no university." },
          { type: "p", text: "Write a program that reads her average mark and her holiday earnings, and displays which university she may attend. It must use a switch statement." },
        ],
        answer: [
          { type: "code", text:
'//Decides which university a mark allows\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int mark;\n    float earned;\n\n    cout << "Average mark: ";\n    cin >> mark;\n    cout << "Earned in December: ";\n    cin >> earned;\n\n    switch (mark / 10)\n    {\n       case 10:\n       case 9:\n          cout << "Any university, and a car." << endl;\n          break;\n       case 8:\n       case 7:\n          if (mark >= 75)\n             if (earned > 5000)\n                cout << "Any university, and a car." << endl;\n             else\n                cout << "Any university, but no car." << endl;\n          else\n             cout << "The nearest university." << endl;\n          break;\n       case 6:\n          cout << "The nearest university." << endl;\n          break;\n       default:\n          cout << "No university. Consider the alternatives." << endl;\n    }\n\n    return 0;\n}' },
          { type: "note", text: "A switch needs whole-number labels, but the rules break at 75 and 90, which are not tens. Dividing the mark by 10 turns it into a case per decade, and the awkward decade — the seventies, split at 75 — is handled with ifs inside its case. Note that case 10 is needed for a mark of exactly 100." },
        ],
      },
      {
        id: "13.2",
        ask: [
          { type: "p", text: "Do Exercise 12.2 again, this time with a switch statement. It read two numbers representing a throw of two dice: a total of 7 or 11 displays “You win!”, 2 displays “Snake eyes!”, 12 displays “Good shot!”, and anything else displays “Try again.”" },
        ],
        answer: [
          { type: "code", text:
'//Reports the result of a throw of two dice\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int first, second;\n\n    cout << "Enter the two dice: ";\n    cin >> first >> second;\n\n    switch (first + second)\n    {\n       case 7:\n       case 11:\n          cout << "You win!" << endl;\n          break;\n       case 2:\n          cout << "Snake eyes!" << endl;\n          break;\n       case 12:\n          cout << "Good shot!" << endl;\n          break;\n       default:\n          cout << "Try again." << endl;\n    }\n\n    return 0;\n}' },
          { type: "p", text: "This is what a switch is for. The whole decision turns on one whole number, so the else if chain from Lesson 12 becomes a flat list of the values that matter. Cases 7 and 11 share an outcome, so 7 falls through to 11 with nothing in between." },
        ],
      },
      {
        id: "13.4",
        ask: [
          { type: "p", text: "Write a switch statement that takes two integer variables, month (1 to 12) and year, and displays the number of days in that month. Leap years must be taken into account, so February needs nested if statements inside the switch." },
        ],
        answer: [
          { type: "code", text:
'//Displays the number of days in a month\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int month, year, days;\n\n    cout << "Enter the month (1-12): ";\n    cin >> month;\n    cout << "Enter the year: ";\n    cin >> year;\n\n    switch (month)\n    {\n       case 4:\n       case 6:\n       case 9:\n       case 11:\n          days = 30;\n          break;\n       case 2:\n          if (year % 4 != 0)\n             days = 28;\n          else if (year % 100 != 0)\n             days = 29;\n          else if (year % 400 == 0)\n             days = 29;\n          else\n             days = 28;\n          break;\n       default:\n          days = 31;\n    }\n\n    cout << "That month has " << days << " days." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The four thirty-day months share one outcome, so they stack as empty cases. Everything not named has 31 days, which is what default is for. Test it with February 1900 (28 days) and February 2000 (29), because those are the two the leap year rule catches out." },
        ],
      },
    ],
  },

  {
    id: "l14-more-while",
    part: "Part II · Conditional execution",
    lesson: 14,
    title: "More while loops",
    teach: [
      { type: "p", text: "A while loop tests its condition before the body runs, so the body may never run at all. Sometimes you want the opposite: do the thing once, then decide whether to do it again." },
      { type: "code", label: "The do..while loop", text:
'do\n{\n   cout << "Enter a positive number: ";\n   cin >> number;\n}\nwhile (number <= 0);' },
      { type: "p", text: "A while loop is a pretest loop — the condition is checked first. A do..while is a posttest loop — the body runs, then the condition is checked. A do..while always runs at least once." },
      { type: "note", text: "Note the semicolon after while (Condition); on a do..while. It is the end of the statement, and leaving it out is a syntax error that reads very strangely." },
      { type: "p", text: "Because the body runs before the condition is tested, a do..while often does not need its control variable set up beforehand — the body can set it. That leaves two rules instead of the three you learned for while: the body must change the control variable, and the condition must test it." },
      { type: "p", text: "Two loop shapes come up constantly. The first is counter-driven, where you know in advance how many times to go round." },
      { type: "code", label: "Counter-driven", text:
'count = 1;\n\nwhile (count <= 10)\n{\n   cout << "Iteration number " << count << endl;\n   count++;\n}' },
      { type: "p", text: "The second accumulates a total. A variable acts as the accumulator, is set to 0 before the loop, and has each value added to it inside." },
      { type: "code", label: "Accumulating a sum", text:
'count = 1;\nsum = 0;\n\nwhile (count <= 10)\n{\n   cin >> value;\n   sum += value;\n   count++;\n}' },
      { type: "p", text: "A variable declared inside braces is a block variable. It exists only within that block, and while it exists it hides any variable of the same name outside." },
      { type: "note", text: "That hiding is a real source of confusion. If you declare int i inside a loop body when there is already an i outside, the outer one is untouched by anything the loop does to its own — and when the loop ends, the inner one is gone." },
    ],
    task: "Write a program that maintains a simple cheque account. Ask for an opening balance, then for a sequence of transactions — deposits as positive values, cheques as negative values. Display the new balance after each one. The transactions end when 0 is entered.",
    starter:
`//Keeps a running balance for a cheque account
#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    float balance, transaction;

    cout << "Opening balance: ";
    cin >> balance;

    cout << fixed << setprecision(2);

    // Read a transaction, and keep going until it is 0.
    // After each one, add it to the balance and display the new balance.

    return 0;
}
`,
    sampleInput: "1000\n250\n-400\n100\n0\n",
    theory: [
      {
        id: "14.1",
        ask: [{ type: "p", text: "Write a program that asks how many people took part in a survey, then inputs the height of each one and calculates the average height." }],
        answer: [
          { type: "code", text:
'//Works out the average height from a survey\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    int people, count = 1;\n    float height, total = 0.0;\n\n    cout << "How many people took part? ";\n    cin >> people;\n\n    while (count <= people)\n    {\n       cout << "Height of person " << count << ": ";\n       cin >> height;\n       total += height;\n       count++;\n    }\n\n    cout << fixed << setprecision(2);\n    if (people > 0)\n       cout << "Average height: " << total / people << endl;\n    else\n       cout << "Nobody took part." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "Both patterns from the lesson are here at once: a counter to control the number of iterations, and an accumulator to build the total. The check for people > 0 is there because dividing by zero would otherwise crash the program if the user answers 0." },
        ],
      },
      {
        id: "14.3",
        ask: [
          { type: "p", text: "Write a program that displays the words of this song, using a while loop." },
          { type: "code", text:
'There were 10 in the bed\nAnd the little one said:\n"Roll over, roll over!"\nSo they all rolled over,\nAnd one fell out,\nThere were 9 in the bed\nAnd the little one said:\n:\n:\nThere was 1 in the bed\nAnd the little one said:\n"Good night!"' },
        ],
        answer: [
          { type: "code", text:
'//Sings ten in the bed\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int inBed = 10;\n\n    while (inBed > 1)\n    {\n       cout << "There were " << inBed << " in the bed" << endl;\n       cout << "And the little one said:" << endl;\n       cout << "\\"Roll over, roll over!\\"" << endl;\n       cout << "So they all rolled over," << endl;\n       cout << "And one fell out," << endl;\n       inBed--;\n    }\n\n    cout << "There was 1 in the bed" << endl;\n    cout << "And the little one said:" << endl;\n    cout << "\\"Good night!\\"" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The last verse is different — were becomes was, and the little one says good night instead of roll over — so the loop stops at 1 and the final verse is printed after it. Trying to force the odd verse into the loop with an if inside costs more than it saves." },
        ],
      },
      {
        id: "14.4",
        ask: [
          { type: "p", text: "Write a program that inputs a list of yearly salaries and counts how many exceed R100 000. The number of salaries is not known and there is no sentinel value, so the program must repeatedly ask whether there are more values to enter. It should end by displaying what percentage of the salaries entered were above R100 000. Use a do..while loop." },
        ],
        answer: [
          { type: "code", text:
'//Counts how many salaries exceed R100 000\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    const float THRESHOLD = 100000.0;\n    float salary;\n    int total = 0, above = 0;\n    char more;\n\n    do\n    {\n       cout << "Enter a salary: ";\n       cin >> salary;\n       total++;\n\n       if (salary > THRESHOLD)\n          above++;\n\n       cout << "Any more (y/n)? ";\n       cin >> more;\n    }\n    while (more == \'y\' || more == \'Y\');\n\n    cout << fixed << setprecision(1);\n    cout << above << " of " << total << " salaries are above R100 000, which is "\n         << 100.0 * above / total << "%" << endl;\n\n    return 0;\n}' },
          { type: "note", text: "A do..while fits because there is always at least one salary to enter, so asking first would be pointless. Note 100.0 * above / total rather than above / total * 100 — both are ints, so dividing first would give 0 every time." },
        ],
      },
      {
        id: "14.5",
        ask: [
          { type: "p", text: "What will the output of this program be? Explain your answer." },
          { type: "code", text:
'//Variable scope\n#include <iostream>\nusing namespace std;\n\nint i = 23;\n\nint main( )\n{\n   int i = 5;\n   int j = 10;\n\n   while (j > 0)\n   {\n      int i = j*j;\n      j--;\n   }\n\n   cout << "The value of i is " << i << endl;\n\n   return 0;\n}' },
        ],
        answer: [
          { type: "code", label: "The output", text: 'The value of i is 5' },
          { type: "p", text: "There are three different variables called i in this program, and the cout prints the one declared in main." },
          { type: "list", items: [
            "The i = 23 outside main is a global variable. It is hidden the moment main declares its own i.",
            "The i = 5 in main is the one that is still in scope at the cout, so it is the one printed.",
            "The i = j*j inside the loop body is a block variable. It is created afresh on every pass, hides the other two while the body runs, and is destroyed when the body ends. It never touches the i in main.",
          ] },
          { type: "note", text: "The loop looks like it is doing something and changes nothing that survives it. That is why declaring a variable inside a loop with the same name as one outside is worth avoiding — the code reads as though it is assigning to the outer variable." },
        ],
      },
    ],
  },

  {
    id: "l15-for",
    part: "Part II · Conditional execution",
    lesson: 15,
    title: "For loops",
    teach: [
      { type: "p", text: "A for loop is a counter-driven loop with the setting up, the testing and the stepping all written on one line, so a reader can see the whole pattern at a glance." },
      { type: "code", label: "The shape of it", text:
'for (int counter = 1; counter <= 10; counter++)\n   cout << counter << endl;' },
      { type: "p", text: "The three parts run at different times: the first once before anything else, the second before every pass, and the third after every pass. If the initial value is already past the final value the body never runs; if they are equal it runs exactly once." },
      { type: "p", text: "To count down, decrement in the third part and turn the comparison around." },
      { type: "code", label: "Counting down", text:
'for (int counter = 10; counter >= 1; counter--)\n   cout << counter << endl;' },
      { type: "note", text: "A counter declared inside the for statement does not exist after the loop. If you need its final value afterwards, declare it before the loop — and remember it ends up one past the final value, or one below it when counting down." },
      { type: "p", text: "Use a for loop when you can work out the number of iterations before it starts. Use a while loop when you cannot — when it depends on what the user types, or on a value the loop itself discovers." },
      { type: "note", text: "Do not change the counter inside the body. C++ allows it, and it makes the loop do something other than what its first line says it does, which is exactly the kind of bug that takes an afternoon to find." },
      { type: "p", text: "Any relational operator can be used in the condition, but avoid !=. If the counter ever steps over the exact value being tested for, the loop never ends. Use <, <=, > or >= instead." },
    ],
    task: "Write a program that calculates and displays the sums of all the odd numbers up to a number n. The user supplies n, and the program must display all the partial sums along the way — including n itself if n is odd.",
    starter:
`//Displays the running sum of the odd numbers up to n
#include <iostream>
using namespace std;

int main()
{
    int n, sum = 0;

    cout << "Enter a value for n: ";
    cin >> n;

    // Step through the odd numbers 1, 3, 5, ... up to n.
    // Add each one to sum and display the running total.

    return 0;
}
`,
    sampleInput: "9\n",
    theory: [
      {
        id: "15.2",
        ask: [{ type: "p", text: "Write a program that uses a for loop to display all the characters with ASCII values from 32 to 255 on the screen." }],
        answer: [
          { type: "code", text:
'//Displays the printable characters and their codes\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    for (int code = 32; code <= 255; code++)\n       cout << code << " " << char(code) << "   ";\n\n    cout << endl;\n\n    return 0;\n}' },
          { type: "note", text: "char(code) is an explicit conversion — without it, cout would print the number rather than the character it stands for. Codes above 127 are not standard ASCII and what appears for them depends on the machine, so do not be surprised if the tail end looks like nonsense." },
        ],
      },
      {
        id: "15.3",
        ask: [{ type: "p", text: "Write a program that uses a for loop to display the ASCII values of all the upper case letters, each letter with its value on its own line." }],
        answer: [
          { type: "code", text:
'//Displays each upper case letter with its ASCII value\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    for (char letter = \'A\'; letter <= \'Z\'; letter++)\n       cout << letter << " " << int(letter) << endl;\n\n    return 0;\n}' },
          { type: "note", text: "The counter is a char here, not an int, which the lesson said is allowed. It works because the letters have consecutive codes, so letter++ moves to the next letter. A is 65 and Z is 90." },
        ],
      },
      {
        id: "15.4",
        ask: [{ type: "p", text: "Redo Exercise 14.3 — the song about ten in the bed — using a for loop rather than a while loop." }],
        answer: [
          { type: "code", text:
'//Sings ten in the bed\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    for (int inBed = 10; inBed > 1; inBed--)\n    {\n       cout << "There were " << inBed << " in the bed" << endl;\n       cout << "And the little one said:" << endl;\n       cout << "\\"Roll over, roll over!\\"" << endl;\n       cout << "So they all rolled over," << endl;\n       cout << "And one fell out," << endl;\n    }\n\n    cout << "There was 1 in the bed" << endl;\n    cout << "And the little one said:" << endl;\n    cout << "\\"Good night!\\"" << endl;\n\n    return 0;\n}' },
          { type: "p", text: "Compare it with the while version. The three lines that dealt with the counter — setting it to 10, testing it, decreasing it — have collapsed into the for statement, and nothing else changed. This is the case a for loop is built for: the number of verses is known before the singing starts." },
        ],
      },
    ],
  },

  {
    id: "l16-nested-loops",
    part: "Part II · Conditional execution",
    lesson: 16,
    title: "Nested loops",
    teach: [
      { type: "p", text: "A loop can contain another loop, exactly as an if can contain another if. The one on the outside is the outer loop, the one inside its body is the inner loop." },
      { type: "p", text: "The order matters and catches people out: for every single pass of the outer loop, the inner loop runs all the way through from the beginning." },
      { type: "code", label: "Three rows of four", text:
'for (int row = 1; row <= 3; row++)\n{\n   for (int col = 1; col <= 4; col++)\n      cout << row << "," << col << "  ";\n\n   cout << endl;\n}' },
      { type: "note", text: "That prints twelve pairs, not seven — the inner loop runs four times for each of the three passes of the outer one. The endl sits in the outer loop, after the inner loop has finished, which is what puts each row on its own line." },
      { type: "p", text: "Nested loops are the natural fit for anything laid out in rows and columns: a table, a grid, a triangle of stars. The outer loop walks the rows and the inner one walks along each row." },
      { type: "note", text: "Needing two loops does not mean they should be nested. If the second job starts only once the first has finished, put the loops one after the other instead. Nesting them would run the second one over and over for no reason." },
    ],
    task: "Write a program that uses nested for loops to display a multiplication table for 1 to 9, laid out as a triangle: row 1 has one entry, row 2 has two, and so on up to row 9 with nine. Put a heading row of the numbers 1 to 9 across the top.",
    starter:
`//Displays a triangular multiplication table
#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    // A heading row: a blank corner, then 1 to 9 across the top

    // For each row 1 to 9:
    //    print the row number, then row * col for each col up to row
    //    end the line

    return 0;
}
`,
    theory: [
      {
        id: "16.1",
        ask: [
          { type: "p", text: "Write a program that calculates y in the equation y = x³ − 3x + 1 for various series of values of x. The program inputs a list of start and end values for x, and for each value of x from the start to the end it calculates y. For example, a start of 10 and an end of 20 calculates y for every x from 10 to 20. Each x and its y go on a separate line." },
          { type: "p", text: "Pairs of start and end values should be input until both are 0." },
        ],
        answer: [
          { type: "code", text:
'//Works out y = x^3 - 3x + 1 over ranges of x\n#include <iostream>\nusing namespace std;\n\nint main()\n{\n    int start, end;\n\n    cout << "Enter a start and end value (0 0 to stop): ";\n    cin >> start >> end;\n\n    while (start != 0 || end != 0)\n    {\n       for (int x = start; x <= end; x++)\n       {\n          int y = x * x * x - 3 * x + 1;\n          cout << "x = " << x << "   y = " << y << endl;\n       }\n\n       cout << "Enter a start and end value (0 0 to stop): ";\n       cin >> start >> end;\n    }\n\n    return 0;\n}' },
          { type: "note", text: "This is why both kinds of loop exist. The outer one is a while, because there is no way to know how many pairs the user will enter. The inner one is a for, because once a pair is in, the number of values of x is fixed. The condition stops only when both are 0, so || is right and && would be wrong." },
        ],
      },
      {
        id: "16.2",
        ask: [
          { type: "p", text: "Write a program that uses nested for loops to display this multiplication table." },
          { type: "code", text:
'     1   2    3    4    5    6    7    8    9\n 1   1\n 2   2   4\n 3   3   6    9\n 4   4   8    12   16\n 5   5   10   15   20   25\n 6   6   12   18   24   30   36\n 7   7   14   21   28   35   42   49\n 8   8   16   24   32   40   48   56   64\n 9   9   18   27   36   45   54   63   72   81' },
        ],
        answer: [
          { type: "code", text:
'//Displays a triangular multiplication table\n#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main()\n{\n    cout << setw(4) << " ";\n    for (int col = 1; col <= 9; col++)\n       cout << setw(5) << col;\n    cout << endl;\n\n    for (int row = 1; row <= 9; row++)\n    {\n       cout << setw(4) << row;\n\n       for (int col = 1; col <= row; col++)\n          cout << setw(5) << row * col;\n\n       cout << endl;\n    }\n\n    return 0;\n}' },
          { type: "note", text: "The one thing that makes it a triangle rather than a square is col <= row in the inner loop, so each row stops at the diagonal. setw(5) from <iomanip> pads every number to the same width, which is what keeps the columns lined up once the numbers reach two digits." },
        ],
      },
    ],
  },

  {
    id: "l17-using-functions",
    part: "Part III · Functions",
    lesson: 17,
    title: "Using functions",
    teach: [
      { type: "p", text: "C++ comes with a large collection of ready-made functions. You call one by writing its name followed by parentheses, with any values it needs inside them." },
      { type: "code", label: "Calling a function", text:
'#include <cmath>\n\nfloat distance = fabs(-6.32);   // 6.32\nfloat root = sqrt(49);          // 7\nfloat cube = pow(2, 3);         // 8' },
      { type: "p", text: "A function that returns a value hands something back, and you have to do something with it. There are three usual places to put it." },
      { type: "list", items: [
        "Assign it: answer = sqrt(x);",
        "Use it inside a bigger expression: answer = 20 * sqrt(x) - 41;",
        "Send it straight to output: cout << sqrt(x) << endl;",
      ] },
      { type: "note", text: "The third works, but prefer the first. Giving the result a name makes the line easier to read and lets you use the value more than once without calling the function again." },
      { type: "p", text: "Three functions worth knowing now: abs gives the absolute value of an integer and fabs the absolute value of a floating point number, sqrt gives a square root, and pow raises a number to a power. sqrt, fabs and pow need #include <cmath>." },
      { type: "p", text: "rand returns a large random integer, and needs #include <cstdlib>. On its own it is not random at all — it produces the same sequence every time the program runs. To get different numbers each run, seed it once near the top of main." },
      { type: "code", label: "Seeding the generator", text:
'#include <cstdlib>\n#include <ctime>\n\nsrand(time(0));   // once, near the start of main' },
      { type: "p", text: "time returns a large integer from the computer's clock, so it differs on each run, which is what makes the sequence differ. Once seeded, a random number in a range is built like this." },
      { type: "code", label: "A number in a range", text:
'RandomInteger = Smallest + Interval * (rand() % Many);\n\n// A random even number between 20 and 100:\n// 41 possible values, smallest 20, interval 2\nrandomEven = 2 * (rand() % 41) + 20;' },
      { type: "note", text: "rand() % Many gives a value from 0 up to Many - 1, which is why Many is the count of possible values rather than the largest one. Getting that off by one is the usual mistake." },
    ],
    task: "Pythagoras found that in a right-angled triangle the squares of the two shorter sides add up to the square of the longest. So if the longest side is a and the others are b and c, then a is the square root of b² + c². Ask for the lengths of the two shorter sides, then use pow and sqrt to calculate and display the length of the longest one.",
    starter:
`//Works out the long side of a right-angled triangle
#include <iostream>
#include <cmath>
using namespace std;

int main()
{
    float shortSide, otherSide, longSide;

    cout << "Enter the two shorter sides: ";
    cin >> shortSide >> otherSide;

    // Square each one with pow, add them, and take the square root

    // Display the answer

    return 0;
}
`,
    sampleInput: "3 4\n",
    theory: [
      {
        id: "17.2",
        ask: [
          { type: "p", text: "What results will these program fragments give? They also involve operator precedence, so the technique from Lesson 2 helps." },
          { type: "code", text:
'(i)   float x = -6.32;\n      float y = fabs(x) * 2;\n      What is y?\n\n(ii)  float x = 2;\n      float y = 2 * pow(x, 2) - 1;\n      float z = 2 * pow(x - 1, 2);\n      What are y and z?\n\n(iii) float x = -4;\n      float y = sqrt(fabs(x));\n      What is y?\n\n(iv)  float x = 3;\n      float y = 4;\n      float z = sqrt(pow(x, 2) + pow(y, 2));\n      What is z?' },
        ],
        answer: [
          { type: "code", text:
'(i)   y = 12.64      fabs(-6.32) is 6.32, then 6.32 * 2\n\n(ii)  y = 7         pow(2,2) is 4, so 2 * 4 - 1\n      z = 2         x - 1 is 1, pow(1,2) is 1, so 2 * 1\n\n(iii) y = 2         fabs(-4) is 4, and sqrt(4) is 2\n\n(iv)  z = 5         9 + 16 is 25, and sqrt(25) is 5' },
          { type: "note", text: "Compare y and z in (ii). Both have a 2, a pow and a subtraction, and they differ only in where the brackets are — in y the subtraction happens after the power, in z it happens to the argument before it. That is the whole of operator precedence in one pair of lines." },
        ],
      },
      {
        id: "17.4",
        ask: [
          { type: "p", text: "toupper and tolower convert a character between upper and lower case. Write a short program to test toupper: input a character, display the result of applying toupper to it. Then answer — what happens to a lower case letter, to an upper case letter, and to a character that is not a letter at all?" },
        ],
        answer: [
          { type: "code", text:
'//Tests what toupper does to a character\n#include <iostream>\n#include <cctype>\nusing namespace std;\n\nint main()\n{\n    char letter;\n\n    cout << "Enter a character: ";\n    cin >> letter;\n\n    cout << letter << " becomes " << char(toupper(letter)) << endl;\n\n    return 0;\n}' },
          { type: "list", items: [
            "A lower case letter comes back as its upper case equivalent: a becomes A.",
            "An upper case letter comes back unchanged. toupper does not toggle the case, it only ever converts upwards.",
            "A character that is not a letter comes back unchanged: 7 stays 7 and ? stays ?.",
          ] },
          { type: "note", text: "char(...) around the call matters. toupper returns an int, so without the conversion cout prints 65 rather than A. Also note the header is <cctype>, not <cmath>." },
        ],
      },
      {
        id: "17.1",
        ask: [{ type: "p", text: "Write a program to generate 6 random numbers for the South African Lottery. The numbers must all be between 1 and 49, and duplicates must be rejected by regenerating any number that has already come up." }],
        answer: [
          { type: "code", text:
'//Draws six different lottery numbers between 1 and 49\n#include <iostream>\n#include <cstdlib>\n#include <ctime>\nusing namespace std;\n\nint main()\n{\n    int drawn[6];\n    int count = 0;\n\n    srand(time(0));\n\n    while (count < 6)\n    {\n       int number = rand() % 49 + 1;\n\n       bool alreadyDrawn = false;\n       for (int i = 0; i < count; i++)\n          if (drawn[i] == number)\n             alreadyDrawn = true;\n\n       if (!alreadyDrawn)\n       {\n          drawn[count] = number;\n          count++;\n       }\n    }\n\n    for (int i = 0; i < 6; i++)\n       cout << drawn[i] << " ";\n    cout << endl;\n\n    return 0;\n}' },
          { type: "note", text: "This one uses an array, which arrives properly in Lesson 24 — there is no other way to remember six numbers at once. The outer loop is a while rather than a for because a rejected duplicate means going round again without count moving, so the number of iterations is not known in advance." },
        ],
      },
    ],
  },

  {
    id: "l18-writing-functions",
    part: "Part III · Functions",
    lesson: 18,
    title: "Writing functions",
    teach: [
      { type: "p", text: "You can write your own functions. One is worth writing whenever a piece of code is needed in more than one place, or when a chunk of work has a name that makes sense on its own." },
      { type: "code", label: "The shape of it", text:
'ReturnType FunctionName(ParameterList)\n{\n   Statements;\n   return ReturnValue;\n}' },
      { type: "code", label: "A real one", text:
'float areaOfCircle(float radius)\n{\n   const float PI = 3.14159;\n   return PI * radius * radius;\n}' },
      { type: "p", text: "You already know this shape — main is a function, with return type int, an empty parameter list, and a return statement handing back an int." },
      { type: "note", text: "return ends the function immediately. Any statements after it in the body are skipped, which is worth remembering when a function seems to be ignoring half of itself." },
      { type: "p", text: "The names in the function header are the formal parameters. The values in the call are the actual parameters. When the function is called, the values are copied across in order — first to first, second to second." },
      { type: "code", label: "Calling it", text:
'int main()\n{\n    float r = 3.0;\n    float area = areaOfCircle(r);\n\n    cout << "Area: " << area << endl;\n\n    return 0;\n}' },
      { type: "p", text: "The number of actual parameters must match the number of formal ones, and their types must match too, or the program will not compile." },
      { type: "note", text: "Each function is a self-contained unit. A function cannot see the variables of the function that called it. If it needs a value, that value has to be passed in as a parameter — there is no other route." },
      { type: "p", text: "Name a function after the value it gives back, since the call usually stands where that value is needed: areaOfCircle(r) reads properly, calculate(r) does not. Give the formal parameters different names from the variables you pass in, so it stays clear which is which." },
    ],
    task: "For every triangle, the sum of the lengths of any two sides is greater than the third side, which is how you test whether three numbers could be the sides of a real triangle. Write a bool function called isTriangle that takes three lengths and returns whether they form a valid triangle, then a main that reads three numbers and reports the answer.",
    starter:
`//Tests whether three lengths could form a triangle
#include <iostream>
using namespace std;

// A bool function taking three floats.
// All three pairs have to add up to more than the remaining side.


int main()
{
    float sideA, sideB, sideC;

    cout << "Enter three lengths: ";
    cin >> sideA >> sideB >> sideC;

    // Call the function and report the answer

    return 0;
}
`,
    sampleInput: "3 4 5\n",
    theory: [
      {
        id: "18.1",
        ask: [
          { type: "p", text: "Look at this program skeleton and give the line numbers for each concept in the table below." },
          { type: "code", text:
' 1 // Illustrates reference parameters\n 2 #include <iostream>\n 3 using namespace std;\n 4\n 5 bool test(float par1, float par2, float par3)\n 6 {\n 7\n 8 }\n 9\n10 int main( )\n11 {\n12    float var1, var2, var3;\n13\n14    if (test(var1, var2, var3))\n15    {\n16\n17    }\n18\n19    return 0;\n20 }' },
          { type: "code", text:
'Concept                Line no(s)\n---------------------  ----------\nFunction heading\nFormal parameters\nReturn type\nFunction call\nActual parameters\nFirst line executed' },
        ],
        answer: [
          { type: "code", text:
'Concept                Line no(s)\n---------------------  ----------\nFunction heading       5\nFormal parameters      5           (par1, par2, par3)\nReturn type            5           (bool)\nFunction call          14\nActual parameters      14          (var1, var2, var3)\nFirst line executed    12' },
          { type: "note", text: "The last row is the one people get wrong. Line 5 is the first line of the file with code on it, but a program starts running at the top of main — and the function on line 5 does not run until line 14 calls it. Being defined and being executed are different things." },
        ],
      },
      {
        id: "18.2",
        ask: [{ type: "p", text: "For every triangle, the sum of any two sides is greater than the third. Write a program that uses this to test whether three numbers represent the valid sides of a triangle." }],
        answer: [
          { type: "code", text:
'//Tests whether three lengths could form a triangle\n#include <iostream>\nusing namespace std;\n\nbool isTriangle(float first, float second, float third)\n{\n   return first + second > third\n       && first + third > second\n       && second + third > first;\n}\n\nint main()\n{\n    float sideA, sideB, sideC;\n\n    cout << "Enter three lengths: ";\n    cin >> sideA >> sideB >> sideC;\n\n    if (isTriangle(sideA, sideB, sideC))\n       cout << "Those are the sides of a triangle." << endl;\n    else\n       cout << "Those cannot be the sides of a triangle." << endl;\n\n    return 0;\n}' },
          { type: "note", text: "All three pairs have to be checked, not just one. Try 1, 2 and 10: the first two add to 3, which is nowhere near 10, so it fails — but a test of only one pair would have let it through. The formal parameters are called first, second and third precisely so they cannot be confused with sideA, sideB and sideC in main." },
        ],
      },
    ],
  },

  {
    id: "l19-scope",
    part: "Part III · Functions",
    lesson: 19,
    title: "Local and global variables",
    teach: [
      { type: "p", text: "Where a variable is declared decides who can see it. A variable declared inside a function is local to that function, and no other function can reach it. A variable declared before all the functions is global, and every function can reach it." },
      { type: "code", label: "Local and global", text:
'#include <iostream>\nusing namespace std;\n\nint counter;        // global - every function can see it\n\nint main()\n{\n    int total;      // local to main - only main can see it\n\n    return 0;\n}' },
      { type: "p", text: "Globals look convenient, which is the problem. Any function can change one, so when its value turns out to be wrong there is nothing to narrow down the search: the culprit could be anywhere in the program." },
      { type: "note", text: "Use local variables when a variable belongs to one function. When two functions need the same value, pass it as a parameter rather than making it global. Both rules exist to stop a function quietly changing something another function was relying on." },
      { type: "p", text: "There is a second payoff. If a function takes everything it needs through its parameter list, that list tells the reader exactly what the function works on. Whatever local variables it uses inside are nobody else's business, and the function can be lifted into another program unchanged." },
      { type: "note", text: "A local variable with the same name as a global one hides the global inside that function. The global still exists and still holds its value — the function simply cannot see it any more. That is a common source of a function that appears to change nothing." },
    ],
    task: "Write a program with two functions, sum and product, that each take an integer n and return the sum and the product of the numbers 1 to n. Use no global variables at all: n must be passed in as a parameter, and each function must keep its own running total in a local variable.",
    starter:
`//Works out the sum and the product of 1 to n
#include <iostream>
using namespace std;

// int sum(int limit) - adds 1 + 2 + ... + limit


// int product(int limit) - multiplies 1 * 2 * ... * limit


int main()
{
    int n;

    cout << "Enter a value for n: ";
    cin >> n;

    // Call both functions and display the two answers

    return 0;
}
`,
    sampleInput: "5\n",
    theory: [
      {
        id: "19.2",
        ask: [
          { type: "p", text: "Study this program and state, in terms of line numbers, where each variable is accessible." },
          { type: "code", text:
' 1 //Determines the sum and product of 1 to n\n 2 #include <iostream>\n 3 using namespace std;\n 4\n 5 int n, answer;\n 6\n 7 int sum( )\n 8 {\n 9    int i;\n10    for (i = 1; i <= n; i++)\n11       answer += i;\n12    return answer;\n13 }\n14\n15 int product( )\n16 {\n17    int answer = 1;\n18    for (int i = 2; i <= n; i++)\n19       answer *= i;\n20    return answer;\n21 }' },
        ],
        answer: [
          { type: "code", text:
'n              global, declared line 5\n               accessible everywhere after line 5,\n               so lines 10 and 18\n\nanswer         global, declared line 5\n(the global)   accessible lines 11 and 12, but NOT inside\n               product, where a local of the same name hides it\n\ni in sum       local to sum, declared line 9\n               accessible lines 10, 11\n\nanswer         local to product, declared line 17\n(the local)    accessible lines 17 to 20, and hides the global\n\ni in product   declared inside the for statement on line 18\n               accessible only lines 18 and 19' },
          { type: "note", text: "Two different variables here are called answer and two are called i, and the program works only by accident. sum adds to the global answer without ever setting it back to 0, so calling sum twice gives a wrong answer the second time. That is exactly the failure globals invite." },
        ],
      },
      {
        id: "19.1",
        ask: [{ type: "p", text: "Rewrite the program from Exercise 19.2 so that it uses only local variables and parameters, and no global variables at all." }],
        answer: [
          { type: "code", text:
'//Determines the sum and product of 1 to n\n#include <iostream>\nusing namespace std;\n\nint sum(int limit)\n{\n   int total = 0;\n\n   for (int i = 1; i <= limit; i++)\n      total += i;\n\n   return total;\n}\n\nint product(int limit)\n{\n   int total = 1;\n\n   for (int i = 2; i <= limit; i++)\n      total *= i;\n\n   return total;\n}\n\nint main()\n{\n    int n;\n\n    cout << "Enter a value for n: ";\n    cin >> n;\n\n    cout << "Sum: " << sum(n) << endl;\n    cout << "Product: " << product(n) << endl;\n\n    return 0;\n}' },
          { type: "note", text: "Every problem in the original is gone. Each function sets up its own total, so calling one twice gives the same answer twice. n arrives as a parameter, so the header says what the function needs. And either function could now be copied into another program without dragging a global along with it." },
        ],
      },
    ],
  },

  {
    id: "l20-void",
    part: "Part III · Functions",
    lesson: 20,
    title: "Void functions",
    teach: [
      { type: "p", text: "Not every function has an answer to give back. A function that displays something, or draws something, does its work on the screen rather than handing a value to the caller. Its return type is void." },
      { type: "code", label: "The shape of it", text:
'void FunctionName(FormalParameterList)\n{\n   Statements;\n}' },
      { type: "code", label: "A real one", text:
'void printLine(char symbol, int width)\n{\n   for (int i = 1; i <= width; i++)\n      cout << symbol;\n\n   cout << endl;\n}' },
      { type: "p", text: "Because there is no value coming back, a call to a void function is a statement in its own right rather than part of an expression." },
      { type: "code", label: "Calling it", text:
'printLine(\'*\', 20);      // a statement on its own line\n\n// not:\n// answer = printLine(\'*\', 20);' },
      { type: "p", text: "The parameters work exactly as before. Values are copied across in order, first to first and second to second, and the number and types must match or it will not compile." },
      { type: "note", text: "A void function may contain return; with no value, which ends it early. This module does not use it — if a function needs to stop halfway, an if is usually clearer." },
      { type: "p", text: "Write a void function when a group of statements belong together as one subtask, when the same code appears in more than one place, or when a chunk of input or output is worth naming." },
    ],
    task: "Write a program that draws a frame of asterisks. The user enters two integers for the width and the height. A width of 7 and a height of 5 gives a frame 7 asterisks across and 5 rows deep, hollow in the middle, with the asterisks in the top and bottom rows separated by single spaces. Use void functions for the solid rows and the hollow ones.",
    starter:
`//Draws a hollow frame of asterisks
#include <iostream>
using namespace std;

// void solidRow(int width) - a full row: * * * * *


// void hollowRow(int width) - a star, spaces, then a star


int main()
{
    int width, height;

    cout << "Enter the width: ";
    cin >> width;
    cout << "Enter the height: ";
    cin >> height;

    // A solid row, then height - 2 hollow rows, then a solid row

    return 0;
}
`,
    sampleInput: "7\n5\n",
    theory: [
      {
        id: "20.1",
        ask: [
          { type: "p", text: "Write a program to draw a frame of asterisks, where the user enters the width and the height." },
          { type: "code", label: "Width 7, height 5", text:
'* * * * * * *\n*           *\n*           *\n*           *\n* * * * * * *' },
        ],
        answer: [
          { type: "code", text:
'//Draws a hollow frame of asterisks\n#include <iostream>\nusing namespace std;\n\nvoid solidRow(int width)\n{\n   for (int i = 1; i <= width; i++)\n      cout << "* ";\n\n   cout << endl;\n}\n\nvoid hollowRow(int width)\n{\n   cout << "* ";\n\n   for (int i = 2; i < width; i++)\n      cout << "  ";\n\n   cout << "*" << endl;\n}\n\nint main()\n{\n    int width, height;\n\n    cout << "Enter the width: ";\n    cin >> width;\n    cout << "Enter the height: ";\n    cin >> height;\n\n    solidRow(width);\n\n    for (int row = 2; row < height; row++)\n       hollowRow(width);\n\n    solidRow(width);\n\n    return 0;\n}' },
          { type: "note", text: "The two middle-row spaces have to match the \"* \" of the solid row, two characters each, or the right edge will not line up. The loop runs from 2 to height - 1 because the first and last rows are drawn separately — that is height - 2 hollow rows, which is 3 when the height is 5." },
        ],
      },
      {
        id: "20.2",
        ask: [
          { type: "p", text: "Write a program to draw a tree, of any size the user asks for. The one below came from a size of 4." },
          { type: "code", text:
'   *\n  * *\n * * *\n* * * *\n   *\n   *' },
        ],
        answer: [
          { type: "code", text:
'//Draws a tree of a size chosen by the user\n#include <iostream>\nusing namespace std;\n\nvoid treeRow(int row, int size)\n{\n   for (int space = 1; space <= size - row; space++)\n      cout << " ";\n\n   for (int star = 1; star <= row; star++)\n      cout << "* ";\n\n   cout << endl;\n}\n\nvoid trunkRow(int size)\n{\n   for (int space = 1; space < size; space++)\n      cout << " ";\n\n   cout << "*" << endl;\n}\n\nint main()\n{\n    int size;\n\n    cout << "Enter the size of the tree: ";\n    cin >> size;\n\n    for (int row = 1; row <= size; row++)\n       treeRow(row, size);\n\n    trunkRow(size);\n    trunkRow(size);\n\n    return 0;\n}' },
          { type: "note", text: "The shape comes from the spaces, not the stars. Row 1 needs size - 1 spaces and one star, row 2 needs one space fewer and one star more, and so on — which is why treeRow needs to know both which row it is on and how big the tree is." },
        ],
      },
    ],
  },
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
