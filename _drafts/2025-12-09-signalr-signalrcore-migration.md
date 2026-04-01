---
layout: post
title:  "How to migrate SignalR to SignalR Core safely"
date:   2025-12-09 15:57:44 +0500
categories: en dotnet
comments: true
---

Currenly I maintain one legacy .NET project and now I have to somehow migrate SignalR to SignalR Core without disrupting logic and rewriting large blocks of code. This project which was originally develped by me in .NET Framework, and some part of it was cross compiled between .NET Framework and .NET Core. Everything would be good but at the time of .NET Core 2.1 project was frozen, and left in limbo. Unfortunately that was ideal time for migration between stack, and it was more less painless.

# Situation

Let's try to explain my current situation a bit.

I have an API written using ASP.NET WebAPI + OWIN. This API is stateful because of reasons. The client is written in JavaScript and uses SignalR to communicate with the server. Now I obviosuly want to migrate server to .NET Core. All logic is mostly migrated and cross-compiled for a long time, since MVC is such easy to port (even at .NET 1.0 timeline it was easy).
