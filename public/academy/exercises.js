/* COS1511 practice exercises.
   Taken from the UNISA Jan/Feb 2025 and Oct/Nov 2025 examination papers.
   Wording is condensed; the requirements, values and expected output are as
   printed. These are past papers used for teaching, not model answers. */

const EXERCISES = [
  {
    id: "jan-q3a-hotel",
    title: "Hotel room discount",
    source: "Jan/Feb 2025 · Q3a",
    marks: 10,
    brief: [
      { type: "p", text: "The cost of renting a room at a hotel is R900 per night. For special occasions the hotel offers a discount:" },
      { type: "list", items: [
        "if at least 10 rooms are booked, the discount is 10%",
        "if at least 20 rooms are booked, the discount is 20%",
        "if more than or equal to 30 rooms are booked, the discount is 30%",
        "in addition, if rooms are booked for at least three days, a further 5% discount applies",
      ] },
      { type: "p", text: "Prompt the user for the cost of renting one room, the number of rooms booked, the number of days, and the sales tax as a percent." },
      { type: "code", label: "Expected output", text:
"Please enter the following:\n            cost per room: 1000 sales tax\n                 per room: 10\n     the number of rooms: 35\n         number of days: 2\n\nThe total cost for one room is R1000\nThe discount per room is 30%\nThe number of rooms booked: 35\nThe total cost of the rooms are R: 70000\nThe sales tax paid is : 10%\nThe total cost per booking is R77000" },
    ],
    sampleInput: "1000\n10\n35\n2\n",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    float costPerRoom, salesTax;
    int numberOfRooms, numberOfDays;

    // Prompt for and read the four values

    // Work out the discount from the number of rooms and days

    // Display the output exactly as shown in the question

    return 0;
}
`,
  },

  {
    id: "jan-q3b-experiments",
    title: "Experiment averages (nested loops)",
    source: "Jan/Feb 2025 · Q3b",
    marks: 10,
    brief: [
      { type: "p", text: "Four experiments are performed, each consisting of five test results. Use a nested loop to compute and display the average of the test results for each experiment. Display the average with a precision of two digits after the decimal point." },
      { type: "code", label: "The results", text:
"1st experiment:  23.2  31    16.9  27    25.4\n2nd experiment:  34.8  45.2  27.9  36.8  33.4\n3rd experiment:  19.4  16.8  10.2  20.8  18.9\n4th experiment:  36.9  39    49.2  45.1  42.7" },
      { type: "p", text: "Note the precision requirement — this needs <iomanip>." },
    ],
    sampleInput: "23.2 31 16.9 27 25.4\n34.8 45.2 27.9 36.8 33.4\n19.4 16.8 10.2 20.8 18.9\n36.9 39 49.2 45.1 42.7\n",
    starter:
`#include <iostream>
#include <iomanip>
using namespace std;

int main()
{
    double result, average;

    for (int exp = 0; exp < 4; exp++)
    {
        // initialise the total for this experiment

        cout << "Please enter results for experiment no " << exp + 1
             << ": " << endl;

        for (int i = 0; i < 5; i++)
        {
            cout << "Result no " << i + 1 << ": ";
            // read a result and add it to the total
        }

        // calculate the average

        // set the output to two digits after the decimal point

        cout << "Average for experiment no " << exp + 1 << ": "
             << average << endl << endl;
    }
    return 0;
}
`,
  },

  {
    id: "jan-q3c-bulb",
    title: "Lightbulb life expectancy (switch)",
    source: "Jan/Feb 2025 · Q3c",
    marks: 10,
    brief: [
      { type: "p", text: "The average life expectancy in hours of a lightbulb, based on its wattage:" },
      { type: "code", label: "Table", text:
"Watts    Life expectancy (hours)\n 25          25000\n 40           1000\n 60           1000\n 75            750\n100            750" },
      { type: "p", text: "Write a program that, when given a bulb's wattage, displays the average life expectancy. You have to use the switch statement." },
    ],
    sampleInput: "60\n",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int watts;

    cout << "Enter the wattage of the bulb: ";
    cin >> watts;

    // Use a switch statement on watts.
    // Remember that 40 and 60 share an answer, and so do 75 and 100.

    return 0;
}
`,
  },

  {
    id: "jan-q2c-evens",
    title: "Count evens, odds and zeros (switch)",
    source: "Jan/Feb 2025 · Q2c",
    marks: 8,
    brief: [
      { type: "p", text: "Read 10 integers, which may be positive, negative or zero. Echo each one, then report how many were even, how many of those were zero, and how many were odd. The counting must be done with a switch statement on number % 2." },
      { type: "code", label: "Expected output", text:
"Please enter 10 integers, positive, negative, or zeros.\nThe numbers you entered are:\n2\n7\n-4\n-3\n0\n7\n4\n0\n-9\n-4\n\nThere are 6 evens, which includes 2 zeros.\nThe number of odd numbers is: 4" },
      { type: "p", text: "Careful: in C++ the remainder of a negative odd number is -1, not 1." },
    ],
    sampleInput: "2\n7\n-4\n-3\n0\n7\n4\n0\n-9\n-4\n",
    starter:
`#include <iostream>
using namespace std;

const int LIMIT = 10;

int main()
{
    int counter;
    int number;

    int zeros = 0;
    int odds = 0;
    int evens = 0;

    cout << "Please enter " << LIMIT << " integers, "
         << "positive, negative, or zeros." << endl;
    cout << "The numbers you entered are:" << endl;

    for (int counter = 1; counter <= LIMIT; counter++)
    {
        // read a number, echo it, then switch on number % 2

    }
    cout << endl;

    cout << "There are " << evens << " evens, "
         << "which includes " << zeros << " zeros." << endl;
    cout << "The number of odd numbers is: " << odds << endl;

    return 0;
}
`,
  },

  {
    id: "oct-q2-outfits",
    title: "School play outfit fees",
    source: "Oct/Nov 2025 · Q2",
    marks: 12,
    brief: [
      { type: "p", text: "Parents of pupils at Park Primary School pay for outfits for the annual play. All pupils take part except Grade 0." },
      { type: "list", items: [
        "Grade 1 and 2: R45",
        "Grade 3 and 4: R55",
        "Grade 5 and 6: R65",
        "Grade 7 may play one or two roles. If the role is a leadrole, they may play only one role, and the cost is R80.",
      ] },
      { type: "p", text: "Write only the necessary C++ statements to calculate and display the amount to be paid, or an appropriate error message. Assume values have already been assigned." },
      { type: "code", label: "Variables given", text: "int grade;\nint fee;\nbool leadrole;   // true if a child plays a leadrole" },
    ],
    sampleInput: "7\n1\n",
    starter:
`#include <iostream>
using namespace std;

int main()
{
    int grade;
    int fee;
    bool leadrole;

    // For practice, read the values in so you can test your logic.
    cout << "Grade: ";
    cin >> grade;
    cout << "Leadrole (1 = yes, 0 = no): ";
    cin >> leadrole;

    // Your statements below

    return 0;
}
`,
  },

  {
    id: "oct-q4-removechar",
    title: "removeChar function (strings)",
    source: "Oct/Nov 2025 · Q4",
    marks: 5,
    brief: [
      { type: "p", text: "Write a function removeChar that receives a string as a parameter, finds all occurrences of \"e\" and erases them, then returns the changed string to main()." },
      { type: "code", label: "Example", text: 'Input:  "enter a sentence"\nOutput: "ntr a sntnc"' },
      { type: "p", text: "The paper offers these string functions: size(), substr(startPos, length), find(substring), find(substring, startPos), insert(insertPos, substring), erase(startPos, length), replace(startPos, length, substring)." },
    ],
    sampleInput: "enter a sentence\n",
    expectedOutput: "Enter a sentence:\nNew sentence:\nntr a sntnc",
    starter:
`#include <iostream>
#include <string>
using namespace std;

// insert function removeChar here

int main() {
    string sentence;
    // prompt user to enter a sentence
    cout << "Enter a sentence:" << endl;
    getline(cin, sentence, '\\n');
    // output
    cout << "New sentence:" << endl;
    cout << removeChar(sentence) << endl;
    return 0;
}
`,
  },

  {
    id: "oct-q32-prime",
    title: "Fix the prime number program",
    source: "Oct/Nov 2025 · Q3.2",
    marks: 10,
    brief: [
      { type: "p", text: "The program below has several errors: a missing include, an undeclared variable, a missing function header, missing semicolons and return values, and misplaced braces. Rewrite it with all the errors fixed." },
      { type: "p", text: "Fix it in the editor and run it until it compiles and gives the right answer. A number is prime when nothing between 2 and n/2 divides into it exactly." },
    ],
    sampleInput: "7\n",
    starter:
`#include <iostream>
int prime(int n);
int main(){
int a = 0;
cout << "Enter positive integer to check: ";
cin >> num;
//Argument num is passed to check() function
a = prime(num);
if(a == 1)
    cout << num << " is not a prime number."
 else
    cout<< num << " is a prime number."
 }
// This function returns integer value.
 {
int i;
 for(i = 2; i <= n/2; ++i){
        if(n % i == 0)
            return
 }
   return 0
 }
`,
  },
];
