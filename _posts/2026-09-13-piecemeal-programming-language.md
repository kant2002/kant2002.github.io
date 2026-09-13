---
layout: post
title:  "Finding dependencies in the standard runtimes of the different programming languages"
date:   2026-09-13 18:10:00 +0200
categories: en compilers
comments: true
---

For some reasons I get's easiely irritated when Go developers claim that their language produce small executables. I think it's unreasonable last 5 years at least. At the same time, it's hard topic to compare.
I have experiment which maybe help to see at least partially what parts of language and runtime actually small in different programming languages. For now, I have only 4 languages: C, Rust, C# and Go. Obviously experiment can be expanded.

<!--more-->

So the idea is following, create lots of trivial
applications, define some components from which this application constist, for example language runtime, print line function, string replace function, etc. Then we can measure what compiler produces under more or less normal conditions, and solve linear equations which we curate. All programs should use functions from standard library if possible, and use dependencies only if its' really necessary. I understand that different dependencies may give different results, but for now, when set of applications is small, I think it's manageable.

## Results

After that, would be lot of boring stuff which explain how I setup experiement, so you can better understand how to intepret results.

| Component                 | C - Size (B) |Rust - Size (B) |C# - Size (B) |Go - Size (B) |
| ----------------------    | -------: | -------: | -------: | -------: | 
| Runtime                   |   10,240 |  123,904 |  868,352 |1,228,800 |
| PrintLine                 |        0 |    7,168 |   65,024 |  442,368 |
| ParseFloat                |      512 |   17,920 |   26,112 |   17,920 |
| ParseInt                  |        0 |        0 |    1,024 |   23,040 |
| RandInt                   |      512 |   12,800 |      512 |   13,312 |
| SumStrings                |    1,024 |      512 |        0 |        0 |
| StrReverse                |      512 |    1,536 |   16,896 |    1,536 |
| StrReplace                |      512 |    2,560 |    7,168 |   11,776 |
| ToLower                   |    1,024 |    8,704 |    2,048 |   14,336 |
| StrEmpty                  |    1,024 |        0 |        0 |        0 |
| ArrayInit                 |        0 |      512 |    3,584 |    1,024 |
| CmdLineArgs               |        0 |    6,656 |        0 |        0 |
| CmdLineArgs2              |    4,608 |  510,976 |1,896,448 |   89,088 |
| ReadFile                  |    1,024 |   12,800 |  200,704 |  115,200 |
| WriteFile                 |      512 |   11,264 |  182,272 |   14,848 |
| CreateFile                |      512 |    8,704 |  181,248 |   15,360 |
| CreateDir                 |      512 |   16,896 |   14,336 |    9,728 |
| CreateDir2                |    1,536 |   16,896 |   14,336 |  113,664 |
| DeleteFile                |      512 |   10,240 |    6,144 |   11,264 |
| ExistsFile                |      512 |    7,168 |   10,240 |  108,544 |
| CopyFile                  |    1,536 |    1,536 |   13,312 |   34,816 |
| ZipFile                   |  189,440 |  916,992 |  971,776 |  329,216 |
| Win32Window               |    1,536 |    7,168 |  120,320 |  483,840 |
| Win32Button               |        0 |    1,536 |    1,024 |        0 |
| ProxyCallBaseline         |      512 |      512 |    1,536 |    4,608 |
| ProxyCall                 |        0 |        0 |  -66,560 |      512 |
| RegexMatch                |  317,952 |1,547,264 |  550,400 |  303,104 |
| TcpSimple                 |    1,536 |   40,960 |  194,048 |  679,936 |
| CsvWrite                  |    2,560 |   47,104 |  192,000 |   31,232 |
| ParametersObjectBaseline  |    1,536 |   25,088 |   22,016 |   22,016 |
| ParametersObject          |     -512 |        0 |     -512 |      512 |
| JsonWrite                 |    7,168 |   10,752 |1,041,408 |1,071,616 |

Description of each experiments

Random helpers

- *PrintLine* Print line to the console.
- *ParseFloat* Parse string with float value into float32 datatype.
- *ParseInt* Parse string with integer value into int32 datatype.
- *RandInt* Generate pseudo random number

String operations

- *SumStrings* The perform concatenation of two string types in the language.
- *StrReverse* Reverse constant string
- *StrReplace* Replace constant search string with target string one time
- *ToLower* Convert string to lowercase using default locale parameters in the langugage.
- *StrEmpty* Check that string is empty.

Language featuers

- *ArrayInit* Initialize array of 100 bytes and print all 100 of them.
- *ProxyCall* How much cost have proxy methods which do nothing and just bypass calls to underlying worker methods.
- *ParametersObject* Use parameter objects instead of long list of parameters.

Command line handling

- *CmdLineArgs* Printing all passed command line args
- *CmdLineArgs2* Parse 4 command line arguments and print them.

Work with files and directories

- *ReadFile* Read file and prints it content to the console
- *WriteFile* Write string content to file
- *CreateFile* Create empty file with the given name.
- *CreateDir* Create empty directory with the given name.
- *CreateDir2* Create empty directory with the given name and all subdirectories in path.
- *DeleteFile* Delete existing file.
- *ExistsFile* Check if file exists and print message.
- *CopyFile* Copy file into other file.

Archives

- *ZipFile* Archive string into single file packaged into ZIP file.

UI work

- *Win32Window* Create empty Win32 window.
- *Win32Button* Create Win32 window with one button.

Regex

- *RegexMatch* Check if string match with pattern defined as regular expression

Networking
- *TcpSimple* The TCP server which wrote Helo World to connected client and close the connection.

File format serialization

- *CsvWrite* Write simple CSV file with 3 column and proper escaping. All data is hardcoded.
- *JsonWrite* Write simple JSON with 3 properties. All data is hardcoded.


## Experiment structure

The experiment sitting on the [GitHub repo](https://github.com/kant2002/piecemealpl), maybe I will move it to Codeberg.

Each experiment is set of 4 applcations which reside in one file. All build infrastructure is built using conventions, so automating measurement is possible. Example of empty experiment can be found in the `.template` folder. List of all experiments registered in the `measure.ps1`. Linear equations defined in the `calc.fsx` file, for now things a bit fragile, since I have to manually maintain order, but it's easier while I'm alone. When building I do not enable agressive optimization at all, since my goal not to find minimum possible with language, but to map dependencies inside language's standard libary and common libraries, and how it affects side of code.

## Findings

I cannot conclusively say lot, you can see that from numbers. C is still language with smaller footprint. Rust is second closer. C# and Go give me wierd feeling, that they try to fight for third place, but each slip and fail spectacularly in different areas. C# seems to be have better codegen, but Go have smaller standard library. Rust have sometimes really havy dependencies for unknown for me reasons.

I really would like to continue measuring languages, and their parts, but probably need help with community to have simple ideas, and implementing all of them. Would be glad if you go to [repository](https://github.com/kant2002/piecemealpl) and share what additional measurements you think would be interested to see, and easy to implement.
