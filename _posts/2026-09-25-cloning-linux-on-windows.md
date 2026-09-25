---
layout: post
title:  "How to clone Linux on Windows"
date:   2026-09-25 11:55:00 +0200
categories: en git hacking
comments: true
---


I have no idea how I keep finding these adventures for myself, but sometimes broken software finds me, even when I’m not actively looking for trouble. This is today’s adventure about Windows’ weirdness and cloning Linux.

<!--more-->

There was no sign of a problems at all. I was calmly reverse-engineering an automatic symbolic overwrite tool, trying to build my own equivalent. In general, it was a perfectly normal nerdy pastime. Reversing the behavior of poorly documented systems is fun. Even when it’s something simple like the `prn` printing function. After I was satisfied with my reversing findings, I managed to create a test for this function’s behavior and saved it to `prn.ap`. Then, like a decent person, I decided this was pretty good work and I wanted to save it. I clicked Commit in Zed and, to my delight, it failed and unmarked the file. In other words, it never made it into the index. Again, as a normal programmer, I decided to try again with hope that it would work the second time. Of course it did not. That really confused me, so I went to the terminal to see what was actually going on, because Zed is not very good at showing proper Git error messages. This is what the terminal showed me.

```shell
git add .\samples\prn.ap -f
error: open("samples/prn.ap"): No such file or directory
error: unable to index file 'samples/prn.ap'
fatal: adding files failed
```

Okay, I thought, something is definitely wrong; maybe the file got deleted. I went back to Zed — the file was there, I saved it a few times, and tried to add it again. Of course with the same result. You can see how I didn’t want to accept reality and tried to bargain with it, assuming it would fix itself somehow. Then I checked whether the file actually existed: `more .\samples\prn.ap`. It did exist, and the contents were not empty. At that point I decided it was time for the magical AI wand. The AI told me that `prn` was probably a reserved Windows device name. Okay, I thought, that makes sense, but I have `prn.ap`, which is still a reserved name. Long story short, I went back to bargaining with the universe and started digging into the source of Git for Windows. The Windows-specific file handling is covered in tests here: https://github.com/git-for-windows/git/blame/c731bc939fc0ce5b75ddb6766589e7d39f1ba095/t/t0060-path-utils.sh#L591. At first, I was confused as to why `prn.abc` is explicitly checked in the test, but if you go to the commit that added the test — https://github.com/git-for-windows/git/commit/4dc42c6c1867a52e22f1f04a1a247b5a7538b8af — it becomes more or less clear that the issue is [documented by Microsoft](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#win32-file-namespaces). To save you the trouble of finding what matters, here is a quote from the site.

```
Do not use the following reserved names for the name of a file:
CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, COM¹, COM², COM³, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, LPT9, LPT¹, LPT², and LPT³. 
Also avoid these names followed immediately by an extension; for example, NUL.txt and NUL.tar.gz are both equivalent to NUL. 
For more information, see Namespaces (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#win32-file-namespaces).
```

Okay, from this it is clear that the maintainers of Git for Windows take a conservative approach and over-protect themselves by relying on the word `avoid`.

# Searching for the truth

At this point I realized I bump right into a Git for Windows issue. I did not like that. I decided at least to report the problem. The issue is documented here: https://github.com/git-for-windows/git/issues/4005. As you can see, four years passed before people noticed it and it started bothering someone. I was excited and wrote: “let’s just change it all to Windows 11 because it works there.” Don’t do that! After the adrenaline rush ended, I read the issue carefully and saw that people had already written about Windows 11 earlier, and the maintainer responded pragmatically that he supports millions of users and cannot just change things arbitrarily. That is, of course, a correct position, so I tried to earn the person’s trust and discuss alternative ways to fix it. Unfortunately, it seemed that contact still did not happens, even though there was more evidence that it worked not only on my machine. This is a typical situation in open source projects when unstoppable momentum collides with an immovable maintainer. I think you can clearly see the roles in this play. What can be done in such a situation? I decided it was worth going to people I know at Microsoft and asking what they thought, and whether there was any way to reach the Windows team or at least get someone to document better when life became better, from which Windows version. The second path was to use my MVP status and try to contact Microsoft, or similar MVPs who might offer at least some advice. These are typical administrative things that often do not work, but they sometimes work very well, so they are always worth trying. The matrix helps those who keep moving forward. While these weak processes are in motion, I’m left with only one option: try to see how to make a fork and fix the issue.

# How to build your own Git for Windows

The project is actually very well set up for contributions. If you go to the main page https://gitforwindows.org/, you will see a section called `Git for Windows SDK: Contributing Code`; simply download the Git for Windows SDK from there. When prompted, choose the 64-bit version. Why? Probably because we live in a 64-bit world. In practice, the SDK is a customized MINGW installation with some scripts added to make project builds convenient. I installed the SDK in `c:\git-sdk-64`. That is not especially important. After installation, launch the SDK. On the first start, the SDK initializes automatically, so you will need a stable internet connection. At least it is better to have one, because I don’t know how the system behaves if something is missing there, and how difficult it would be to recover the SDK back to a working state. After initialization completes, you are prompted to read the help via the `sdk help` command. I recommend reading it; even if there is not much information, and clearly most hackers do not need to run every command. This is what it printed for me:

```
The 'sdk' shell function helps you to get up and running
with the Git for Windows SDK. The available subcommands are:

create-desktop-icon: install a desktop icon that starts the Git for
    Windows SDK Bash.

cd <project>: initialize/update a worktree and cd into it. Known projects:
        git git-extra msys2-runtime installer build-extra
        MINGW-packages MSYS2-packages mingw-w64-busybox mingw-w64-curl
        mingw-w64-cv2pdb mingw-w64-git mingw-w64-git-credential-manager
        mingw-w64-git-lfs mingw-w64-git-sizer mingw-w64-wintoast
        bash curl gawk gnupg heimdal mintty nodejs openssh openssl
        perl perl-HTML-Parser perl-Locale-Gettext perl-Net-SSLeay
        perl-TermReadKey perl-XML-Parser perl-YAML-Syck subversion tig

init <project>: initialize and/or update a worktree. Known projects
    are the same as for the 'cd' command.

build <project>: builds one of the following:
        git-and-installer git git-extra msys2-runtime installer
        mingw-w64-busybox mingw-w64-curl mingw-w64-cv2pdb mingw-w64-git
        mingw-w64-git-credential-manager mingw-w64-git-lfs
        mingw-w64-git-sizer mingw-w64-wintoast bash curl gawk gnupg
        heimdal mintty nodejs openssh openssl perl perl-HTML-Parser
        perl-Locale-Gettext perl-Net-SSLeay perl-TermReadKey
        perl-XML-Parser perl-YAML-Syck subversion tig

edit <file>: edit a well-known file. Well-known files are:
        git-sdk.sh sdk.completion ReleaseNotes.md install.iss

reload: reload the 'sdk' function.
````

I personally used only the following commands: `git build git-and-installer`, `git init git`, and `git build git`. The second command is run once at the start of the hack. The third is more about a quick compile check without building the installer or tests.

I ran `git init git`, and now everything was ready for hacking. I edited the files by opening them in Explorer with Notepad++, though you can do it however you like. This is not important, because you will edit in one app and compile via the Git for Windows SDK. As I described earlier, I decided that the desired behavior should apply only on Windows 11, and this would be relatively safe. That means I needed to add a function that checks whether I am on Windows 11 and use it in the function that validates whether a file name is usable on Windows. A quick search for the word `AUX` showed me that the function where I wanted to make the change was `is_valid_win32_path` in `compat/mingw.c`. This was not obvious at first, but the SDK clones the source into `C:\git-sdk-64\usr\src\git`. So I opened `C:\git-sdk-64\usr\src\git\compat\mingw.c` for editing. In principle, changing `is_valid_win32_path` was straightforward, but finding a way to detect Windows 11 was the hard part. Initially I was confused and thought that standard methods like `GetVersion` / `GetVersionEx` only return Windows 10. Naїve me, trusting blindly internet, so I go with loading `ntdll.dll` an importing `RtlGetNtVersionNumbers`, which works but ugly. Git for Windows maintainer kindly correct me that this is overly complicated. The current patch can be seen in the issue discussion here: https://github.com/git-for-windows/git/issues/4005#issuecomment-5760570321

Let’s build it. `sdk build git` started grumbling and produced:

```
    CARGO target/x86_64-pc-windows-gnu/release/libgitcore.a
error[E0463]: can't find crate for `std`
  |
  = note: the `x86_64-pc-windows-gnu` target may not be installed
  = help: consider downloading the target with `rustup target add x86_64-pc-windows-gnu`

For more information about this error, try `rustc --explain E0463`.
```

Thank you, gentlemen, I went ahead and installed `rustup target add x86_64-pc-windows-gnu`. After that, I had a few more issues with the linter; yes, this project has a very nice automatic linter that is part of the build. The C people also live in the modern world. So do not judge the people above only by the language they speak. Again maintainer gives me hint after that I can use `export NO_RUST=1` to help with that and build only using C.

After `sdk build git` told me I was doing great, I could build the installer. Of course, even for something as simple as Git for Windows, the open-source path was not simple. `git build git-and-installer` started building the whole thing and then printed:

```
:: Synchronizing package databases...
 git-for-windows-aarch64                                                                  7.1 KiB  31.7 KiB/s 00:00 [####################################################################] 100%
 clangarm64                                                                             558.6 KiB  1181 KiB/s 00:00 [####################################################################] 100%
 git-for-windows-x86_64                                                                  18.8 KiB  32.8 KiB/s 00:01 [####################################################################] 100%
 git-for-windows-mingw32                                                                  8.7 KiB  15.3 KiB/s 00:01 [####################################################################] 100%
 mingw32                                                                                 39.7 KiB  55.8 KiB/s 00:01 [####################################################################] 100%
 mingw64                                                                                407.0 KiB   262 KiB/s 00:02 [####################################################################] 100%
 ucrt64                                                                                 576.3 KiB   137 KiB/s 00:04 [####################################################################] 100%
 clang64                                                                                563.9 KiB   147 KiB/s 00:04 [####################################################################] 100%
 msys                                                                                   481.6 KiB   150 KiB/s 00:03 [####################################################################] 100%
:: Starting core system upgrade...
 there is nothing to do
:: Starting full system upgrade...
error: failed to prepare transaction (package architecture is not valid)
:: package git-extra-1.1.696.db26e322c-1-aarch64 does not have a valid architecture
```

This was obviously very bad, because I had to figure out where the problem was and find where the `sdk` command is implemented in bash. That command is handled by `C:\git-sdk-64\etc\profile.d\git-sdk.sh`. If you go to line 355, you’ll see something like this:

```
git-and-installer)
	sdk build git &&
	echo "============== Running make strip install ==================" && make -C "$src_dir" strip install &&
	#echo "============== Updating MINGW installation ==============" && pacman -Syyu git-extra &&
	sdk init build-extra &&
	"$src_dir"/installer/release.sh "${3:-0-test}"
	;;
```

The `echo` trick was my debugging, and the commented `pacman` line is the "fix." In general, it is not completely honest, because it means I am not updating dependencies as I should. But for local development, I don’t think that matters much. If you are interested in where this problem came from, then in `C:\git-sdk-64\etc\pacman.conf` there is a section:

```
[git-for-windows-aarch64]
Server = https://raw.githubusercontent.com/git-for-windows/pacman-repo/refs/heads/aarch64
```
which likely means the build is targeting Windows for ARM64. This is logical overall, since the platform also needs to support this architecture. An alternative fix for people on x86_64 is to comment out this block for local work and leave `git-sdk.sh` alone.

After that, everything built successfully, and the process wrote where it saved the new installer. We launched it, installed it, and now we could clone Linux onto Windows.

# Final thoughts

Maybe you will manage to hack something more interesting, and somehow contribute to Linux without WSL. That would be pretty cool.

After I finish hacking, other guy tell that Linux rename files in the tree which prevent cloning on Windows, so whole excercise was pointless probably, but hey. It was fun. Hope you enjoy the adventure same way I as I am.